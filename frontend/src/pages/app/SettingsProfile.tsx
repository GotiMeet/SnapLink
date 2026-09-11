import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BadgeCheck, Mail, Monitor, Moon, Sun } from 'lucide-react';

import { resendVerificationEmail, updateProfile } from '@/api/auth';
import { ME_QUERY_KEY } from '@/auth/authContext';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useCooldown } from '@/hooks/useCooldown';
import { useTheme, type ThemeChoice } from '@/hooks/useTheme';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import type { User } from '@/types/models';

const MAX_NAME = 100;
const RESEND_COOLDOWN_SECONDS = 60;

/** SCR-AUTH-12 / 12E. */
export function SettingsProfilePage() {
  const { user, status } = useAuth();

  if (status === 'loading' || !user) {
    return (
      <div className="flex flex-col gap-lg">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      <ProfileCard user={user} />
      <ThemeCard />
    </div>
  );
}

const initialsOf = (fullName: string) =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

function ProfileCard({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(user.fullName);

  const saveMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      // PATCH returns the whole user, so the cache can be seeded rather than
      // invalidated — no second round trip for something already in hand.
      queryClient.setQueryData(ME_QUERY_KEY, updated);
      setFullName(updated.fullName);
      toast.success('Profile updated');
    },
  });

  // Keeps the field in step when the user changes elsewhere, without stamping
  // over what is currently being typed.
  useEffect(() => {
    if (!saveMutation.isPending) setFullName(user.fullName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.fullName]);

  const trimmed = fullName.trim();
  const dirty = trimmed !== user.fullName;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!trimmed || !dirty) return;
    saveMutation.mutate(trimmed);
  };

  const apiError = saveMutation.error instanceof ApiError ? saveMutation.error : null;

  return (
    <Card className="p-lg">
      <h2 className="text-heading-md">Profile</h2>

      <div className="mt-lg flex flex-wrap items-center gap-md">
        {/*
          The picture comes from Google when the account was created there.
          There is no upload endpoint and section 9 rules one out, so this is
          display-only with an initials fallback.
        */}
        {user.profilePicture ? (
          <img
            src={user.profilePicture}
            alt=""
            referrerPolicy="no-referrer"
            className="h-16 w-16 rounded-full border border-border-subtle object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 text-heading-md text-white"
          >
            {initialsOf(user.fullName)}
          </span>
        )}

        <div className="flex min-w-0 flex-col gap-2xs">
          <p className="flex flex-wrap items-center gap-xs">
            <Badge tone={user.authProvider === 'google' ? 'accent' : 'neutral'}>
              {user.authProvider === 'google'
                ? 'Signed in via Google'
                : 'Signed in via email'}
            </Badge>
          </p>
          <p className="text-body-sm text-content-tertiary">
            Member since {formatDate(user.createdAt)}
          </p>
        </div>
      </div>

      <form className="mt-lg flex flex-col gap-md" onSubmit={submit} noValidate>
        {apiError && !apiError.isValidation && (
          <Alert tone="danger">{apiError.message}</Alert>
        )}
        {!apiError && saveMutation.isError && (
          <Alert tone="danger">
            Unable to reach SnapLink. Check your connection and try again.
          </Alert>
        )}

        <Input
          label="Full name"
          name="fullName"
          required
          maxLength={MAX_NAME}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          error={apiError?.fieldError('fullName')}
          hint={`${fullName.length}/${MAX_NAME}`}
          disabled={saveMutation.isPending}
        />

        <EmailRow user={user} />

        <div className="flex justify-end">
          <Button
            type="submit"
            loading={saveMutation.isPending}
            disabled={!trimmed || !dirty}
          >
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

/**
 * Email is read-only: there is no endpoint that changes it, so an editable
 * field would be an input with nowhere to send its value.
 *
 * SCR-AUTH-12E is the unverified branch. The 60-second wait is timed on the
 * client after a send, because nothing reports the remaining cooldown and the
 * server only discloses it by refusing with a 429 (section 11).
 */
function EmailRow({ user }: { user: User }) {
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

  return (
    <div className="flex flex-col gap-2xs">
      <Input
        label="Email address"
        type="email"
        value={user.email}
        readOnly
        disabled
        hint="Your email address cannot be changed."
      />

      {user.isEmailVerified ? (
        <p className="flex items-center gap-2xs text-body-sm text-success">
          <BadgeCheck className="h-4 w-4" aria-hidden />
          Verified
        </p>
      ) : (
        <Alert
          tone="warning"
          title="Email not verified"
          action={
            <Button
              size="sm"
              variant="secondary"
              loading={resendMutation.isPending}
              disabled={cooldown.active}
              onClick={() => resendMutation.mutate(user.email)}
            >
              <Mail className="h-4 w-4" aria-hidden />
              {cooldown.active
                ? `Resend in ${cooldown.remaining}s`
                : 'Resend verification email'}
            </Button>
          }
        >
          <p>
            Verify <strong className="font-semibold">{user.email}</strong> to secure your
            account. Links expire 15 minutes after they are sent.
          </p>
        </Alert>
      )}
    </div>
  );
}

const THEMES: Array<{
  value: ThemeChoice;
  label: string;
  hint: string;
  Icon: typeof Sun;
}> = [
  { value: 'light', label: 'Light', hint: 'Always light', Icon: Sun },
  { value: 'dark', label: 'Dark', hint: 'Always dark', Icon: Moon },
  { value: 'system', label: 'System', hint: 'Follow your device', Icon: Monitor },
];

/**
 * Theme is stored in localStorage and nowhere else, so there is no save button
 * and nothing to fail — the choice applies the moment it is made.
 */
function ThemeCard() {
  const { theme, setTheme } = useTheme();

  return (
    <Card className="p-lg">
      <h2 className="text-heading-md">Appearance</h2>
      <p className="mt-2xs text-body-md text-content-secondary">
        Saved on this device. It applies immediately and is not synced to your account.
      </p>

      <div
        role="radiogroup"
        aria-label="Colour theme"
        className="mt-md grid gap-xs sm:grid-cols-3"
      >
        {THEMES.map(({ value, label, hint, Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={theme === value}
            onClick={() => setTheme(value)}
            className={cn(
              'flex items-start gap-xs rounded-md border p-sm text-left transition-colors',
              theme === value
                ? 'border-primary-600 bg-primary-50'
                : 'border-border-subtle hover:border-border-strong'
            )}
          >
            <Icon
              className={cn(
                'mt-3xs h-4 w-4 shrink-0',
                theme === value ? 'text-primary-600' : 'text-content-tertiary'
              )}
              aria-hidden
            />
            <span className="flex flex-col">
              <span className="text-label-lg text-content-primary">{label}</span>
              <span className="text-body-sm text-content-secondary">{hint}</span>
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
