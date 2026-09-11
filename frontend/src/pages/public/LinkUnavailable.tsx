import { Link } from 'react-router-dom';
import { Unplug } from 'lucide-react';

import { AuthCard, AuthCardIcon } from '@/components/auth/AuthCard';
import { Button } from '@/components/ui/Button';

/**
 * SCR-PUB-11.
 *
 * Where a browser lands when a short code is unknown, deleted, or not yet live.
 * The three cases read identically on purpose: the backend answers all of them
 * with the same 404 so a deleted code leaks nothing about the link behind it,
 * and naming which case applied here would undo that.
 */
export function LinkUnavailablePage() {
  return (
    <AuthCard
      icon={
        <AuthCardIcon tone="warning">
          <Unplug className="h-8 w-8" aria-hidden />
        </AuthCardIcon>
      }
      title="This link isn't available"
      description="The link you followed doesn't lead anywhere right now. Check with whoever shared it, or head to SnapLink."
      footer={
        <>
          Want links like this?{' '}
          <Link to="/signup" className="text-primary-600 hover:underline">
            Create your own short links
          </Link>
        </>
      }
    >
      <Link to="/">
        <Button fullWidth>Go to SnapLink</Button>
      </Link>
    </AuthCard>
  );
}
