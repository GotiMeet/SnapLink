import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useVerificationResend } from '@/hooks/useVerificationResend';

/**
 * Contextual alert shown above every authenticated page while the account is
 * unverified (SCR-AUTH-12E).
 *
 * The mutation and its 60-second wait live in useVerificationResend, which
 * shares the cooldown with the copy of this control in Settings -> Profile.
 * Both are on screen together on that page, and with separate timers a user
 * could spend two of the server's three hourly sends in two clicks.
 */
export function UnverifiedEmailBanner() {
  const { user } = useAuth();
  const resend = useVerificationResend();

  if (!user || user.isEmailVerified) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-sm border-b border-warning/30 bg-warning/10 px-md py-sm"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-warning-text" aria-hidden />
      <p className="flex-1 text-body-md text-content-primary">
        Verify <strong className="font-semibold">{user.email}</strong> to secure your
        account.
      </p>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => resend.resend(user.email)}
        loading={resend.isPending}
        disabled={resend.active}
      >
        {resend.active ? `Resend in ${resend.remaining}s` : 'Resend email'}
      </Button>
    </div>
  );
}
