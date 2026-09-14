import type { ReactNode } from 'react';

import { Card } from '@/components/ui/Card';

/**
 * The single-column card every screen inside BareLayout renders into: login,
 * signup, verification, password recovery, the password gate, and the
 * unavailable-link page.
 *
 * `<main>` already wraps this in BareLayout, so the heading here is the page's
 * only h1 — one per document, as the SEO requirement in section 14 states.
 */
export function AuthCard({
  title,
  description,
  icon,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="p-lg sm:p-xl">
      <div className="flex flex-col items-center gap-sm text-center">
        {icon}
        <div className="flex flex-col gap-2xs">
          <h1 className="text-heading-xl">{title}</h1>
          {description && (
            <p className="text-body-md text-content-secondary">{description}</p>
          )}
        </div>
      </div>

      {children && <div className="mt-lg">{children}</div>}

      {footer && (
        <div className="mt-lg text-center text-body-md text-content-secondary">
          {footer}
        </div>
      )}
    </Card>
  );
}

/**
 * Circular tinted badge above an auth card's heading, matching the empty-state
 * treatment in PROJECT_MASTER.md section 7.
 */
export function AuthCardIcon({
  children,
  tone = 'primary',
}: {
  children: ReactNode;
  tone?: 'primary' | 'success' | 'danger' | 'accent' | 'warning';
}) {
  const tones = {
    primary: 'bg-primary-50 text-primary-text',
    success: 'bg-success/10 text-success-text',
    danger: 'bg-danger/10 text-danger-text',
    accent: 'bg-accent/10 text-accent-text',
    warning: 'bg-warning/10 text-warning-text',
  } as const;

  return (
    <span
      aria-hidden
      className={`flex h-16 w-16 items-center justify-center rounded-full ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
