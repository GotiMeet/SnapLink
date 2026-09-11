import { useRef, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface TabDefinition<T extends string> {
  id: T;
  label: ReactNode;
  /** Rendered after the label, e.g. a count chip. */
  badge?: ReactNode;
}

/**
 * Underlined tab strip. Extracted once the Recycle Bin became the second
 * consumer alongside the analytics screen, not before.
 *
 * Follows the WAI-ARIA tabs pattern: exactly one tab is in the tab order at a
 * time and the arrows move between them, so reaching the panel does not mean
 * tabbing through every section first. Home and End jump to the ends.
 *
 * Panels are owned by the caller rather than nested here — both consumers drive
 * the active tab from the URL, so the selected panel is decided upstream.
 */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: ReadonlyArray<TabDefinition<T>>;
  active: T;
  onChange: (id: T) => void;
  /** Accessible name for the tab strip itself. */
  label: string;
}) {
  const stripRef = useRef<HTMLDivElement>(null);

  const focusTab = (index: number) => {
    const buttons =
      stripRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [];
    const target = buttons[index];
    if (!target) return;
    target.focus();
    // Selection follows focus, which is the expected behaviour when switching
    // panels is cheap — both of ours are already loaded.
    onChange(tabs[index]!.id);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const current = tabs.findIndex((tab) => tab.id === active);
    if (current === -1) return;

    let next: number | null = null;
    if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;

    if (next === null) return;
    event.preventDefault();
    focusTab(next);
  };

  return (
    <div
      ref={stripRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      /*
       * overflow-y must be pinned: setting only overflow-x computes the other
       * axis to `auto`, and the tabs' -mb-px overflows by exactly that pixel,
       * which paints a stray vertical scrollbar beside the strip.
       */
      className="flex gap-2xs overflow-x-auto overflow-y-hidden border-b border-border-subtle"
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              '-mb-px flex shrink-0 items-center gap-xs border-b-2 px-sm py-xs text-body-md transition-colors',
              selected
                ? 'border-primary-600 font-semibold text-primary-600'
                : 'border-transparent text-content-secondary hover:text-content-primary'
            )}
          >
            {tab.label}
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
}

/** Wrapper that ties a panel to its tab for assistive technology. */
export function TabPanel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      className="focus-visible:outline-none"
    >
      {children}
    </div>
  );
}
