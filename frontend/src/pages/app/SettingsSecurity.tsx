import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BadgeCheck, KeyRound, Mail, ShieldAlert } from 'lucide-react';

import { changePassword, setPassword } from '@/api/auth';
import { PasswordRequirements } from '@/components/auth/PasswordRequirements';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api';
import { isPasswordValid } from '@/lib/password';
import type { User } from '@/types/models';

type Mode = 'change' | 'set';

/** SCR-AUTH-13. */
export function SettingsSecurityPage() {
  const { user, status } = useAuth();

  if (status === 'loading' || !user) {
    return (
      <div className="flex flex-col gap-lg">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      <SignInMethodsCard user={user} />
      <PasswordCard user={user} />
    </div>
  );
}

/**
 * How the account signs in today. Read-only: there is no endpoint to connect or
 * disconnect a provider, so nothing here is a control.
 *
 * No password age and no session list — section 9 rules both out, and neither
 * field exists on the API to begin with.
 */
function SignInMethodsCard({ user }: { user: User }) {
  return (
    <Card className="p-lg">
      <h2 className="text-heading-md">How you sign in</h2>

      <dl className="mt-md flex flex-col gap-sm">
        <div className="flex flex-wrap items-center gap-xs border-b border-border-subtle pb-sm">
          <dt className="flex-1 text-body-md text-content-primary">Account type</dt>
          <dd>
            <Badge tone={user.authProvider === 'google' ? 'accent' : 'neutral'}>
              {user.authProvider === 'google' ? 'Google account' : 'Email and password'}
            </Badge>
          </dd>
        </div>

        <div className="flex flex-wrap items-center gap-xs">
          <dt className="flex-1 text-body-md text-content-primary">
            <span className="flex items-center gap-2xs">
              <Mail className="h-4 w-4 text-content-tertiary" aria-hidden />
              {user.email}
            </span>
          </dt>
          <dd>
            {user.isEmailVerified ? (
              <Badge tone="success" icon={<BadgeCheck className="h-3 w-3" aria-hidden />}>
                Verified
              </Badge>
            ) : (
              <Badge
                tone="warning"
                icon={<ShieldAlert className="h-3 w-3" aria-hidden />}
              >
                Not verified
              </Badge>
            )}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

/**
 * D17, implemented in both directions.
 *
 * `GET /auth/me` cannot say whether an account has a password: the field is
 * `select: false` and `sanitizeUser` strips it, so nothing the client can read
 * answers the question. `authProvider` is the only signal available, and it is
 * not sufficient on its own — a Google user who already set a password should
 * see Change, not Set.
 *
 * So the provider chooses the opening form and the API corrects it:
 *  - `authProvider === 'google'` opens on Set. A 409 "already has a password"
 *    swaps the card to Change in place.
 *  - `authProvider === 'local'` opens on Change. A 409 "does not have a
 *    password" — which `changePassword` throws for an account with none —
 *    swaps the card to Set.
 *
 * Only one form is ever mounted, because the API permits exactly one per
 * account and offering both would guarantee that one of them 409s.
 */
function PasswordCard({ user }: { user: User }) {
  const [mode, setMode] = useState<Mode>(
    user.authProvider === 'google' ? 'set' : 'change'
  );
  /** Set once the API has corrected our guess, so the note explains the swap. */
  const [swapped, setSwapped] = useState(false);

  const swapTo = (next: Mode) => {
    setMode(next);
    setSwapped(true);
  };

  return (
    <Card className="p-lg">
      <div className="flex items-start gap-sm">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600"
        >
          <KeyRound className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-heading-md">
            {mode === 'set' ? 'Set a password' : 'Change password'}
          </h2>
          <p className="mt-2xs text-body-md text-content-secondary">
            {mode === 'set'
              ? 'Adding a password lets you sign in with your email as well as with Google.'
              : 'Choose a password you do not use anywhere else.'}
          </p>
        </div>
      </div>

      {swapped && (
        <div className="mt-md">
          <Alert tone="info">
            {mode === 'change'
              ? 'This account already has a password, so you can change it here instead.'
              : 'This account does not have a password yet, so set one here instead.'}
          </Alert>
        </div>
      )}

      <div className="mt-lg">
        {mode === 'set' ? (
          <SetPasswordForm onAlreadySet={() => swapTo('change')} />
        ) : (
          <ChangePasswordForm onNotSet={() => swapTo('set')} />
        )}
      </div>
    </Card>
  );
}

/**
 * Setting a first password does NOT end the session: `setPassword` never calls
 * `clearAuthCookies`, unlike `changePassword`. The copy says so rather than
 * borrowing the sign-out warning from the other form.
 */
function SetPasswordForm({ onAlreadySet }: { onAlreadySet: () => void }) {
  const [password, setPasswordValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const mutation = useMutation({
    mutationFn: setPassword,
    onSuccess: () => {
      setPasswordValue('');
      setConfirmPassword('');
      toast.success('Password set. You can now sign in with your email too.');
      // The account has one now, so the card becomes Change for the rest of
      // this session. A reload opens on Set again and the 409 corrects it.
      onAlreadySet();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.isConflict) onAlreadySet();
    },
  });

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit = isPasswordValid(password) && password === confirmPassword;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    mutation.mutate({ password, confirmPassword });
  };

  const apiError = mutation.error instanceof ApiError ? mutation.error : null;

  return (
    <form className="flex flex-col gap-md" onSubmit={submit} noValidate>
      {apiError && !apiError.isValidation && !apiError.isConflict && (
        <Alert tone="danger">{apiError.message}</Alert>
      )}
      {!apiError && mutation.isError && (
        <Alert tone="danger">
          Unable to reach SnapLink. Check your connection and try again.
        </Alert>
      )}

      <div className="flex flex-col gap-xs">
        <PasswordInput
          label="New password"
          name="newPassword"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPasswordValue(event.target.value)}
          error={apiError?.fieldError('password')}
          disabled={mutation.isPending}
        />
        <PasswordRequirements value={password} />
      </div>

      <PasswordInput
        label="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        error={
          mismatch ? 'Passwords do not match.' : apiError?.fieldError('confirmPassword')
        }
        disabled={mutation.isPending}
      />

      <Alert tone="info">
        You will stay signed in here. Your Google sign-in keeps working too.
      </Alert>

      <div className="flex justify-end">
        <Button type="submit" loading={mutation.isPending} disabled={!canSubmit}>
          Set password
        </Button>
      </div>
    </form>
  );
}

