import { useState } from 'react';
import { ChevronDown, Github, Mail } from 'lucide-react';

import { CopyButton } from '@/components/links/CopyButton';
import { MarketingSection } from '@/components/public/Marketing';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { env } from '@/env';
import { usePageMeta } from '@/hooks/usePageMeta';
import { cn } from '@/lib/cn';

/**
 * SCR-PUB-03.
 *
 * Direct channels, no inquiry form. There is no contact submission endpoint and
 * building one was rejected (D6) — a form here would collect a message with
 * nowhere to send it. The first application of the standing rule: when a screen
 * implies unsupported functionality, remove the element rather than add backend.
 *
 * Both channels come from configuration and each is rendered only when it is
 * set, so a deployment never advertises an address nobody reads.
 */
const FAQ = [
  {
    question: 'Can a link expire on its own?',
    answer:
      'Yes. A link can be given a go-live date, an expiry date, or both. It stays dormant until the first and stops resolving after the second. Both dates must be in the future, and the expiry has to be later than the go-live.',
  },
  {
    question: 'How do password-protected links work?',
    answer:
      'Mark a link private and give it a password of 6 to 72 characters. A visitor following it meets a gate and has to enter the password; the destination is never sent to their browser until the password is accepted. Share the password separately from the link.',
  },
  {
    question: 'Are QR scans counted separately from clicks?',
    answer:
      'Yes. The QR code SnapLink generates encodes a tagged address, so a scan is recorded as a scan. Building your own code from the plain short URL loses that — those scans would count as ordinary web clicks.',
  },
  {
    question: 'I deleted something. Can I get it back?',
    answer:
      'Yes. Deleted links and projects go to the Recycle Bin and stay there until you restore them — there is no permanent delete and no retention clock. Restoring a project brings back the links it took offline with it.',
  },
  {
    question: 'What do you record about the people who follow my links?',
    answer:
      'Nothing that identifies them. No IP address, no raw user agent, no full referrer, no cookie and no per-visit row is ever written. A browser is reduced to one of about six buckets and a referrer to its hostname before anything reaches the database.',
  },
] as const;

export function ContactPage() {
  usePageMeta({
    title: 'Contact',
    description:
      'Get in touch about SnapLink, report a bug, or find answers to common questions about links, passwords, QR scans and the Recycle Bin.',
  });

  const hasChannel = Boolean(env.supportEmail || env.repoUrl);

  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-md pb-2xl pt-4xl">
        <h1 className="text-display-lg">Get in touch</h1>
        <p className="mt-md max-w-3xl text-body-lg text-content-secondary">
          Questions, bug reports and feature suggestions all welcome. Most answers are in
          the FAQ below — it is worth a look first.
        </p>
      </section>

      {hasChannel && (
        <MarketingSection id="channels" title="Direct channels">
          <div className="grid gap-md md:grid-cols-2">
            {env.supportEmail && (
              <Card className="flex h-full flex-col gap-sm p-lg">
                <span
                  aria-hidden
                  className="flex h-12 w-12 items-center justify-center rounded-md bg-primary-50 text-primary-text"
                >
                  <Mail className="h-6 w-6" />
                </span>
                <h3 className="text-heading-md">Email support</h3>
                <p className="text-body-lg text-content-secondary">
                  For account questions and anything you would rather not post publicly.
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-xs pt-sm">
                  <a
                    href={`mailto:${env.supportEmail}`}
                    className="rounded-sm font-mono text-mono-code text-primary-text hover:underline"
                  >
                    {env.supportEmail}
                  </a>
                  <CopyButton value={env.supportEmail} label="support email" />
                </div>
                <p className="text-body-sm text-content-tertiary">
                  Replies usually within two working days.
                </p>
              </Card>
            )}

            {env.repoUrl && (
              <Card className="flex h-full flex-col gap-sm p-lg">
                <span
                  aria-hidden
                  className="flex h-12 w-12 items-center justify-center rounded-md bg-primary-50 text-primary-text"
                >
                  <Github className="h-6 w-6" />
                </span>
                <h3 className="text-heading-md">Bugs and feature requests</h3>
                <p className="text-body-lg text-content-secondary">
                  Open an issue on the repository. Public, tracked, and you can follow the
                  fix.
                </p>
                <div className="mt-auto pt-sm">
                  <a
                    href={`${env.repoUrl}/issues`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-sm text-body-md text-primary-text hover:underline"
                  >
                    Open an issue on GitHub
                  </a>
                </div>
              </Card>
            )}
          </div>
        </MarketingSection>
      )}

      {!hasChannel && (
        <MarketingSection id="channels" title="Direct channels">
          <Alert tone="info" title="No support channel is configured">
            <p>
              This deployment has not set a support email or repository link. Whoever runs
              it can add them with the <code>VITE_SUPPORT_EMAIL</code> and{' '}
              <code>VITE_REPO_URL</code> environment variables.
            </p>
          </Alert>
        </MarketingSection>
      )}

      <MarketingSection id="faq" eyebrow="Self-service" title="Common questions">
        <Card className="divide-y divide-border-subtle">
          {FAQ.map(({ question, answer }) => (
            <FaqItem key={question} question={question} answer={answer} />
          ))}
        </Card>
      </MarketingSection>
    </>
  );
}

/**
 * Native disclosure semantics rather than a hand-rolled accordion: a button
 * with aria-expanded controlling a region gets keyboard support, screen-reader
 * announcement and in-page find for free.
 */
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const id = question
    .toLowerCase()
    .replace(/[^a-z]+/g, '-')
    .replace(/^-|-$/g, '');

  return (
    <div>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`faq-${id}`}
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-md px-lg py-md text-left text-heading-md text-content-primary transition-colors hover:bg-surface-subtle"
        >
          <span className="flex-1">{question}</span>
          <ChevronDown
            className={cn(
              'h-5 w-5 shrink-0 text-content-tertiary transition-transform',
              open && 'rotate-180'
            )}
            aria-hidden
          />
        </button>
      </h3>
      <div id={`faq-${id}`} hidden={!open} className="px-lg pb-md">
        <p className="max-w-3xl text-body-lg text-content-secondary">{answer}</p>
      </div>
    </div>
  );
}
