import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { cn } from '@/lib/cn';

/**
 * Popup menu: the account menu in the top bar and the action menu on a project
 * card. Extracted once the second one appeared, not before.
 *
 * Hand-rolled rather than adding @radix-ui/react-dropdown-menu. Section 6 of
 * PROJECT_MASTER.md admits a dependency only against a stated requirement, and
 * the one that justifies Radix Dialog — focus trapping on a modal overlay —
 * does not apply to a menu, which must stay escapable by design. What a menu
 * does owe the user is Escape with focus returned to its trigger, click-away,
 * arrow-key movement, and closing when the route changes underneath it.
 */
export const menuItemClass =
  'flex w-full items-center gap-xs px-sm py-xs text-left text-body-md text-content-secondary hover:bg-surface-subtle hover:text-content-primary';

export function DropdownMenu({
  label,
  trigger,
  triggerClassName,
  align = 'right',
  width = 'w-56',
  children,
}: {
  /** Accessible name for the menu itself, e.g. "Account". */
  label: string;
  trigger: ReactNode;
  triggerClassName?: string;
  align?: 'left' | 'right';
  width?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  // A menu left open across a navigation would hang over the new page.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

      const items = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
      );
      if (items.length === 0) return;

      event.preventDefault();
      const current = items.indexOf(document.activeElement as HTMLElement);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      // Wraps both ways, so ArrowUp straight from the trigger lands on the last
      // item rather than going nowhere.
      const next = (current + step + items.length) % items.length;
      items[current === -1 && step === -1 ? items.length - 1 : next]?.focus();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={triggerClassName}
      >
        {trigger}
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          // Closes after any item activates, so a caller never has to.
          onClick={() => setOpen(false)}
          className={cn(
            'absolute top-[calc(100%+8px)] z-40 overflow-hidden rounded-lg border border-border-subtle bg-surface-card py-2xs shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
            width
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="my-2xs h-px bg-border-subtle" />;
}
