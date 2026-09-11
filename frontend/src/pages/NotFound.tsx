import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-canvas p-md">
      <EmptyState
        icon={<SearchX className="h-8 w-8" aria-hidden />}
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved."
        action={
          <Link to="/">
            <Button>Go to SnapLink</Button>
          </Link>
        }
      />
    </div>
  );
}
