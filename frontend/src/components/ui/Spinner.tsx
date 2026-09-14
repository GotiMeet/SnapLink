import { cn } from '@/lib/cn';

interface SpinnerProps {
  className?: string;
  label?: string;
}

/** Inline spinner. Decorative by default; give it a label when it stands alone. */
export function Spinner({ className, label }: SpinnerProps) {
  return (
    <span
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-current border-t-transparent',
        className ?? 'h-4 w-4'
      )}
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}

export function FullPageSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-canvas">
      <div className="flex flex-col items-center gap-sm text-content-secondary">
        <Spinner className="h-6 w-6" />
        <p role="status" className="text-body-md">
          {label}…
        </p>
      </div>
    </div>
  );
}
