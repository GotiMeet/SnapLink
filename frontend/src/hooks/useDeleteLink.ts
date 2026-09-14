import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { deleteUrl, restoreUrl } from '@/api/urls';
import { ApiError } from '@/lib/api';
import type { ShortUrl } from '@/types/models';

/**
 * Soft-deletes a link and offers Undo on the confirmation toast.
 *
 * The Undo is a real restore call, not a local rollback — the delete already
 * committed server-side. Restore is refused with a 409 when the link's project
 * has since been deleted; that message is surfaced as sent rather than being
 * flattened into a generic failure, because it names the project the user has
 * to deal with (PROJECT_MASTER.md section 4).
 *
 * No confirmation dialog: an Undo that actually works is a better answer than a
 * prompt, and nothing here is destructive — there is no permanent delete in v1.
 */
export function useDeleteLink(onDeleted?: (link: ShortUrl) => void) {
  const queryClient = useQueryClient();

  // Project cards derive link counts from the link list, so both go stale.
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['urls'] }),
      queryClient.invalidateQueries({ queryKey: ['projects'] }),
    ]);

  const restoreMutation = useMutation({
    mutationFn: restoreUrl,
    onSuccess: async (link) => {
      await invalidate();
      toast.success(`“${link.title}” restored`);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Could not restore the link. Please try again.'
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUrl,
    onSuccess: async (link) => {
      await invalidate();
      onDeleted?.(link);
      toast.success(`“${link.title}” moved to the Recycle Bin`, {
        action: {
          label: 'Undo',
          onClick: () => restoreMutation.mutate(link._id),
        },
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Could not delete the link. Please try again.'
      );
    },
  });

  return {
    deleteLink: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
