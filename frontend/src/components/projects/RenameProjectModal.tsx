import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { renameProject } from '@/api/projects';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ApiError } from '@/lib/api';
import { TITLE_CONFLICT_MESSAGE } from './messages';
import type { Project } from '@/types/models';

const MAX_TITLE = 100;

/** Rename from the catalog's card menu. Project Details edits its title in place. */
export function RenameProjectModal({
  project,
  onOpenChange,
}: {
  /** The project being renamed, or null when the modal is closed. */
  project: Project | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');

  const renameMutation = useMutation({
    mutationFn: renameProject,
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Renamed to “${updated.title}”`);
      onOpenChange(false);
    },
  });

  const { reset } = renameMutation;

  useEffect(() => {
    if (!project) return;
    setTitle(project.title);
    reset();
  }, [project, reset]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !project) return;
    if (trimmed === project.title) {
      onOpenChange(false);
      return;
    }
    renameMutation.mutate({ projectId: project._id, title: trimmed });
  };

  const apiError = renameMutation.error instanceof ApiError ? renameMutation.error : null;

  return (
    <Modal
      open={project !== null}
      onOpenChange={onOpenChange}
      title="Rename project"
      size="sm"
    >
      <form className="flex flex-col gap-md" onSubmit={submit} noValidate>
        {apiError && !apiError.isConflict && !apiError.isValidation && (
          <p className="text-body-md text-danger-text">{apiError.message}</p>
        )}

        <Input
          label="Project title"
          name="title"
          required
          autoFocus
          maxLength={MAX_TITLE}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={
            apiError?.isConflict ? TITLE_CONFLICT_MESSAGE : apiError?.fieldError('title')
          }
          hint={`${title.length}/${MAX_TITLE}`}
          disabled={renameMutation.isPending}
        />

        <div className="flex justify-end gap-xs">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={renameMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={renameMutation.isPending}
            disabled={!title.trim()}
          >
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
