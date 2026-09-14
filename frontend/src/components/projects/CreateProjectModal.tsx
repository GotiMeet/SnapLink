import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { createProject } from '@/api/projects';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ApiError } from '@/lib/api';

const MAX_TITLE = 100;

/**
 * SCR-AUTH-04.
 *
 * A project's only field is its title, so this is one input. Titles are unique
 * among the owner's *active* projects, enforced by a unique index, which is why
 * the 409 is handled as a real outcome rather than prevented by checking first:
 * a pre-flight check would still race the index.
 *
 * The conflict message never mentions another account. Project titles are
 * scoped per owner, so "already exists" here can only mean the current user's
 * own project — but the neutral phrasing is the house rule either way
 * (PROJECT_MASTER.md section 13, rule 7).
 */
export function CreateProjectModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (projectId: string) => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: async (project) => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Project “${project.title}” created`);
      onOpenChange(false);
      onCreated(project._id);
    },
  });

  const { reset } = createMutation;

  // Reopening must not show the previous attempt's title or error.
  useEffect(() => {
    if (!open) return;
    setTitle('');
    reset();
  }, [open, reset]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    createMutation.mutate(trimmed);
  };

  const apiError = createMutation.error instanceof ApiError ? createMutation.error : null;

  const fieldError = apiError?.isConflict
    ? 'You already have an active project with this title. Please choose another.'
    : apiError?.fieldError('title');

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New project"
      /*
       * This used to promise that links could be moved into a project "at any
       * time". A link's project is fixed at creation — PROJECT_MASTER.md §3 and
       * §16 both rule the move out and no endpoint exists for it — so the copy
       * described a capability the product deliberately does not have, and a
       * user who created a scratch project on that basis had no way back.
       */
      description="Projects group your links. You can rename one whenever you like; a link stays in the project it was created in."
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
          placeholder="e.g. Summer Launch 2026"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={fieldError}
          hint={`${title.length}/${MAX_TITLE}`}
          disabled={createMutation.isPending}
        />

        <div className="flex justify-end gap-xs">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={createMutation.isPending}
            disabled={!title.trim()}
          >
            Create project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
