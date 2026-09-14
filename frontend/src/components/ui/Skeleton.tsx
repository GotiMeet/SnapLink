import { cn } from '@/lib/cn';

/**
 * Height and width must match the real element so nothing shifts when content
 * arrives (PROJECT_MASTER.md section 7, loading states).
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'relative block overflow-hidden rounded-md bg-surface-subtle',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer',
        'after:bg-gradient-to-r after:from-transparent after:via-black/[0.04] after:to-transparent',
        'dark:after:via-white/[0.06]',
        className ?? 'h-4 w-full'
      )}
    />
  );
}
