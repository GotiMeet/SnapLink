import { useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

import { unlockShortLink } from '@/api/publicLinks';
import { AuthCard, AuthCardIcon } from '@/components/auth/AuthCard';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { env } from '@/env';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { usePageMeta } from '@/hooks/usePageMeta';

/** Short-link origin without its scheme, for displaying `snap.lk/my-code`. */
const shortLinkHost = env.appUrl.replace(/^https?:\/\//, '');

/**
 * SCR-PUB-09 — the password gate.
 *
 * SECURITY BOUNDARY (PROJECT_MASTER.md section 13):
 * This screen makes no access decision. It renders a form and posts it. It
 * never fetches the link, never reads `visibility` or `status`, and never sees
 * `originalUrl` until POST /:shortCode has already accepted the password
 * server-side.
 *
 * The request is issued with a plain promise rather than TanStack Query on
 * purpose. Both `useQuery` and `useMutation` retain their result, and the
 * destination must not survive anywhere a later visitor on the same browser
 * could reach it. Here it exists only as a local variable that is handed
 * straight to `location.replace`.
 */
export function UnlockPage() {
  usePageMeta({ title: 'Protected link', noindex: true });
  const { shortCode = '' } = useParams();
  const [params] = useSearchParams();

  // Only the exact marker is forwarded. Anything else in `src` is dropped
  // rather than reflected, matching how the backend built this redirect.
  const isQrVisit = params.get('src') === 'qr';

  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bumped on each failure so the shake animation replays on repeated attempts.
  const [attempt, setAttempt] = useState(0);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const originalUrl = await unlockShortLink({ shortCode, password, isQrVisit });
      // Replace rather than assign: the gate should not sit in the back stack,
      // where Back would re-post the form.
      window.location.replace(originalUrl);
      return;
    } catch (caught) {
      setError(messageFor(caught));
      setAttempt((value) => value + 1);
      setPassword('');
    }

    setSubmitting(false);
  };

  return (
    <AuthCard
      icon={
        <AuthCardIcon tone="accent">
          <ShieldCheck className="h-8 w-8" aria-hidden />
        </AuthCardIcon>
      }
      title="This link is protected"
      description="Enter the password shared with you to continue to the destination."
      footer={
        <Link to="/" className="text-primary-text hover:underline">
          Go to SnapLink
        </Link>
      }
    >
      <form className="flex flex-col gap-md" onSubmit={submit} noValidate>
        <p className="rounded-md border border-border-subtle bg-surface-subtle px-sm py-xs text-center font-mono text-mono-code text-content-secondary">
          {shortLinkHost}/{shortCode}
        </p>

        {error && <Alert tone="danger">{error}</Alert>}

        <div key={attempt} className={cn(attempt > 0 && error && 'animate-shake')}>
          <PasswordInput
            label="Link password"
            name="password"
            autoComplete="off"
            required
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
          />
        </div>

        <Button type="submit" fullWidth loading={submitting} disabled={!password}>
          Unlock link
        </Button>
      </form>
    </AuthCard>
  );
}

/**
 * Messages stay generic by design. The unlock limiter is per-IP across every
 * link and reports no attempt counter, so anything more specific than this
 * would be invented (PROJECT_MASTER.md section 13, rule 8).
 */
function messageFor(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Unable to reach SnapLink. Check your connection and try again.';
  }

  switch (error.status) {
    case 401:
      return 'Incorrect password. Please check and try again.';
    case 404:
      return 'This link is either inactive or no longer available.';
    case 429:
      return 'Too many unlock attempts. Please wait 15 minutes and try again.';
    default:
      return error.message;
  }
}
