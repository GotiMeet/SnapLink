import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { BarChart3, Folder, Link2, Search } from 'lucide-react';

import { env } from '@/env';
import { useProjects } from '@/hooks/useProjects';
import { useUrls } from '@/hooks/useUrls';
import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';

const shortLinkHost = env.appUrl.replace(/^https?:\/\//, '');
const MAX_PER_GROUP = 5;

interface Result {
  id: string;
  to: string;
  title: string;
  subtitle: string;
  kind: 'project' | 'link';
  meta?: string;
}

/** Mac reports "MacIntel"; everything else gets Ctrl. */
const isMac = () =>
  typeof navigator !== 'undefined' && /mac/i.test(navigator.platform ?? '');

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
 */
export function QuickSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const listRef = useRef<HTMLUListElement>(null);

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

  const results = useMemo<Result[]>(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];

    const projects = (projectsQuery.data ?? [])
      .filter((project) => project.title.toLowerCase().includes(term))
      .slice(0, MAX_PER_GROUP)
      .map<Result>((project) => ({
        id: `project-${project._id}`,
        to: `/app/projects/${project._id}`,
        title: project.title,
        subtitle: 'Project',
        kind: 'project',
      }));

    const links = (urlsQuery.data ?? [])
      .filter(
        (link) =>
          link.title.toLowerCase().includes(term) ||
          link.shortCode.toLowerCase().includes(term)
      )
      .slice(0, MAX_PER_GROUP)
      .map<Result>((link) => ({
        id: `link-${link._id}`,
        to: `/app/links/${link._id}`,
        title: link.title,
        subtitle: `${shortLinkHost}/${link.shortCode}`,
        kind: 'link',
        meta: `${formatCount(link.clickCount)} visits`,
      }));

    return [...projects, ...links];
  }, [query, projectsQuery.data, urlsQuery.data]);

  // A shrinking list must never leave the highlight past its end.
  useEffect(() => setActiveIndex(0), [query]);

  const go = (result: Result | undefined) => {
    if (!result) return;
    setOpen(false);
    navigate(result.to);
  };

  const onInputKeyDown = (event: React.KeyboardEvent) => {
    if (results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(results[activeIndex]);
    }
  };

  // Keeps the highlighted row in view when arrowing past the fold.
  useEffect(() => {
    const options = listRef.current?.querySelectorAll('[role="option"]');
    options?.[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const shortcutHint = isMac() ? '⌘K' : 'Ctrl K';

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex h-10 items-center gap-xs rounded-full border border-border-subtle px-sm text-body-md text-content-tertiary transition-colors hover:border-border-strong hover:text-content-secondary md:w-44 lg:w-64"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden flex-1 text-left md:inline">Search</span>
          <kbd className="hidden rounded-sm border border-border-subtle px-2xs py-3xs text-caption md:inline">
            {shortcutHint}
          </kbd>
          <span className="sr-only">Search links and projects</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-lg border border-border-subtle bg-surface-card shadow-xl">
          <Dialog.Title className="sr-only">Search links and projects</Dialog.Title>
          <Dialog.Description className="sr-only">
            Type to filter. Use the arrow keys to move between results and Enter to open
            one.
          </Dialog.Description>

          <div className="flex items-center gap-xs border-b border-border-subtle px-md">
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
              aria-expanded={results.length > 0}
              aria-controls="quick-search-results"
              aria-activedescendant={
                results.length > 0 ? results[activeIndex]?.id : undefined
              }
              className="h-14 flex-1 bg-transparent text-body-lg text-content-primary outline-none placeholder:text-content-tertiary"
            />
          </div>

          <div className="max-h-80 overflow-y-auto">
            {query.trim() === '' ? (
              <p className="px-md py-lg text-center text-body-md text-content-tertiary">
                Start typing to search your links and projects.
              </p>
            ) : results.length === 0 ? (
              <p className="px-md py-lg text-center text-body-md text-content-tertiary">
                Nothing matches “{query.trim()}”.
              </p>
            ) : (
              <ul
                ref={listRef}
                id="quick-search-results"
                role="listbox"
                aria-label="Search results"
                className="py-2xs"
              >
                {results.map((result, index) => (
                  <li
                    key={result.id}
                    id={result.id}
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => go(result)}
                    className={cn(
                      'flex cursor-pointer items-center gap-sm px-md py-xs',
                      index === activeIndex && 'bg-surface-subtle'
                    )}
                  >
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
                      <span className="block truncate font-mono text-body-sm text-content-tertiary">
                        {result.subtitle}
                      </span>
                    </span>

                    {result.meta && (
                      <span className="flex shrink-0 items-center gap-3xs text-body-sm text-content-tertiary">
                        <BarChart3 className="h-3 w-3" aria-hidden />
                        {result.meta}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p
            aria-live="polite"
            className="border-t border-border-subtle px-md py-xs text-body-sm text-content-tertiary"
          >
            {query.trim() === ''
              ? 'Searches the links and projects already loaded.'
              : `${results.length} ${results.length === 1 ? 'result' : 'results'}`}
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
