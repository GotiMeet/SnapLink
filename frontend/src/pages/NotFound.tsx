import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePageMeta } from '@/hooks/usePageMeta';

/**
 * Rendered twice from the route table: standalone for unmatched public paths,
 * and with `inShell` for unmatched paths under /app.
 *
 * The distinction matters because the shell version already sits inside the
 * sidebar and top bar, so it must not paint its own full-screen canvas, and its
 * way out should be the workspace rather than the marketing home — a signed-in
 * user sent to `/` is bounced around the public-only guards and concludes they
 * have been signed out.
 */
export function NotFoundPage({ inShell = false }: { inShell?: boolean } = {}) {
  usePageMeta({ title: 'Page not found', noindex: true });

  const content = (
    <EmptyState
      icon={<SearchX className="h-8 w-8" aria-hidden />}
      title="Page not found"
      as="h1"
      description={
        inShell
          ? "That page doesn't exist. It may have been renamed, or the link that brought you here may be out of date."
          : "The page you're looking for doesn't exist or has moved."
      }
      action={
        <Link to={inShell ? '/app/dashboard' : '/'}>
          <Button>{inShell ? 'Back to dashboard' : 'Go to SnapLink'}</Button>
        </Link>
      }
    />
  );

  if (inShell) return content;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-canvas p-md">
      {content}
    </div>
  );
}
