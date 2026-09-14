import { FolderX } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

/**
 * SCR-AUTH-10-M1.
 *
 * Shown when `PATCH /urls/:urlId/restore` is refused with a 409 because the
 * link's parent project is itself in the Recycle Bin. The backend names that
 * project in `errors[].project`, which is the only reason this screen can say
 * which one to restore first.
 *
 * There is deliberately no override. The refusal is unconditional — a live link
 * can never sit inside a deleted project — so an "Anyway" button would be a
 * control that always fails. The only real action is restoring the project, and
 * that is where the primary button goes.
 */
export function RestoreConflictModal({
  open,
  linkTitle,
  projectTitle,
  onOpenChange,
  onGoToProjects,
}: {
  open: boolean;
  linkTitle: string;
  /** From `errors[].project.title`; absent if the backend could not resolve it. */
  projectTitle: string | null;
  onOpenChange: (open: boolean) => void;
  onGoToProjects: () => void;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Can't restore this link yet"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onGoToProjects}>Go to Deleted Projects</Button>
        </>
      }
    >
      <div className="flex gap-sm">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-warning/10 text-warning-text"
        >
          <FolderX className="h-5 w-5" />
        </span>

        <div className="flex flex-col gap-xs">
          <p className="text-body-md text-content-secondary">
            <strong className="font-semibold text-content-primary">{linkTitle}</strong>{' '}
            belongs to{' '}
            {projectTitle ? (
              <strong className="font-semibold text-content-primary">
                {projectTitle}
              </strong>
            ) : (
              'a project'
            )}
            , which is also in the Recycle Bin.
          </p>
          <p className="text-body-md text-content-secondary">
            Restore the project first. Its links come back with it, so this one may return
            on its own without you restoring it separately.
          </p>
        </div>
      </div>
    </Modal>
  );
}
