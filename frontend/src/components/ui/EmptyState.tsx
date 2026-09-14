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
  as: Heading = 'h2',
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  /**
   * Heading level. Defaults to h2, which is right when the empty state sits
   * inside a page that already has its own h1. A screen whose entire content is
   * an empty state — a 404, a not-found detail page — passes 'h1', so the
   * document is never left without one.
   */
  as?: 'h1' | 'h2';
}) {
  return (
    <div className="flex flex-col items-center gap-md px-md py-3xl text-center">
      <span
        aria-hidden
        className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-text"
      >
        {icon}
      </span>
      <div className="flex flex-col gap-2xs">
        <Heading className="text-heading-md">{title}</Heading>
        {description && (
          <p className="max-w-md text-body-md text-content-secondary">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
