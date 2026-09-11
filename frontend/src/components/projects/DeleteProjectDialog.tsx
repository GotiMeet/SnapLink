import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { deleteProject } from '@/api/projects';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ApiError } from '@/lib/api';
import type { Project } from '@/types/models';

/**
 * Confirmation for a project soft delete.
 *
 * Deleting a project is not a single-object action: the backend takes every
 * active and scheduled link inside it offline in the same transaction, and
 * those links then disappear from every list and detail endpoint until the
 * project is restored. A confirmation that did not say so would be describing a
 * different operation than the one it performs.
 *
 * There is no permanent delete anywhere in v1, so the copy promises recovery
 * rather than hedging (PROJECT_MASTER.md section 16).
 */
export function DeleteProjectDialog({
  project,
  linkCount,
  onOpenChange,
  onDeleted,
}: {
  /** The project being deleted, or null when the dialog is closed. */
  project: Project | null;
  linkCount: number;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: async (deleted) => {
      // Links move to deleted_project in the same transaction, so every cached
      // link list is now wrong too.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
        queryClient.invalidateQueries({ queryKey: ['urls'] }),
      ]);
      toast.success(`“${deleted.title}” moved to the Recycle Bin`);
      onOpenChange(false);
      onDeleted?.();
    },
  });

  const apiError = deleteMutation.error instanceof ApiError ? deleteMutation.error : null;

  return (
    <Modal
      open={project !== null}
      onOpenChange={onOpenChange}
      title="Move this project to the Recycle Bin?"
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => project && deleteMutation.mutate(project._id)}
          >
            Move to Recycle Bin
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-md">
        <p className="text-body-md text-content-secondary">
          <strong className="font-semibold text-content-primary">{project?.title}</strong>{' '}
          and everything in it move to the Recycle Bin together.
        </p>

        {linkCount > 0 && (
          <Alert tone="warning">
            {linkCount === 1 ? 'Its 1 link' : `Its ${linkCount} links`} will stop
            resolving and disappear from your link lists. They come back automatically
            when you restore the project.
          </Alert>
        )}

        <p className="text-body-sm text-content-tertiary">
          Nothing is erased. Deleted projects stay in the Recycle Bin until you restore
          them.
        </p>

        {apiError && <p className="text-body-md text-danger">{apiError.message}</p>}
      </div>
    </Modal>
  );
}
