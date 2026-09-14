import { Check, Circle } from 'lucide-react';

import { cn } from '@/lib/cn';
import { PASSWORD_RULES } from '@/lib/password';

/**
 * Live checklist of the account-password rules the API enforces, shown beneath
 * the password field on signup, reset, and security settings.
 */
export function PasswordRequirements({ value, id }: { value: string; id?: string }) {
  return (
    <ul id={id} className="flex flex-col gap-3xs">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value);
        const Icon = met ? Check : Circle;
        return (
          <li
            key={rule.label}
            className={cn(
              'flex items-center gap-2xs text-body-sm',
              met ? 'text-success-text' : 'text-content-tertiary'
            )}
          >
            <Icon className={cn('h-3 w-3 shrink-0', !met && 'opacity-60')} aria-hidden />
            <span>{rule.label}</span>
            <span className="sr-only">{met ? '— met' : '— not met'}</span>
          </li>
        );
      })}
    </ul>
  );
}
