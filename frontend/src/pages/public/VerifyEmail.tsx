import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { CircleCheck, MailWarning } from 'lucide-react';

import { resendVerificationEmail, verifyEmail } from '@/api/auth';
import { AuthCard, AuthCardIcon } from '@/components/auth/AuthCard';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useCooldown } from '@/hooks/useCooldown';
import { ApiError } from '@/lib/api';
import { usePageMeta } from '@/hooks/usePageMeta';

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * SCR-PUB-06.
 *
 * The token is consumed automatically on mount — a user who clicked a link in
 * their inbox has already expressed intent, and asking them to press a second
 * button adds a step that can only fail.
 *
 * Every failure mode the backend distinguishes (expired JWT, superseded by a
 * newer email, account already swept by the unverified TTL) arrives as a 400
 * with a message written for the user, so it is rendered as sent rather than
 * flattened into one generic line.
 */
export function VerifyEmailPage() {
  usePageMeta({ title: 'Verify your email', noindex: true });
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() ?? '';

  const verifyMutation = useMutation({ mutationFn: verifyEmail });
  const { mutate: runVerify } = verifyMutation;

  // StrictMode mounts effects twice in development. Verification is idempotent
  // server-side, but firing two requests for one click is still noise.
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    runVerify(token);
  }, [token, runVerify]);

  if (verifyMutation.isSuccess) {
    return (
      <AuthCard
        icon={
          <AuthCardIcon tone="success">
            <CircleCheck className="h-8 w-8" aria-hidden />
          </AuthCardIcon>
        }
        title="Email verified"
        description="Your account is ready. Sign in to start shortening links."
      >
        <Link to="/login?verified=true">
          <Button fullWidth>Proceed to sign in</Button>
        </Link>
      </AuthCard>
    );
  }

  if (token && verifyMutation.isPending) {
    return (
      <AuthCard title="Verifying your email" description="This only takes a moment.">
        <div className="flex justify-center py-md text-content-secondary">
          <Spinner className="h-6 w-6" label="Verifying your email" />
        </div>
      </AuthCard>
    );
  }

  const failure =
    verifyMutation.error instanceof ApiError
      ? verifyMutation.error.message
      : verifyMutation.isError
        ? 'Unable to reach SnapLink. Check your connection and try again.'
        : null;

  return (
    <AuthCard
      icon={
        <AuthCardIcon tone="warning">
          <MailWarning className="h-8 w-8" aria-hidden />
        </AuthCardIcon>
      }
      title={token ? 'Verification failed' : 'Verify your email'}
      description={
        token
          ? undefined
          : 'Enter the address you registered with and we will send a fresh verification link.'
      }
      footer={
        <>
          Need a hand?{' '}
          <Link to="/contact" className="text-primary-text hover:underline">
            Contact support
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-md">
        {failure && <Alert tone="danger">{failure}</Alert>}
        <ResendVerificationForm />
      </div>
    </AuthCard>
  );
}

/**
 * Asks for the address rather than assuming one: a user arriving from an email
 * link has no session, and the token carries no address the client can read.
 * The response is deliberately identical whether or not the account exists.
 */
function ResendVerificationForm() {
  const [email, setEmail] = useState('');
  const cooldown = useCooldown();

  const resendMutation = useMutation({
    mutationFn: resendVerificationEmail,
    onSuccess: () => cooldown.start(RESEND_COOLDOWN_SECONDS),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    resendMutation.mutate(email.trim());
  };

  return (
    <form className="flex flex-col gap-md" onSubmit={submit} noValidate>
      {resendMutation.isSuccess && (
        <Alert tone="success">
          If that address needs verifying, a new link is on its way. It expires in 15
          minutes.
        </Alert>
      )}

      {resendMutation.error instanceof ApiError && (
        <Alert tone="danger">{resendMutation.error.message}</Alert>
      )}

      <Input
        label="Email address"
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={
          resendMutation.error instanceof ApiError
            ? resendMutation.error.fieldError('email')
            : undefined
        }
        disabled={resendMutation.isPending}
      />

      <Button
        type="submit"
        fullWidth
        loading={resendMutation.isPending}
        disabled={!email.trim() || cooldown.active}
      >
        {cooldown.active ? `Resend in ${cooldown.remaining}s` : 'Send verification email'}
      </Button>
    </form>
  );
}
