import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  hint?: ReactNode;
  /** Visually hide the label but keep it for screen readers. */
  hideLabel?: boolean;
  /** Control rendered inside the field's right edge, e.g. a show/hide toggle. */
  trailing?: ReactNode;
}

/**
 * Label, hint and error are wired with aria-describedby and aria-invalid so a
 * 422 from the API is announced, not just coloured — required by the
 * accessibility commitment in PROJECT_MASTER.md section 7.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, hideLabel, trailing, className, ...rest },
  ref
) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex flex-col gap-2xs">
      <label
        htmlFor={id}
        className={cn('text-label-lg text-content-primary', hideLabel && 'sr-only')}
      >
        {label}
      </label>

      <div className="relative">
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            'h-10 w-full rounded-md border bg-surface-card px-sm text-body-md text-content-primary',
            'placeholder:text-content-tertiary',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
            error
              ? 'border-danger focus-visible:ring-danger/30'
              : 'border-border-subtle focus-visible:border-primary-600 focus-visible:ring-primary-600/20',
            'disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-content-tertiary',
            trailing ? 'pr-10' : null,
            className
          )}
          {...rest}
        />
        {trailing && (
          <span className="absolute inset-y-0 right-2xs flex items-center">
            {trailing}
          </span>
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="text-body-sm text-content-tertiary">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-body-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
