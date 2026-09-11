import { Check, Minus } from 'lucide-react';

import { MarketingSection, SignupCta } from '@/components/public/Marketing';
import { Card } from '@/components/ui/Card';
import { usePageMeta } from '@/hooks/usePageMeta';

/**
 * SCR-PUB-02.
 *
 * The comparison below is about design decisions, not benchmarks. There are no
 * latency or uptime figures anywhere on it, because nothing measurable backs
 * them at launch (section 9).
 */
const COMPARISON = [
  {
    point: 'Visitor tracking',
    snaplink: 'No IP, no raw user agent, no cookie, no per-visit row',
    legacy: 'Per-visit rows, often with identifiers attached',
  },
  {
    point: 'Organisation',
    snaplink: 'Every link belongs to a project, from creation',
    legacy: 'A flat list you are left to name your way out of',
  },
  {
    point: 'QR attribution',
    snaplink: 'Scans counted separately from web clicks',
    legacy: 'Scans folded into one click total',
  },
  {
    point: 'Deletion',
    snaplink: 'Soft delete with restore; nothing disappears silently',
    legacy: 'Immediate removal, or an opaque retention policy',
  },
  {
    point: 'Pricing tiers',
    snaplink: 'One free tier, no gated features',
    legacy: 'Aliases and analytics behind a paywall',
  },
] as const;

const PRINCIPLES = [
  {
    title: 'Privacy that cannot be quietly reversed',
    body: 'A policy can be changed by an edit nobody reviews. SnapLink has no code path that writes an identifying field, so the guarantee holds by construction rather than by promise.',
  },
  {
    title: 'One person, one workspace',
    body: 'There are no teams, roles, invitations or permission tiers. Every record belongs to exactly one account, which is what keeps the product quick to use and quick to reason about.',
  },
  {
    title: 'Nothing in the interface without something behind it',
    body: 'If a control appears, an endpoint answers it. Features that could not be built honestly were removed from the design rather than mocked up.',
  },
] as const;

export function AboutPage() {
  usePageMeta({
    title: 'About',
    description:
      'Why SnapLink exists: link organisation that scales past a flat list, and analytics that never store anything identifying about a visitor.',
  });

  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-md pb-2xl pt-4xl">
        <h1 className="text-display-lg">Built small, on purpose</h1>
        <p className="mt-md max-w-3xl text-body-lg text-content-secondary">
          SnapLink is a link manager for individual creators, freelancers and small
          businesses running several things at once. It does shortening, organisation and
          analytics — and stops there.
        </p>
      </section>

      <MarketingSection
        id="principles"
        eyebrow="How it is built"
        title="Three commitments"
      >
        <div className="grid gap-md md:grid-cols-3">
          {PRINCIPLES.map(({ title, body }) => (
            <Card key={title} className="h-full p-lg">
              <h3 className="text-heading-md">{title}</h3>
              <p className="mt-sm text-body-lg text-content-secondary">{body}</p>
            </Card>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        id="comparison"
        eyebrow="Where it differs"
        title="SnapLink vs a legacy shortener"
      >
        <Card className="overflow-hidden">
          {/* Scrolls inside its own container so the page never does. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-body-md">
              <caption className="sr-only">
                Design decisions compared with a typical legacy link shortener
              </caption>
              <thead>
                <tr className="border-b border-border-subtle text-label-md uppercase text-content-tertiary">
                  <th scope="col" className="px-md py-sm text-left">
                    Decision
                  </th>
                  <th scope="col" className="px-md py-sm text-left">
                    SnapLink
                  </th>
                  <th scope="col" className="px-md py-sm text-left">
                    Typical legacy shortener
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {COMPARISON.map((row) => (
                  <tr key={row.point}>
                    <th
                      scope="row"
                      className="px-md py-sm text-left text-label-lg text-content-primary"
                    >
                      {row.point}
                    </th>
                    <td className="px-md py-sm">
                      <span className="flex items-start gap-xs text-content-secondary">
                        <Check
                          className="mt-3xs h-4 w-4 shrink-0 text-success-text"
                          aria-hidden
                        />
                        {row.snaplink}
                      </span>
                    </td>
                    <td className="px-md py-sm">
                      <span className="flex items-start gap-xs text-content-tertiary">
                        <Minus className="mt-3xs h-4 w-4 shrink-0" aria-hidden />
                        {row.legacy}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </MarketingSection>

      <SignupCta
        title="Create a free account"
        body="No card, no tier to choose, no trial to run out. Everything described here is what you get."
      />
    </>
  );
}
