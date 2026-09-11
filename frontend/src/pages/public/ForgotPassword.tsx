import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { MailCheck } from 'lucide-react';

import { forgotPassword } from '@/api/auth';
import { AuthCard, AuthCardIcon } from '@/components/auth/AuthCard';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiError } from '@/lib/api';

/**
 * SCR-PUB-07.
 *
 * The confirmation is deliberately conditional — "if an account exists" — and
 * identical whether or not one does. The endpoint answers the same way for
 * every address, and a friendlier "we've emailed you" would turn this form into
 * an account-enumeration oracle.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  const requestMutation = useMutation({ mutationFn: forgotPassword });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    requestMutation.mutate(email.trim());
  };

  if (requestMutation.isSuccess) {
    return (
      <AuthCard
        icon={
          <AuthCardIcon tone="success">
            <MailCheck className="h-8 w-8" aria-hidden />
          </AuthCardIcon>
        }
        title="Check your email"
        description="If an account exists with that address, we've sent a reset link. It expires in 15 minutes."
        footer={
          <Link to="/login" className="text-primary-600 hover:underline">
            Back to sign in
          </Link>
        }
      />
    );
  }

  const apiError =
    requestMutation.error instanceof ApiError ? requestMutation.error : null;

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email address and we'll send you a link to set a new password."
      footer={
        <Link to="/login" className="text-primary-600 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form className="flex flex-col gap-md" onSubmit={submit} noValidate>
        {apiError && !apiError.isValidation && (
          <Alert tone="danger">{apiError.message}</Alert>
        )}

        {!apiError && requestMutation.isError && (
          <Alert tone="danger">
            Unable to reach SnapLink. Check your connection and try again.
          </Alert>
        )}

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
          disabled={requestMutation.isPending}
        />

        <Button
          type="submit"
          fullWidth
          loading={requestMutation.isPending}
          disabled={!email.trim()}
        >
          Send reset link
        </Button>
      </form>
    </AuthCard>
  );
}
