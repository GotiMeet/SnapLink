import { useId, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { KeyRound } from 'lucide-react';

import { resetPassword } from '@/api/auth';
import { AuthCard, AuthCardIcon } from '@/components/auth/AuthCard';
import { PasswordRequirements } from '@/components/auth/PasswordRequirements';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api';
import { isPasswordValid } from '@/lib/password';
import { usePageMeta } from '@/hooks/usePageMeta';

/**
 * SCR-PUB-08.
 *
 * A successful reset revokes every session INCLUDING the one running this page,
 * and the backend clears the cookies as part of the response. The copy says so
 * plainly, and the cache is cleared on success so no data from the previous
 * session survives into the login screen.
 */
export function ResetPasswordPage() {
  usePageMeta({ title: 'Set a new password', noindex: true });
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() ?? '';
  const navigate = useNavigate();
  const { clear } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showMismatch, setShowMismatch] = useState(false);
  const [showPasswordError, setShowPasswordError] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const requirementsId = useId();

  const resetMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      clear();
      navigate('/login?reset=success', { replace: true });
    },
  });

  if (!token) {
    return (
      <AuthCard
        icon={
          <AuthCardIcon tone="danger">
            <KeyRound className="h-8 w-8" aria-hidden />
          </AuthCardIcon>
        }
        title="This reset link isn't valid"
        description="The link is missing its token. Request a new one and try again."
      >
        <Link to="/forgot-password">
          <Button fullWidth>Request a new link</Button>
        </Link>
      </AuthCard>
    );
  }

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const submit = (event: FormEvent) => {
    event.preventDefault();

    /*
     * Validated here rather than by disabling the button. A disabled submit is
     * not announced to assistive technology and gives a sighted user nothing to
     * act on; focus moving to the field that failed does both.
     */
    if (!isPasswordValid(password)) {
      setShowPasswordError(true);
      passwordRef.current?.focus();
      return;
    }
    if (mismatch || !confirmPassword) {
      setShowMismatch(true);
      return;
    }

    setShowPasswordError(false);
    setShowMismatch(false);
    resetMutation.mutate({ token, password });
  };

  const apiError = resetMutation.error instanceof ApiError ? resetMutation.error : null;

  // The backend returns 400 for an expired, superseded, or already-used token.
  // That is the one failure with a next step, so it gets a route out.
  const tokenRejected = apiError?.status === 400 && !apiError.fieldError('token');

  return (
    <AuthCard
      title="Set a new password"
      description="Choose a password you don't use anywhere else."
      footer={
        <Link to="/login" className="text-primary-text hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form className="flex flex-col gap-md" onSubmit={submit} noValidate>
        {tokenRejected ? (
          <Alert tone="danger" title="This reset link has expired">
            <p>{apiError.message}</p>
            <Link to="/forgot-password" className="text-primary-text hover:underline">
              Request a new link
            </Link>
          </Alert>
        ) : (
          apiError &&
          !apiError.isValidation && <Alert tone="danger">{apiError.message}</Alert>
        )}

        {!apiError && resetMutation.isError && (
          <Alert tone="danger">
            Unable to reach SnapLink. Check your connection and try again.
          </Alert>
        )}

        <div className="flex flex-col gap-xs">
          <PasswordInput
            label="New password"
            name="password"
            autoComplete="new-password"
            required
            autoFocus
            ref={passwordRef}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setShowPasswordError(false);
            }}
            aria-describedby={requirementsId}
            error={
              showPasswordError && !isPasswordValid(password)
                ? 'Password does not meet the requirements below.'
                : apiError?.fieldError('password')
            }
            disabled={resetMutation.isPending}
          />
          <PasswordRequirements id={requirementsId} value={password} />
        </div>

        <PasswordInput
          label="Confirm new password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setShowMismatch(false);
          }}
          onBlur={() => setShowMismatch(mismatch)}
          error={showMismatch && mismatch ? 'Passwords do not match.' : undefined}
          disabled={resetMutation.isPending}
        />

        <Alert tone="info">
          Changing your password signs you out on all devices, including this one.
        </Alert>

        <Button
          type="submit"
          fullWidth
          loading={resetMutation.isPending}
          disabled={resetMutation.isPending}
        >
          Reset password
        </Button>
      </form>
    </AuthCard>
  );
}
