import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Radix Dialog is used rather than a hand-rolled overlay because
 * PROJECT_MASTER.md section 7 requires focus trapping, Escape to close, and
 * focus restored to the trigger. Those are easy to get subtly wrong by hand,
 * and Radix ships them unstyled so the design system stays ours.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const width = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2',
            'rounded-lg border border-border-subtle bg-surface-card p-lg shadow-lg',
            'max-h-[calc(100vh-2rem)] overflow-y-auto',
            width
          )}
        >
          <div className="flex items-start justify-between gap-md">
            <div className="flex flex-col gap-2xs">
              <Dialog.Title className="text-heading-lg">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="text-body-md text-content-secondary">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="Close"
              className="rounded-md p-2xs text-content-tertiary hover:bg-surface-subtle hover:text-content-primary"
            >
              <X className="h-5 w-5" aria-hidden />
            </Dialog.Close>
          </div>

          {children && <div className="mt-md">{children}</div>}
          {footer && <div className="mt-lg flex justify-end gap-xs">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
