import {
  BarChart3,
  CalendarClock,
  FolderKanban,
  Link2,
  Lock,
  QrCode,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

import { FeatureCard, MarketingSection, SignupCta } from '@/components/public/Marketing';
import { usePageMeta } from '@/hooks/usePageMeta';

/**
 * SCR-PUB-10.
 *
 * Every entry below maps to something the backend actually does. Nothing claims
 * a retention window, SVG QR output, UTM attribution, custom domains, uptime or
 * latency — PROJECT_MASTER.md section 9 rules all of them out, and none exists.
 */
const CAPABILITIES = [
  {
    icon: Link2,
    title: 'Custom aliases',
    body: 'Take the short code you want — 3 to 32 characters — or let SnapLink generate one. Availability is checked as you type.',
  },
  {
    icon: FolderKanban,
    title: 'Projects',
    body: 'Every link belongs to a project, so a client or a campaign stays grouped. Delete a project and its links go with it, recoverably.',
  },
  {
    icon: Lock,
    title: 'Password-protected links',
    body: 'Mark a link private and share the password separately. Visitors meet a gate; the destination is never sent to the browser until the password is accepted.',
  },
  {
    icon: CalendarClock,
    title: 'Scheduling',
    body: 'Give a link a go-live date, an expiry, or both. It stays dormant until its moment and stops resolving afterwards.',
  },
  {
    icon: QrCode,
    title: 'QR codes',
    body: 'Download a PNG for any link. Scans arrive tagged, so print and digital traffic never get confused with one another.',
  },
  {
    icon: BarChart3,
    title: 'Per-link analytics',
    body: 'A daily timeline of clicks and scans, plus referrers, devices, browsers, operating systems and languages, over any window up to 366 days.',
  },
  {
    icon: Trash2,
    title: 'Recycle Bin',
    body: 'Deleted links and projects stay recoverable until you restore them. Nothing is erased behind your back.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy by construction',
    body: 'No IP address, no raw user agent, no full referrer, no cookie and no per-visit row is ever written. A browser becomes one of six buckets before anything is stored.',
  },
] as const;

export function FeaturesPage() {
  usePageMeta({
    title: 'Features',
    description:
      'Custom aliases, project containers, password-protected links, scheduling, QR codes and privacy-first per-link analytics.',
  });

  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-md pb-2xl pt-4xl">
        <h1 className="text-display-lg">Everything SnapLink does</h1>
        <p className="mt-md max-w-3xl text-body-lg text-content-secondary">
          A short list, deliberately. Each of these is built and working — there is
          nothing here waiting on a roadmap.
        </p>
      </section>

      <MarketingSection id="capabilities" title="Capabilities">
        <div className="grid gap-md md:grid-cols-2 xl:grid-cols-3">
          {CAPABILITIES.map(({ icon, title, body }) => (
            <FeatureCard key={title} icon={icon} title={title}>
              {body}
            </FeatureCard>
          ))}
        </div>
      </MarketingSection>

      <SignupCta />
    </>
  );
}
