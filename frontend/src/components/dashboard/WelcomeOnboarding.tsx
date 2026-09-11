import { BarChart3, FolderPlus, Link2, Plus, QrCode } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

/**
 * Shown only when the workspace is genuinely empty — no projects and no links.
 *
 * It replaces the metric tiles rather than sitting above four zeroes: a grid of
 * zeroes tells a first-run user nothing, and the four steps below are the only
 * thing on this screen they can act on.
 *
 * Step one is creating a project because `projectId` is required by POST /urls
 * and a link's project is fixed at creation (D3). Ordering it any other way
 * would describe a flow the API does not have.
 */
const STEPS = [
  {
    icon: FolderPlus,
    title: 'Create a project',
    body: 'Projects are the containers your links live in — one per client, campaign, or channel.',
  },
  {
    icon: Link2,
    title: 'Shorten your first URL',
    body: 'Paste a destination, give it a title, and claim a custom alias if you want one.',
  },
  {
    icon: QrCode,
    title: 'Share the link or its QR code',
    body: 'Copy the short URL, or download a PNG QR code for print.',
  },
  {
    icon: BarChart3,
    title: 'Watch the visits arrive',
    body: 'Every link reports its own clicks, QR scans, referrers, devices and languages.',
  },
] as const;

export function WelcomeOnboarding({
  fullName,
  onCreateProject,
}: {
  fullName: string;
  onCreateProject: () => void;
}) {
  const firstName = fullName.trim().split(' ')[0] || 'there';

  return (
    <Card className="p-lg sm:p-xl">
      <div className="flex flex-col gap-2xs">
        <h2 className="text-heading-xl">Welcome, {firstName}</h2>
        <p className="text-body-lg text-content-secondary">
          Four steps and your first link is live.
        </p>
      </div>

      <ol className="mt-lg grid gap-md sm:grid-cols-2">
        {STEPS.map(({ icon: Icon, title, body }, index) => (
          <li
            key={title}
            className="flex gap-sm rounded-lg border border-border-subtle p-md"
          >
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600"
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-label-lg text-content-primary">
                <span className="text-content-tertiary">Step {index + 1} · </span>
                {title}
              </p>
              <p className="mt-3xs text-body-md text-content-secondary">{body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-lg flex justify-center">
        <Button size="lg" onClick={onCreateProject}>
          <Plus className="h-4 w-4" aria-hidden />
          Create your first project
        </Button>
      </div>
    </Card>
  );
}
