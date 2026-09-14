import { useEffect } from 'react';

/**
 * Warns before the document is unloaded with unsaved edits on screen.
 *
 * WHY THIS EXISTS:
 * Link Detail is the only long form in the product and the one most likely to
 * be interrupted. Nothing warned on a reload, a tab close or a typed URL, so a
 * rewritten destination was simply gone — and because nothing had been sent,
 * unrecoverable.
 *
 * WHAT THIS DOES NOT COVER, AND WHY:
 * In-app navigation — a sidebar click, a breadcrumb, the back button — never
 * touches the document, so `beforeunload` does not fire for it. Intercepting
 * that needs React Router's `useBlocker`, which only works under a data router
 * (`createBrowserRouter`). PROJECT_MASTER.md section 6 pins `BrowserRouter`,
 * and swapping it would restructure the composition root and the auth boot
 * ordering that ProtectedRoute depends on — too much to change for this, and
 * not a decision to take silently.
 *
 * The in-page affordances carry that case instead: the form shows a live count
 * of unsaved changes, and Save and Discard are both enabled only while there
 * are some. See the note in LinkDetail.tsx.
 *
 * Browsers deliberately ignore any custom message here; the prompt shown is
 * their own.
 */
export function useUnsavedChangesWarning(when: boolean) {
  useEffect(() => {
    if (!when) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Legacy browsers require a return value before they show their prompt.
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [when]);
}
