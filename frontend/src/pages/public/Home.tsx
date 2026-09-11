import { Link } from 'react-router-dom';
import { BarChart3, FolderKanban, Link2, Lock, QrCode, ShieldCheck } from 'lucide-react';

import { FeatureCard, MarketingSection, SignupCta } from '@/components/public/Marketing';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { usePageMeta } from '@/hooks/usePageMeta';

/** SCR-PUB-01. */
export function HomePage() {
  usePageMeta({
    description:
      'Shorten URLs, organise them into projects, protect them with passwords, and track clicks and QR scans — without collecting anything that identifies a visitor.',
  });

  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-md pb-3xl pt-4xl">
        <div className="grid items-center gap-2xl lg:grid-cols-2">
          <div className="flex flex-col items-start gap-lg">
            <Badge tone="success" icon={<ShieldCheck className="h-3 w-3" aria-hidden />}>
              No tracking cookies for visitors
            </Badge>

            {/* The page's only h1. */}
            <h1 className="text-display-lg">
              Short links you can{' '}
              <span className="text-primary-text">organise and measure</span>
            </h1>

            <p className="max-w-xl text-body-lg text-content-secondary">
              SnapLink shortens a URL, files it under a project, and reports every click
              and QR scan — without storing an IP address, a raw user agent, or anything
              else that could identify the person who followed it.
            </p>

            <div className="flex flex-wrap gap-xs">
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

          <LinkPreviewIllustration />
        </div>
      </section>

      <MarketingSection
        id="pillars"
        eyebrow="Why SnapLink"
        title="Three things it does properly"
      >
        <div className="grid gap-md md:grid-cols-3">
          <FeatureCard icon={Link2} title="Fast shortening">
            Paste a destination, claim a custom alias if you want one, and share it. Links
            resolve straight from the short domain.
          </FeatureCard>
          <FeatureCard icon={FolderKanban} title="Campaign projects">
            Every link lives in a project, so a client, a channel, or a launch stays
            together instead of becoming a wall of unlabelled codes.
          </FeatureCard>
          <FeatureCard icon={BarChart3} title="Visual analytics">
            A daily timeline splitting web clicks from QR scans, plus referrers, devices,
            browsers, operating systems and languages.
          </FeatureCard>
        </div>
      </MarketingSection>

      <SignupCta />
    </>
  );
}

/**
 * A picture of a link, not a working one.
 *
 * `POST /urls` requires authentication and a projectId, and anonymous shortening
 * is a rejected product direction (R6), so an input here would promise a
 * capability the product deliberately does not have. The numbers are labelled as
 * an example so nobody reads them as live data.
 */
function LinkPreviewIllustration() {
  return (
    <div
      aria-hidden
      className="rounded-xl border border-border-subtle bg-surface-card p-lg shadow-lg"
    >
      <p className="text-label-md uppercase tracking-wide text-content-tertiary">
        Example link
      </p>

      <div className="mt-sm flex flex-wrap items-center gap-xs">
        <span className="font-mono text-heading-md text-primary-text">
          snap.lk/spring-launch
        </span>
        <Badge tone="success">Active</Badge>
        <Badge tone="accent" icon={<Lock className="h-3 w-3" />}>
          Protected
        </Badge>
      </div>

      <p className="mt-2xs truncate text-body-md text-content-tertiary">
        example.com/campaigns/spring/landing-page
      </p>

      <dl className="mt-lg grid grid-cols-3 gap-md border-t border-border-subtle pt-lg">
        <div>
          <dt className="text-body-sm text-content-secondary">Visits</dt>
          <dd className="text-heading-lg text-content-primary">1,284</dd>
        </div>
        <div>
          <dt className="text-body-sm text-content-secondary">Web</dt>
          <dd className="text-heading-lg text-content-primary">947</dd>
        </div>
        <div>
          <dt className="text-body-sm text-content-secondary">QR</dt>
          <dd className="text-heading-lg text-success-text">337</dd>
        </div>
      </dl>

      {/* A stylised code, not a scannable one — it encodes nothing. */}
      <div className="mt-lg flex items-center gap-md rounded-lg bg-surface-subtle p-md">
        <span className="flex h-16 w-16 items-center justify-center rounded-md bg-surface-card text-content-primary">
          <QrCode className="h-10 w-10" />
        </span>
        <p className="text-body-md text-content-secondary">
          Every link has a QR code. Scans are counted separately from web clicks.
        </p>
      </div>
    </div>
  );
}
