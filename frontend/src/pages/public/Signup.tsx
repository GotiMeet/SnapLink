import { useId, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { MailCheck } from 'lucide-react';

import { loginWithGoogle, register, resendVerificationEmail } from '@/api/auth';
import { AuthCard, AuthCardIcon } from '@/components/auth/AuthCard';
import { AuthDivider, GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { PasswordRequirements } from '@/components/auth/PasswordRequirements';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useAuth } from '@/hooks/useAuth';
import { useCooldown } from '@/hooks/useCooldown';
import { ApiError } from '@/lib/api';
import { isPasswordValid } from '@/lib/password';
import { usePageMeta } from '@/hooks/usePageMeta';

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * SCR-PUB-05.
 *
 * Registration does NOT sign the user in — the API returns a message and
 * nothing else — so success swaps this card for a check-your-inbox state rather
 * than navigating. Keeping the user here also keeps the address they typed,
 * which is what the resend control needs.
 *
 * Google sign-up is a different story: it returns a session, so it lands in the
 * app like a login.
 */
export function SignupPage() {
  usePageMeta({
    title: 'Create account',
    description: 'Create a free SnapLink account.',
    noindex: true,
  });
  const { signIn } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleFailed, setGoogleFailed] = useState(false);
  const [showPasswordError, setShowPasswordError] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const requirementsId = useId();

  const resendCooldown = useCooldown();

  const registerMutation = useMutation({ mutationFn: register });

  const googleMutation = useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: signIn,
  });

  const resendMutation = useMutation({
    mutationFn: resendVerificationEmail,
    onSuccess: () => resendCooldown.start(RESEND_COOLDOWN_SECONDS),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setGoogleFailed(false);

    if (!isPasswordValid(password)) {
      setShowPasswordError(true);
      passwordRef.current?.focus();
      return;
    }

    setShowPasswordError(false);
    registerMutation.mutate({ fullName: fullName.trim(), email: email.trim(), password });
  };

  if (registerMutation.isSuccess) {
    return (
      <AuthCard
        icon={
          <AuthCardIcon tone="success">
            <MailCheck className="h-8 w-8" aria-hidden />
          </AuthCardIcon>
        }
        title="Check your inbox"
        description={
          <>
            We sent a verification link to <strong>{email.trim()}</strong>. It expires in
            15 minutes.
          </>
        }
        footer={
          <Link to="/login" className="text-primary-text hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col gap-md">
          <Alert tone="warning">
            Verify within an hour. Unverified accounts are removed after that, and
            you&apos;ll need to register again.
          </Alert>

          {resendMutation.isSuccess && (
            <Alert tone="success">A new verification link is on its way.</Alert>
          )}

          {resendMutation.error instanceof ApiError && (
            <Alert tone="danger">{resendMutation.error.message}</Alert>
          )}

          <Button
            variant="secondary"
            fullWidth
            loading={resendMutation.isPending}
            disabled={resendCooldown.active}
            onClick={() => resendMutation.mutate(email.trim())}
          >
            {resendCooldown.active
              ? `Resend in ${resendCooldown.remaining}s`
              : 'Resend verification email'}
          </Button>
        </div>
      </AuthCard>
    );
  }

  const error = registerMutation.error ?? googleMutation.error;
  const apiError = error instanceof ApiError ? error : null;
  const busy = registerMutation.isPending || googleMutation.isPending;
  const emailTaken =
    registerMutation.error instanceof ApiError && registerMutation.error.isConflict;

  return (
    <AuthCard
      title="Create your account"
      description="Shorten, organise, and measure your links in one place."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-primary-text hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-md">
        {emailTaken && (
          <Alert tone="danger">
            An account with this email already exists.{' '}
            <Link to="/login" className="text-primary-text hover:underline">
              Log in instead
            </Link>
            .
          </Alert>
        )}

        {apiError && !emailTaken && !apiError.isValidation && (
          <Alert tone="danger">{apiError.message}</Alert>
        )}

        {!apiError && error && (
          <Alert tone="danger">
            Unable to reach SnapLink. Check your connection and try again.
          </Alert>
        )}

        {googleFailed && (
          <Alert tone="danger">
            Google sign-up didn&apos;t complete. Try again, or use your email and
            password.
          </Alert>
        )}

        <form className="flex flex-col gap-md" onSubmit={submit} noValidate>
          <Input
            label="Full name"
            name="fullName"
            autoComplete="name"
            required
            autoFocus
            maxLength={100}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            error={apiError?.fieldError('fullName')}
            disabled={busy}
          />

          <Input
            label="Email address"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={
              emailTaken
                ? 'An account with this email already exists.'
                : apiError?.fieldError('email')
            }
            disabled={busy}
          />

          <div className="flex flex-col gap-xs">
            <PasswordInput
              label="Password"
              name="password"
              autoComplete="new-password"
              required
              ref={passwordRef}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setShowPasswordError(false);
              }}
              // The rules live in the checklist below; pointing the field at it
              // is what makes them reachable to a screen reader, which
              // otherwise met a password field with no stated requirements.
              aria-describedby={requirementsId}
              error={
                showPasswordError && !isPasswordValid(password)
                  ? 'Password does not meet the requirements below.'
                  : apiError?.fieldError('password')
              }
              disabled={busy}
            />
            <PasswordRequirements id={requirementsId} value={password} />
          </div>

          {/*
            Enabled regardless of validity. A disabled submit is not announced,
            gives a sighted user nothing to act on, and here was dead from page
            load — the password is empty before anything is typed. Validation
            happens on submit and moves focus to the field that failed.
          */}
          <Button type="submit" fullWidth loading={registerMutation.isPending} disabled={busy}>
            Create account
          </Button>
        </form>

        <AuthDivider />

        <GoogleSignInButton
          text="signup_with"
          onCredential={(idToken) => {
            setGoogleFailed(false);
            googleMutation.mutate(idToken);
          }}
          onError={() => setGoogleFailed(true)}
        />
      </div>
    </AuthCard>
  );
}
