import { useCallback, useEffect, useState } from 'react';

/**
 * Counts a cooldown down in whole seconds.
 *
 * Verification resends are limited to one per minute server-side, and there is
 * no endpoint that reports how much of that minute is left. PROJECT_MASTER.md
 * section 11 is explicit that the wait is timed client-side after a successful
 * resend, so the button disables itself instead of inviting a 429.
 */
export function useCooldown() {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  const start = useCallback((seconds: number) => setRemaining(seconds), []);

  return { remaining, start, active: remaining > 0 };
}
