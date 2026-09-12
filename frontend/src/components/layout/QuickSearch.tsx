import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, BarChart3, Clock, Folder, Link2, Search, X } from 'lucide-react';

import { env } from '@/env';
import { useProjects } from '@/hooks/useProjects';
import { useUrls } from '@/hooks/useUrls';
import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';

const shortLinkHost = env.appUrl.replace(/^https?:\/\//, '');
const MAX_PER_GROUP = 5;
const RECENT_COUNT = 4;

interface Result {
  id: string;
  to: string;
  title: string;
  subtitle: string;
  kind: 'project' | 'link';
  meta?: string;
}

interface Group {
  label: string;
  /** True when the group was capped, so the footer can say the count is partial. */
  truncated: boolean;
  results: Result[];
}

/**
 * `navigator.platform` is deprecated but still the only reliable signal here;
 * `userAgentData` is Chromium-only. A wrong guess costs a wrong hint, nothing
 * more — the shortcut itself listens for either modifier.
 */
const isMac = () =>
  typeof navigator !== 'undefined' && /mac/i.test(navigator.platform ?? '');

const toProjectResult = (project: { _id: string; title: string }, linkCount: number) => ({
  id: `project-${project._id}`,
  to: `/app/projects/${project._id}`,
  title: project.title,
  subtitle: `${formatCount(linkCount)} ${linkCount === 1 ? 'link' : 'links'}`,
  kind: 'project' as const,
});

const toLinkResult = (link: {
  _id: string;
  title: string;
  shortCode: string;
  clickCount: number;
}) => ({
  id: `link-${link._id}`,
  to: `/app/links/${link._id}`,
  title: link.title,
  subtitle: `${shortLinkHost}/${link.shortCode}`,
  kind: 'link' as const,
  meta: `${formatCount(link.clickCount)} visits`,
});

/**
 * Top-bar quick search (PROJECT_MASTER.md section 8).
 *
 * A client-side filter over the links and projects already loaded — there are
 * no server-side search parameters and none are needed at this scale. The full
 * command palette, with action shortcuts for creating a link or a project and
 * toggling the theme, is roadmap H8 and deliberately absent: this opens things,
 * it does not run commands.
 *
 * Built on Radix Dialog like the other overlays, so the focus trap, Escape and
 * focus restoration are the same ones section 7 requires everywhere else.
 *
 * Results are grouped rather than concatenated. Flat, every project carried the
 * literal subtitle "Project" — five identical grey words above a block of mono
 * URLs, with no way to see where one kind ended and the other began. The group
 * headers say what the repeated subtitle was saying, which frees that line to
 * carry something worth reading.
 */
export function QuickSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);

  // Both lists are already cached by the screens that use them, so opening this
  // usually costs nothing.
  const projectsQuery = useProjects();
  const urlsQuery = useUrls();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const combo = isMac() ? event.metaKey : event.ctrlKey;
      if (combo && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  const linkCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const link of urlsQuery.data ?? []) {
      counts.set(link.project, (counts.get(link.project) ?? 0) + 1);
    }
    return counts;
  }, [urlsQuery.data]);

  /**
   * With no query the palette offers the most recently updated items instead of
   * a bare sentence. It opens into its emptiest state every single time, and an
   * empty state that cannot be acted on is the worst use of that space — these
   * are the things a user is most likely to be looking for, and both lists are
   * already in the cache.
   */
  const recents = useMemo<Group[]>(() => {
    const links = (urlsQuery.data ?? []).slice(0, RECENT_COUNT).map(toLinkResult);
    const projects = (projectsQuery.data ?? [])
      .slice(0, 2)
      .map((project) => toProjectResult(project, linkCounts.get(project._id) ?? 0));

    return [
      { label: 'Recent links', truncated: false, results: links },
      { label: 'Recent projects', truncated: false, results: projects },
    ].filter((group) => group.results.length > 0);
  }, [urlsQuery.data, projectsQuery.data, linkCounts]);

  const matches = useMemo<Group[]>(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];

    const allProjects = (projectsQuery.data ?? []).filter((project) =>
      project.title.toLowerCase().includes(term)
    );
    const allLinks = (urlsQuery.data ?? []).filter(
      (link) =>
        link.title.toLowerCase().includes(term) ||
        link.shortCode.toLowerCase().includes(term)
    );

    return [
      {
        label: 'Links',
        truncated: allLinks.length > MAX_PER_GROUP,
        results: allLinks.slice(0, MAX_PER_GROUP).map(toLinkResult),
      },
      {
        label: 'Projects',
        truncated: allProjects.length > MAX_PER_GROUP,
        results: allProjects
          .slice(0, MAX_PER_GROUP)
          .map((project) => toProjectResult(project, linkCounts.get(project._id) ?? 0)),
      },
    ].filter((group) => group.results.length > 0);
  }, [query, projectsQuery.data, urlsQuery.data, linkCounts]);

  const searching = query.trim() !== '';
  const groups = searching ? matches : recents;
  // Flattened for arrow-key movement, which crosses group boundaries.
  const flat = useMemo(() => groups.flatMap((group) => group.results), [groups]);
  const truncated = groups.some((group) => group.truncated);

  // A shrinking list must never leave the highlight past its end.
  useEffect(() => setActiveIndex(0), [query]);

  const go = (result: Result | undefined) => {
    if (!result) return;
    setOpen(false);
    navigate(result.to);
  };

  const onInputKeyDown = (event: React.KeyboardEvent) => {
    if (flat.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % flat.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + flat.length) % flat.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(flat[activeIndex]);
    }
  };

  // Keeps the highlighted row in view when arrowing past the fold.
  useEffect(() => {
    const options = listRef.current?.querySelectorAll('[role="option"]');
    options?.[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const shortcutHint = isMac() ? '⌘K' : 'Ctrl K';
  let flatIndex = -1;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {/*
          Square below `md`, matching every other icon-only control in the bar.
          As a rounded-full pill with its label and hint hidden it collapsed to a
          lone circle between 640 and 768px, reading as an unrelated element.
        */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-transparent text-content-tertiary transition-colors hover:bg-surface-subtle hover:text-content-secondary md:w-44 md:justify-start md:gap-xs md:rounded-full md:border-border-subtle md:px-sm md:hover:border-border-strong md:hover:bg-transparent lg:w-64"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden flex-1 text-left text-body-md md:inline">Search</span>
          <kbd className="hidden rounded-sm border border-border-subtle px-2xs py-3xs text-caption md:inline">
            {shortcutHint}
          </kbd>
          <span className="sr-only">Search links and projects</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-[10vh] z-50 flex max-h-[80vh] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface-card shadow-xl">
          <Dialog.Title className="sr-only">Search links and projects</Dialog.Title>
          <Dialog.Description className="sr-only">
            Type to filter. Use the arrow keys to move between results and Enter to open
            one.
          </Dialog.Description>

          <div className="flex shrink-0 items-center gap-sm border-b border-border-subtle px-md">
            <Search className="h-4 w-4 shrink-0 text-content-tertiary" aria-hidden />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search links and projects"
              aria-label="Search links and projects"
              role="combobox"
              aria-expanded={flat.length > 0}
              aria-controls="quick-search-results"
              aria-activedescendant={
                flat.length > 0 ? flat[activeIndex]?.id : undefined
              }
              /*
               * The global :focus-visible ring is suppressed here. On a bare
               * transparent input inside an overflow-hidden container it painted
               * a hard blue rectangle that ran to the modal's edge and cut
               * between the magnifier and the field — the first thing seen on
               * every open, since the field is autofocused. The field is the
               * only control in this row, so the focus state has nowhere useful
               * to go anyway.
               */
              // ring-0 alone is not enough: the base rule also sets a 2px ring
              // offset, and the offset width survives into the ring's own
              // calc() — so the blue rectangle and its dark halo both persisted.
              className="h-12 flex-1 bg-transparent text-body-lg text-content-primary outline-none placeholder:text-content-tertiary focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Dialog.Close
              aria-label="Close search"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-content-tertiary hover:bg-surface-subtle hover:text-content-primary"
            >
              <X className="h-4 w-4" aria-hidden />
            </Dialog.Close>
          </div>

          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto py-2xs">
            {groups.length === 0 ? (
              <div className="flex flex-col items-center gap-sm px-md py-2xl text-center">
                <span
                  aria-hidden
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle text-content-tertiary"
                >
                  <Search className="h-6 w-6" />
                </span>
                <p className="text-body-md text-content-secondary">
                  {searching ? (
                    <>
                      Nothing matches{' '}
                      <span className="font-semibold text-content-primary">
                        “{query.trim()}”
                      </span>
                    </>
                  ) : (
                    'Nothing to search yet. Shorten a link to get started.'
                  )}
                </p>
              </div>
            ) : (
              <div id="quick-search-results" role="listbox" aria-label="Search results">
                {groups.map((group) => (
                  <div key={group.label} role="group" aria-label={group.label}>
                    <p className="flex items-center gap-2xs px-md pb-3xs pt-xs text-label-md uppercase tracking-wide text-content-tertiary">
                      {!searching && <Clock className="h-3 w-3" aria-hidden />}
                      {group.label}
                    </p>

                    {group.results.map((result) => {
                      flatIndex += 1;
                      const index = flatIndex;
                      const active = index === activeIndex;

                      return (
                        <div
                          key={result.id}
                          id={result.id}
                          role="option"
                          aria-selected={active}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => go(result)}
                          className={cn(
                            'flex cursor-pointer items-center gap-sm border-l-2 px-md py-xs',
                            active
                              ? 'border-primary-600 bg-surface-subtle'
                              : 'border-transparent'
                          )}
                        >
                          {/*
                            The tinted tile is constant across states. Previously
                            the active row's own tint swallowed it, so the one row
                            meant to stand out was the one that lost an element.
                          */}
                          <span
                            aria-hidden
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-text"
                          >
                            {result.kind === 'project' ? (
                              <Folder className="h-4 w-4" />
                            ) : (
                              <Link2 className="h-4 w-4" />
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-body-md text-content-primary">
                              {result.title}
                            </span>
                            <span
                              className={cn(
                                'block truncate text-body-sm text-content-tertiary',
                                result.kind === 'link' && 'font-mono'
                              )}
                            >
                              {result.subtitle}
                            </span>
                          </span>

                          {result.meta && (
                            <span className="hidden shrink-0 items-center gap-3xs text-body-sm text-content-tertiary sm:flex">
                              <BarChart3 className="h-3 w-3" aria-hidden />
                              {result.meta}
                            </span>
                          )}

                          {active && (
                            <ArrowRight
                              className="h-4 w-4 shrink-0 text-content-tertiary"
                              aria-hidden
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/*
            Keyboard hints, which is what the footer of a command palette is for.
            It used to carry "Searches the links and projects already loaded" —
            a restatement of the empty state above it, describing the caching
            strategy rather than anything the user could act on.
          */}
          <div className="flex shrink-0 flex-wrap items-center gap-x-md gap-y-2xs border-t border-border-subtle px-md py-xs text-body-sm text-content-tertiary">
            <span className="flex items-center gap-3xs">
              <Key>↑</Key>
              <Key>↓</Key>
              navigate
            </span>
            <span className="flex items-center gap-3xs">
              <Key>↵</Key>
              open
            </span>
            <span className="flex items-center gap-3xs">
              <Key>esc</Key>
              close
            </span>
            {truncated && (
              <span className="ml-auto">Showing the first {MAX_PER_GROUP} of each</span>
            )}
          </div>

          {/*
            Announced only when typing stops, on its own node. As a live region
            over the visible footer it read every intermediate count back to the
            user as they typed.
          */}
          <SearchAnnouncement count={flat.length} query={query} searching={searching} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-5 items-center justify-center rounded-sm border border-border-subtle px-3xs text-caption text-content-secondary">
      {children}
    </kbd>
  );
}

/** Debounced so a screen reader hears one result count, not one per keystroke. */
function SearchAnnouncement({
  count,
  query,
  searching,
}: {
  count: number;
  query: string;
  searching: boolean;
}) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!searching) {
      setMessage('');
      return;
    }
    const timer = window.setTimeout(() => {
      setMessage(`${count} ${count === 1 ? 'result' : 'results'}`);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [count, query, searching]);

  return (
    <p aria-live="polite" className="sr-only">
      {message}
    </p>
  );
}
