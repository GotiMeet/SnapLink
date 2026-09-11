import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { resendVerificationEmail } from '@/api/auth';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

/**
 * Shown on every authenticated page while the account is unverified.
 *
 * The 60-second cooldown is timed client-side after a successful send: there is
 * no endpoint to read the remaining cooldown, and the backend only reveals it
 * through a 429 (PROJECT_MASTER.md section 11).
 */
export function UnverifiedEmailBanner() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  if (!user || user.isEmailVerified) return null;

  const startCooldown = () => {
    setCooldown(60);
    const id = window.setInterval(() => {
      setCooldown((value) => {
        if (value <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerificationEmail(user.email);
      toast.success('Verification email sent. Check your inbox.');
      startCooldown();
    } catch (error) {
      if (error instanceof ApiError && error.isRateLimited) {
        toast.error(error.message);
        startCooldown();
      } else {
        toast.error('Could not send the email. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-sm border-b border-warning/30 bg-warning/10 px-md py-sm"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-warning" aria-hidden />
      <p className="flex-1 text-body-md text-content-primary">
        Verify <strong className="font-semibold">{user.email}</strong> to secure your
        account.
      </p>
      <Button
        size="sm"
        variant="secondary"
        onClick={handleResend}
        loading={sending}
        disabled={cooldown > 0}
      >
        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
      </Button>
    </div>
  );
}
