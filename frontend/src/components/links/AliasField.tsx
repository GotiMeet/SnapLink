import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, TriangleAlert } from 'lucide-react';

import { checkAliasAvailability } from '@/api/urls';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { env } from '@/env';
import { ALIAS_MAX, aliasFormatError } from '@/lib/links';

const shortLinkHost = env.appUrl.replace(/^https?:\/\//, '');

/**
 * Custom alias input with a debounced availability check.
 *
 * The check is advisory and says so by design: POST /urls claims the alias and
 * answers 409 if it went in the interval, which is the authoritative answer.
 * Nothing here gates submission — an "available" badge that decided whether the
 * form could be sent would be reconstructing a server decision client-side.
 *
 * The message never names another account. Aliases are global across all users,
 * so "already taken" is the only thing that can be said without confirming that
 * someone else's link exists (PROJECT_MASTER.md section 13, rule 7).
 */
export function AliasField({
  value,
  onChange,
  error,
  disabled,
  /** Alias the link already has, which is not a conflict for itself. */
  currentAlias,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  currentAlias?: string;
}) {
  const trimmed = value.trim();
  const [debounced, setDebounced] = useState(trimmed);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(trimmed), 400);
    return () => window.clearTimeout(timer);
  }, [trimmed]);

  const formatError = trimmed ? aliasFormatError(trimmed) : null;
  const isOwnAlias = Boolean(currentAlias) && trimmed === currentAlias;

  const availabilityQuery = useQuery({
    queryKey: ['alias-availability', debounced],
    queryFn: () => checkAliasAvailability(debounced),
    enabled:
      debounced.length > 0 &&
      debounced === trimmed &&
      aliasFormatError(debounced) === null &&
      !isOwnAlias,
    staleTime: 0,
  });

  const checking = availabilityQuery.isFetching;
  const available = availabilityQuery.data?.available;

  return (
    <Input
      label="Custom alias"
      name="customAlias"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      maxLength={ALIAS_MAX}
      placeholder="summer-sale"
      disabled={disabled}
      error={error ?? formatError ?? undefined}
      hint={
        <span className="flex flex-wrap items-center gap-xs">
          <span className="font-mono">
            {shortLinkHost}/{trimmed || 'random-code'}
          </span>
          {isOwnAlias && <span className="text-content-tertiary">Current alias</span>}
          {!isOwnAlias && checking && (
            <span className="flex items-center gap-3xs text-content-tertiary">
              <Spinner className="h-3 w-3" />
              Checking…
            </span>
          )}
          {!isOwnAlias && !checking && available === true && (
            <span className="flex items-center gap-3xs text-success">
              <Check className="h-3 w-3" aria-hidden />
              Available
            </span>
          )}
          {!isOwnAlias && !checking && available === false && (
            <span className="flex items-center gap-3xs text-warning">
              <TriangleAlert className="h-3 w-3" aria-hidden />
              This alias is already taken
            </span>
          )}
        </span>
      }
      trailing={
        checking ? (
          <Spinner className="mr-2xs h-4 w-4 text-content-tertiary" />
        ) : undefined
      }
    />
  );
}
