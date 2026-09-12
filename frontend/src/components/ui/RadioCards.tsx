import { useRef, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface RadioCardOption<T extends string> {
  value: T;
  label: string;
  /** One short line under the label. */
  hint?: string;
  icon?: ReactNode;
}

/**
 * A row of selectable cards behaving as a real radio group.
 *
 * WHY THIS EXISTS:
 * Three places render this shape — link visibility, the top bar's theme
 * control, and Appearance in Profile — and all three declared
 * role="radiogroup" with role="radio" children while implementing neither
 * roving tabindex nor arrow-key movement. Announcing a radiogroup promises
 * arrows move within it, so a screen-reader user pressing Right got silence
 * and then had to discover Tab worked instead; every option was also its own
 * tab stop, which is exactly what the roving pattern exists to avoid.
 *
 * The WAI-ARIA radio pattern, as the Tabs component already implements for
 * tabs: one stop in the tab order, arrows move and select, Home and End jump
 * to the ends, and selection follows focus because choosing is free here.
 */
export function RadioCards<T extends string>({
  options,
  value,
  onChange,
  label,
  disabled,
  className,
  compact = false,
}: {
  options: ReadonlyArray<RadioCardOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Accessible name for the group itself. */
  label: string;
  disabled?: boolean;
  className?: string;
  /** Icon-only presentation, for the top bar's theme control. */
  compact?: boolean;
}) {
  const groupRef = useRef<HTMLDivElement>(null);

  const focusAt = (index: number) => {
    const radios =
      groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? [];
    const target = radios[index];
    if (!target) return;
    target.focus();
    onChange(options[index]!.value);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const current = options.findIndex((option) => option.value === value);
    if (current === -1) return;

    let next: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = (current + 1) % options.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = (current - 1 + options.length) % options.length;
    } else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = options.length - 1;

    if (next === null) return;
    event.preventDefault();
    focusAt(next);
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        compact
          ? 'flex items-center gap-3xs rounded-md border border-border-subtle p-3xs'
          : 'grid gap-xs sm:grid-cols-2',
        className
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;

        if (compact) {
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              title={option.label}
              // Roving: only the selected option is in the tab order.
              tabIndex={selected ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                'rounded-sm p-2xs transition-colors',
                selected
                  ? 'bg-primary-50 text-primary-text'
                  : 'text-content-tertiary hover:text-content-primary'
              )}
            >
              {option.icon}
            </button>
          );
        }

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex items-start gap-xs rounded-md border p-sm text-left transition-colors',
              selected
                ? 'border-primary-600 bg-primary-50'
                : 'border-border-subtle hover:border-border-strong',
              disabled && 'cursor-not-allowed opacity-60'
            )}
          >
            {option.icon && (
              <span
                className={cn(
                  'mt-3xs shrink-0',
                  selected ? 'text-primary-text' : 'text-content-tertiary'
                )}
                aria-hidden
              >
                {option.icon}
              </span>
            )}
            <span className="flex min-w-0 flex-col">
              <span className="text-label-lg text-content-primary">{option.label}</span>
              {option.hint && (
                <span className="text-body-sm text-content-secondary">{option.hint}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
