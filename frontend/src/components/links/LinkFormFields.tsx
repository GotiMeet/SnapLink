import { Globe, Lock } from 'lucide-react';

import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { RadioCards, type RadioCardOption } from '@/components/ui/RadioCards';
import { nowInputValue } from '@/lib/dates';
import { LINK_PASSWORD_MAX, LINK_PASSWORD_MIN } from '@/lib/links';
import type { Visibility } from '@/types/models';

/** Resolved once: it cannot change while the page is open. */
const localTimeZone = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {
    return '';
  }
})();

/**
 * Public / private choice and the password it conditionally requires.
 *
 * The password field appears only for private, because the API rejects a
 * password on a public link outright — rendering it always would offer an input
 * whose value can only produce a 400.
 *
 * On the edit form a private link that already has a password does not require
 * a new one, so `passwordOptional` lets the field mean "change it" rather than
 * "set it". The existing password is never shown: it is stored as a hash and
 * never serialized.
 */
export function VisibilityFields({
  visibility,
  onVisibilityChange,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  passwordOptional = false,
  passwordError,
  disabled,
}: {
  visibility: Visibility;
  onVisibilityChange: (value: Visibility) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  passwordOptional?: boolean;
  passwordError?: string;
  disabled?: boolean;
}) {
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const options: ReadonlyArray<RadioCardOption<Visibility>> = [
    {
      value: 'public',
      label: 'Public',
      hint: 'Anyone with the link',
      icon: <Globe className="h-4 w-4" />,
    },
    {
      value: 'private',
      label: 'Protected',
      hint: 'Password required',
      icon: <Lock className="h-4 w-4" />,
    },
  ];

  return (
    <fieldset className="flex flex-col gap-sm" disabled={disabled}>
      <legend className="mb-2xs text-label-lg text-content-primary">Visibility</legend>

      <RadioCards
        label="Visibility"
        options={options}
        value={visibility}
        onChange={onVisibilityChange}
        disabled={disabled}
      />

      {visibility === 'private' && (
        <div className="flex flex-col gap-sm">
          <PasswordInput
            label={passwordOptional ? 'New link password' : 'Link password'}
            name="linkPassword"
            autoComplete="new-password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            error={passwordError}
            hint={
              passwordOptional
                ? 'Leave blank to keep the current password.'
                : `${LINK_PASSWORD_MIN}–${LINK_PASSWORD_MAX} characters. Share it with whoever should reach the destination.`
            }
          />

          {password.length > 0 && (
            <PasswordInput
              label="Confirm link password"
              name="confirmLinkPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => onConfirmPasswordChange(event.target.value)}
              error={mismatch ? 'Passwords do not match' : undefined}
            />
          )}
        </div>
      )}
    </fieldset>
  );
}

/**
 * Optional activation and expiry.
 *
 * Both must be in the future and expiry must be strictly later than activation;
 * the API enforces all three and answers 400 or 422, so these are mirrored here
 * only to catch the mistake before a round trip.
 *
 * A link with a future activation date is created `inactive` and the scheduler
 * flips it live, which is why the hint says so rather than implying it resolves
 * immediately.
 */
export function ScheduleFields({
  liveAt,
  onLiveAtChange,
  deleteAt,
  onDeleteAtChange,
  liveError,
  deleteError,
  disabled,
}: {
  liveAt: string;
  onLiveAtChange: (value: string) => void;
  deleteAt: string;
  onDeleteAtChange: (value: string) => void;
  liveError?: string;
  deleteError?: string;
  disabled?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-sm" disabled={disabled}>
      <legend className="mb-2xs text-label-lg text-content-primary">
        Scheduling <span className="text-content-tertiary">(optional)</span>
      </legend>

      {/*
        Values are entered as local wall-clock time and converted to ISO for the
        API, which is handled in lib/dates.ts — but nothing said so, while the
        analytics screens state plainly that they report in UTC. A user
        scheduling a 9am launch had no confirmation of whose 9am.
      */}
      <p className="-mt-2xs text-body-sm text-content-tertiary">
        Times are in your timezone{localTimeZone ? ` (${localTimeZone})` : ''}.
      </p>

      <Input
        label="Go live"
        type="datetime-local"
        name="scheduledLiveAt"
        min={nowInputValue()}
        value={liveAt}
        onChange={(event) => onLiveAtChange(event.target.value)}
        error={liveError}
        hint="Leave blank to publish immediately. A future date creates the link as Scheduled."
      />

      <Input
        label="Expires"
        type="datetime-local"
        name="scheduledDeleteAt"
        min={liveAt || nowInputValue()}
        value={deleteAt}
        onChange={(event) => onDeleteAtChange(event.target.value)}
        error={deleteError}
        hint="Leave blank to keep the link live indefinitely."
      />
    </fieldset>
  );
}