/**
 * A successful change revokes every session — including this one — and the
 * response clears the cookies, so the app is signed out by the time it returns.
 * The cache is cleared and the user routed to /login, where the existing
 * `?reset=success` banner tells them to sign in with the new password.
 *
 * D18: the copy says "including this one". Earlier drafts said "all other
 * devices", which was wrong.
 */
function ChangePasswordForm({ onNotSet }: { onNotSet: () => void }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirming, setConfirming] = useState(false);

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setConfirming(false);
      /*
       * A full document replace rather than a client navigation.
       *
       * The session is over server-side by the time this resolves — every
       * session was revoked and the cookies cleared — so the safest transition
       * is to discard the whole JS context, cache included. It also sidesteps
       * an ordering problem that a client navigation cannot win: clearing the
       * session first makes ProtectedRoute redirect to /login?redirect=… before
       * this runs, and navigating first lets PublicOnlyRoute bounce a
       * still-authenticated user to the dashboard. Login reads ?reset=success
       * and explains what happened.
       */
      window.location.replace('/login?reset=success');
    },
    onError: (error) => {
      setConfirming(false);
      if (error instanceof ApiError && error.isConflict) onNotSet();
    },
  });

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit =
    oldPassword.length > 0 &&
    isPasswordValid(newPassword) &&
    newPassword === confirmPassword;

  const apiError = mutation.error instanceof ApiError ? mutation.error : null;
  // 401 is the backend's answer for a wrong current password, not 400.
  const wrongCurrent = apiError?.status === 401;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    // Ending every session is disruptive enough to confirm once, after the
    // form is otherwise valid.
    setConfirming(true);
  };

  return (
    <>
      <form className="flex flex-col gap-md" onSubmit={submit} noValidate>
        {wrongCurrent && <Alert tone="danger">Current password is incorrect.</Alert>}
        {apiError && !wrongCurrent && !apiError.isValidation && !apiError.isConflict && (
          <Alert tone="danger">{apiError.message}</Alert>
        )}
        {!apiError && mutation.isError && (
          <Alert tone="danger">
            Unable to reach SnapLink. Check your connection and try again.
          </Alert>
        )}

        <PasswordInput
          label="Current password"
          name="currentPassword"
          autoComplete="current-password"
          required
          value={oldPassword}
          onChange={(event) => setOldPassword(event.target.value)}
          error={apiError?.fieldError('oldPassword')}
          disabled={mutation.isPending}
        />

        <div className="flex flex-col gap-xs">
          <PasswordInput
            label="New password"
            name="newPassword"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            error={apiError?.fieldError('newPassword')}
            disabled={mutation.isPending}
          />
          <PasswordRequirements value={newPassword} />
        </div>

        <PasswordInput
          label="Confirm new password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={
            mismatch ? 'Passwords do not match.' : apiError?.fieldError('confirmPassword')
          }
          disabled={mutation.isPending}
        />

        <Alert tone="warning">
          Changing your password signs you out on all devices, including this one. You
          will need to sign in again with the new password.
        </Alert>

        <div className="flex justify-end">
          <Button type="submit" loading={mutation.isPending} disabled={!canSubmit}>
            Change password
          </Button>
        </div>
      </form>

      <Modal
        open={confirming}
        onOpenChange={(open) => !open && setConfirming(false)}
        title="Change password and sign out everywhere?"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirming(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={mutation.isPending}
              onClick={() =>
                mutation.mutate({ oldPassword, newPassword, confirmPassword })
              }
            >
              Change password
            </Button>
          </>
        }
      >
        <p className="text-body-md text-content-secondary">
          Every signed-in device is signed out, including this browser. You will be taken
          to the sign-in page to continue with your new password.
        </p>
      </Modal>
    </>
  );
}
