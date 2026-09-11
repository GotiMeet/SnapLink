import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/Button';

/**
 * Shared furniture for the four marketing pages.
 *
 * Every claim these render is limited to shipped behaviour. PROJECT_MASTER.md
 * section 9 rules out uptime, latency, retention windows, SVG QR output, UTM
 * attribution and custom domains — none of which exist — so none of them appear
 * in any copy passed through here.
 */
export function MarketingSection({
  id,
  eyebrow,
  title,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  const headingId = id ? `${id}-heading` : undefined;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="mx-auto w-full max-w-6xl px-md py-3xl"
    >
      {eyebrow && (
        <p className="text-label-md uppercase tracking-wide text-primary-text">
          {eyebrow}
        </p>
      )}
      <h2 id={headingId} className="mt-2xs text-display-md">
        {title}
      </h2>
      <div className="mt-xl">{children}</div>
    </section>
  );
}

export function FeatureCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col gap-sm rounded-lg border border-border-subtle bg-surface-card p-lg shadow-xs">
      <span
        aria-hidden
        className="flex h-12 w-12 items-center justify-center rounded-md bg-primary-50 text-primary-text"
      >
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="text-heading-md">{title}</h3>
      <p className="text-body-lg text-content-secondary">{children}</p>
    </div>
  );
}

/** Closing call to action, repeated at the foot of every marketing page. */
export function SignupCta({
  title = 'Start shortening in under a minute',
  body = 'Free to use, no card, no trial clock. Create a project, shorten your first link, and watch the visits arrive.',
}: {
  title?: string;
  body?: string;
}) {
  return (
    <section
      aria-labelledby="cta-heading"
      className="mx-auto w-full max-w-6xl px-md pb-4xl"
    >
      <div className="flex flex-col items-center gap-md rounded-xl border border-border-subtle bg-surface-card p-xl text-center shadow-sm">
        <h2 id="cta-heading" className="text-display-md">
          {title}
        </h2>
        <p className="max-w-2xl text-body-lg text-content-secondary">{body}</p>
        <div className="flex flex-wrap justify-center gap-xs">
          <Link to="/signup">
            <Button size="lg">Get started free</Button>
          </Link>
          <Link to="/features">
            <Button size="lg" variant="secondary">
              Explore features
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
