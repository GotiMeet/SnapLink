import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Right-hand side panel, built on the same Radix Dialog primitive as Modal.
 *
 * A drawer rather than a modal for link creation because the form is tall — a
 * destination, title, project, alias, visibility and two schedule fields — and a
 * centred dialog that height either scrolls inside itself or overruns the
 * viewport on a laptop.
 *
 * Radix carries the focus trap, Escape, and focus restored to the trigger, which
 * PROJECT_MASTER.md section 7 requires of every overlay.
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border-subtle bg-surface-card shadow-xl">
          <div className="flex items-start justify-between gap-md border-b border-border-subtle p-lg">
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

          {/* Only the body scrolls, so the footer's actions stay reachable. */}
          <div className="min-h-0 flex-1 overflow-y-auto p-lg">{children}</div>

          {footer && (
            <div className="flex justify-end gap-xs border-t border-border-subtle p-lg">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
