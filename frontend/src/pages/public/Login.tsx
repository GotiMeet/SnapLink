import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

import { login, loginWithGoogle, resendVerificationEmail } from '@/api/auth';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthDivider, GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useAuth } from '@/hooks/useAuth';
import { useCooldown } from '@/hooks/useCooldown';
import { ApiError } from '@/lib/api';

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * SCR-PUB-04.
 *
 * There is no `navigate` on success: this page renders inside PublicOnlyRoute,
 * which already resolves `?redirect=` through safeRedirect and sends an
 * authenticated user on. Seeding the session is the whole job; duplicating the
 * redirect here would mean two places deciding where a login lands.
 */
export function LoginPage() {
  const { signIn } = useAuth();
  const [params] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleFailed, setGoogleFailed] = useState(false);

  const resendCooldown = useCooldown();

  const signInMutation = useMutation({
    mutationFn: login,
    onSuccess: signIn,
  });

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
    resendMutation.reset();
    signInMutation.mutate({ email: email.trim(), password });
  };

  const error = signInMutation.error ?? googleMutation.error;
  const apiError = error instanceof ApiError ? error : null;
  const busy = signInMutation.isPending || googleMutation.isPending;

  // 403 is the one login failure with a fix the user can action from here, so
  // it gets a resend control rather than a dead-end message.
  const unverified = apiError?.status === 403;

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to manage your links and see how they're performing."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-primary-600 hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-md">
        {params.get('verified') === 'true' && (
          <Alert tone="success">Your email is verified. Sign in to get started.</Alert>
        )}

        {params.get('reset') === 'success' && (
          <Alert tone="success">
            Your password has been changed. Sign in with your new password.
          </Alert>
        )}

        {unverified && (
          <Alert
            tone="warning"
            title="Verify your email to continue"
            action={
              resendMutation.isSuccess ? (
                <p className="text-body-sm">
                  If that address needs verifying, a new link is on its way. It expires in
                  15 minutes.
                </p>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={resendMutation.isPending}
                  disabled={!email.trim() || resendCooldown.active}
                  onClick={() => resendMutation.mutate(email.trim())}
                >
                  {resendCooldown.active
                    ? `Resend in ${resendCooldown.remaining}s`
                    : 'Resend verification email'}
                </Button>
              )
            }
          >
            <p>Please verify your email address before logging in.</p>
            {resendMutation.error instanceof ApiError && (
              <p className="text-danger">{resendMutation.error.message}</p>
            )}
          </Alert>
        )}

        {apiError && !unverified && (
          <Alert tone="danger">
            {apiError.status === 401 ? 'Invalid email or password.' : apiError.message}
          </Alert>
        )}

        {!apiError && error && (
          <Alert tone="danger">
            Unable to reach SnapLink. Check your connection and try again.
          </Alert>
        )}

        {googleFailed && (
          <Alert tone="danger">
            Google sign-in didn&apos;t complete. Try again, or use your email and
            password.
          </Alert>
        )}

        <form className="flex flex-col gap-md" onSubmit={submit} noValidate>
          <Input
            label="Email address"
            type="email"
            name="email"
            autoComplete="email"
            required
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={apiError?.fieldError('email')}
            disabled={busy}
          />

          <div className="flex flex-col gap-2xs">
            <PasswordInput
              label="Password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={apiError?.fieldError('password')}
              disabled={busy}
            />
            <Link
              to="/forgot-password"
              className="self-end text-body-sm text-primary-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={signInMutation.isPending}
            disabled={busy}
          >
            Sign in
          </Button>
        </form>

        <AuthDivider />

        <GoogleSignInButton
          text="signin_with"
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
