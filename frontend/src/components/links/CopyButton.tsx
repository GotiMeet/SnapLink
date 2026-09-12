import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { cn } from '@/lib/cn';
import { copyText } from '@/lib/clipboard';

/**
 * Copy-to-clipboard with the non-secure-context fallback in lib/clipboard.ts.
 *
 * The confirmation is the icon swapping to a tick for two seconds rather than a
 * toast: copying a short URL is something a user does repeatedly, and a toast
 * per copy would bury anything that actually needs attention.
 */
export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  /** What is being copied, for the button's accessible name. */
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async (event) => {
        event.stopPropagation();
        setCopied(await copyText(value));
      }}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      title={copied ? 'Copied' : `Copy ${label}`}
      className={cn(
        // 36px on touch. At the previous 24px this sat inside the same cluster
        // as the row's other controls and was the smallest target in the app.
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors md:h-8 md:w-8',
        copied
          ? 'text-success-text'
          : 'text-content-tertiary hover:bg-surface-subtle hover:text-content-primary',
        className
      )}
    >
      {copied ? (
        <Check className="h-4 w-4" aria-hidden />
      ) : (
        <Copy className="h-4 w-4" aria-hidden />
      )}
      {/* Announces the result to a screen reader, which cannot see the icon. */}
      <span aria-live="polite" className="sr-only">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </button>
  );
}
