import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePageMeta } from '@/hooks/usePageMeta';

export function NotFoundPage() {
  usePageMeta({ title: 'Page not found', noindex: true });
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-canvas p-md">
      <EmptyState
        icon={<SearchX className="h-8 w-8" aria-hidden />}
        title="Page not found"
        as="h1"
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
