import { useCallback, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { resendVerificationEmail } from '@/api/auth';
import { ApiError } from '@/lib/api';

const COOLDOWN_SECONDS = 60;

/**
 * The cooldown deadline, shared by every control that can resend.
 *
 * WHY THIS IS MODULE STATE:
 * Two controls offer this action and both are on screen at once — the banner
 * above every authenticated page, and the card in Settings -> Profile. Each
 * owned a separate timer, so pressing one left the other enabled: two clicks
 * spent two thirds of the server's 3-per-hour allowance and landed the user on
 * a 429 carrying a wait they had never been shown.
 *
 * The limit is enforced per account server-side, so the client-side view of it
 * has to be per account too, not per component. There is no endpoint reporting
 * how much of the minute is left (PROJECT_MASTER.md section 11), which is why
 * this is timed here at all.
 */
let deadline = 0;
const listeners = new Set<() => void>();

const startCooldown = () => {
  deadline = Date.now() + COOLDOWN_SECONDS * 1000;
  listeners.forEach((listener) => listener());
};

const remainingSeconds = () => Math.max(0, Math.ceil((deadline - Date.now()) / 1000));

/**
 * Resend control for the verification email: one mutation, one cooldown, and
 * the same messaging wherever it appears.
 */
export function useVerificationResend() {
  const [remaining, setRemaining] = useState(remainingSeconds);

  useEffect(() => {
    const sync = () => setRemaining(remainingSeconds());
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  // One interval per mounted control, cleared as soon as the wait is over.
  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setInterval(() => setRemaining(remainingSeconds()), 1000);
    return () => window.clearInterval(timer);
  }, [remaining]);

  const mutation = useMutation({
    mutationFn: resendVerificationEmail,
    onSuccess: () => {
      toast.success('Verification email sent. Check your inbox.');
      startCooldown();
    },
    onError: (error) => {
      // A refusal starts the timer too, so a user who has hit the limit is not
      // invited straight back into it.
      if (error instanceof ApiError && error.isRateLimited) {
        toast.error(error.message);
        startCooldown();
        return;
      }
      toast.error('Could not send the email. Please try again.');
    },
  });

  const { mutate } = mutation;
  const resend = useCallback((email: string) => mutate(email), [mutate]);

  return {
    resend,
    isPending: mutation.isPending,
    remaining,
    active: remaining > 0,
  };
}
