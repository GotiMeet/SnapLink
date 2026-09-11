import { useMutation } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { resendVerificationEmail } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useCooldown } from '@/hooks/useCooldown';
import { ApiError } from '@/lib/api';

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Contextual alert shown above every authenticated page while the account is
 * unverified (SCR-AUTH-12E).
 *
 * The 60-second wait is timed client-side after a send: no endpoint reports the
 * remaining cooldown, and the server only discloses it by refusing with a 429
 * (PROJECT_MASTER.md section 11). A rejection starts the timer too, so a user
 * who hits the limit is not invited straight back into it.
 */
export function UnverifiedEmailBanner() {
  const { user } = useAuth();
  const cooldown = useCooldown();

  const resendMutation = useMutation({
    mutationFn: resendVerificationEmail,
    onSuccess: () => {
      toast.success('Verification email sent. Check your inbox.');
      cooldown.start(RESEND_COOLDOWN_SECONDS);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.isRateLimited) {
        toast.error(error.message);
        cooldown.start(RESEND_COOLDOWN_SECONDS);
        return;
      }
      toast.error('Could not send the email. Please try again.');
    },
  });

  if (!user || user.isEmailVerified) return null;

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
        onClick={() => resendMutation.mutate(user.email)}
        loading={resendMutation.isPending}
        disabled={cooldown.active}
      >
        {cooldown.active ? `Resend in ${cooldown.remaining}s` : 'Resend email'}
      </Button>
    </div>
  );
}
