import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

type Tone = 'info' | 'success' | 'warning' | 'danger';

const TONES: Record<Tone, string> = {
  info: 'border-primary-600/20 bg-primary-50 text-content-primary',
  success: 'border-success/20 bg-success/10 text-content-primary',
  warning: 'border-warning/20 bg-warning/10 text-content-primary',
  danger: 'border-danger/20 bg-danger/10 text-content-primary',
};

const ICON_TONES: Record<Tone, string> = {
  info: 'text-primary-600',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

const ICONS: Record<Tone, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
};

/**
 * Contextual banner used for the form-level failures PROJECT_MASTER.md section
 * 10 puts above the form rather than under a field: 401 on login, 403 for an
 * unverified email, and every 429.
 *
 * Errors announce themselves with role="alert" — a coloured box a screen reader
 * never mentions is not an error message.
 */
export function Alert({
  tone = 'info',
  title,
  children,
  action,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const Icon = ICONS[tone];
  const assertive = tone === 'danger' || tone === 'warning';

  return (
    <div
      role={assertive ? 'alert' : 'status'}
      className={cn('flex gap-xs rounded-md border p-sm', TONES[tone])}
    >
      <Icon className={cn('mt-3xs h-4 w-4 shrink-0', ICON_TONES[tone])} aria-hidden />
      <div className="flex min-w-0 flex-col gap-2xs text-body-md">
        {title && <p className="text-label-lg">{title}</p>}
        {children}
        {action}
      </div>
    </div>
  );
}
