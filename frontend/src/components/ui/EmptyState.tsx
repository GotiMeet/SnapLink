import type { ReactNode } from 'react';

/**
 * Icon in a tinted circle, short positive headline, one or two sentences, and a
 * single primary action (PROJECT_MASTER.md section 7, empty states).
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-md px-md py-3xl text-center">
      <span
        aria-hidden
        className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600"
      >
        {icon}
      </span>
      <div className="flex flex-col gap-2xs">
        <h2 className="text-heading-md">{title}</h2>
        {description && (
          <p className="max-w-md text-body-md text-content-secondary">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
