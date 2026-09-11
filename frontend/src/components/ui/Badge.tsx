import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent' | 'primary';

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-subtle text-content-secondary border-border-subtle',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  accent: 'bg-accent/10 text-accent border-accent/20',
  primary: 'bg-primary-600/10 text-primary-600 border-primary-600/20',
};

export function Badge({
  tone = 'neutral',
  icon,
  children,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2xs rounded-sm border px-xs py-3xs text-label-md',
        TONES[tone]
      )}
    >
      {icon}
      {children}
    </span>
  );
}
