import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Check,
  FolderX,
  Link2,
  PencilLine,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

import { renameProject } from '@/api/projects';
import { CreateLinkDrawer } from '@/components/links/CreateLinkDrawer';
import { LinkRow } from '@/components/links/LinkRow';
import { QrModal } from '@/components/links/QrModal';
import { DeleteProjectDialog } from '@/components/projects/DeleteProjectDialog';
import { TITLE_CONFLICT_MESSAGE } from '@/components/projects/messages';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useBreadcrumbTitle } from '@/hooks/useBreadcrumbTitle';
import { useDeleteLink } from '@/hooks/useDeleteLink';
import { useProject } from '@/hooks/useProjects';
import { useUrls } from '@/hooks/useUrls';
import { ApiError } from '@/lib/api';
import { formatCount, formatDate } from '@/lib/format';
import type { Project, ShortUrl } from '@/types/models';

/** SCR-AUTH-03. */
export function ProjectDetailPage() {
  const { projectId } = useParams();
  const projectQuery = useProject(projectId);
  const urlsQuery = useUrls({ projectId }, { enabled: Boolean(projectId) });

  // On a 404 there is no title coming, so the crumb is given one rather than
  // left as a skeleton that spins for a project that does not exist.
  useBreadcrumbTitle(
    projectQuery.data?.title ?? (projectQuery.isError ? 'Not found' : undefined)
  );

  const [deleting, setDeleting] = useState<Project | null>(null);
  const [creatingLink, setCreatingLink] = useState(false);
  const navigate = useNavigate();

  if (projectQuery.isPending) {
    return (
      <div className="flex flex-col gap-lg">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (projectQuery.isError) {
    const notFound =
      projectQuery.error instanceof ApiError && projectQuery.error.status === 404;

    return (
      <EmptyState
        icon={<FolderX className="h-8 w-8" aria-hidden />}
        title={notFound ? 'Project not found or deleted' : 'Failed to load this project'}
        description={
          notFound
            ? 'It may have been moved to the Recycle Bin. Restore it from there to bring it and its links back.'
            : 'Please try again in a moment.'
        }
        action={
          <Link to="/app/projects">
            <Button>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to projects
            </Button>
          </Link>
        }
      />
    );
  }

  const project = projectQuery.data;
  const links = urlsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-md">
        <ProjectTitleEditor project={project} />

        <div className="flex flex-wrap items-center gap-md">
          <p className="flex items-center gap-2xs text-body-md text-content-secondary">
            <Link2 className="h-4 w-4 text-content-tertiary" aria-hidden />
            {urlsQuery.isPending ? (
              <Skeleton className="h-4 w-16" />
            ) : (
              <>
                {formatCount(links.length)} {links.length === 1 ? 'link' : 'links'}
              </>
            )}
          </p>
          <p className="text-body-md text-content-secondary">
            Updated {formatDate(project.updatedAt)}
          </p>

          <div className="ml-auto flex flex-wrap items-center gap-xs">
            <Button onClick={() => setCreatingLink(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Create link in this project
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:bg-danger/10 hover:text-danger"
              onClick={() => setDeleting(project)}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete project
            </Button>
          </div>
        </div>
      </header>

      {urlsQuery.isError && (
        <Alert
          tone="danger"
          title="Failed to load this project's links"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => urlsQuery.refetch()}
              loading={urlsQuery.isFetching}
            >
              Try again
            </Button>
          }
        />
      )}

      {urlsQuery.isPending && <Skeleton className="h-64 w-full rounded-lg" />}

      {urlsQuery.isSuccess &&
        (links.length === 0 ? (
          <Card className="p-lg">
            <EmptyState
              icon={<Link2 className="h-8 w-8" aria-hidden />}
              title="This project has no short links yet"
              description="Create your first link in this project to start sharing and capturing click data."
              action={
                <Button onClick={() => setCreatingLink(true)}>
                  <Plus className="h-4 w-4" aria-hidden />
                  Create short link
                </Button>
              }
            />
          </Card>
        ) : (
          <ProjectLinks links={links} />
        ))}

      <CreateLinkDrawer
        open={creatingLink}
        onOpenChange={setCreatingLink}
        projectId={project._id}
      />

      <DeleteProjectDialog
        project={deleting}
        linkCount={links.length}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={() => navigate('/app/projects', { replace: true })}
      />
    </div>
  );
}

/**
 * Inline title editing (SCR-AUTH-03).
 *
 * A project's title is unique among the owner's active projects, enforced by a
 * unique index, so the 409 is handled as an outcome rather than pre-empted by a
 * check that would still race that index.
 */
function ProjectTitleEditor({ project }: { project: Project }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(project.title);
  const headingRef = useRef<HTMLButtonElement>(null);

  const renameMutation = useMutation({
    mutationFn: renameProject,
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Renamed to “${updated.title}”`);
      setEditing(false);
    },
  });

  const { reset } = renameMutation;

  // Returning to the read view puts focus back on the control that left it.
  // The guard matters: without it the first render would pull focus to the
  // rename button the moment the page loads.
  const hasEdited = useRef(false);
  useEffect(() => {
    if (editing) {
      hasEdited.current = true;
      return;
    }
    if (hasEdited.current) headingRef.current?.focus();
  }, [editing]);

  const cancel = () => {
    setTitle(project.title);
    reset();
    setEditing(false);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    if (trimmed === project.title) {
      cancel();
      return;
    }
    renameMutation.mutate({ projectId: project._id, title: trimmed });
  };

  const apiError = renameMutation.error instanceof ApiError ? renameMutation.error : null;

  if (!editing) {
    return (
      <div className="flex items-start gap-xs">
        <h1 className="min-w-0 break-words text-heading-xl">{project.title}</h1>
        <button
          ref={headingRef}
          type="button"
          onClick={() => {
            setTitle(project.title);
            setEditing(true);
          }}
          aria-label={`Rename ${project.title}`}
          className="mt-3xs rounded-md p-2xs text-content-tertiary hover:bg-surface-subtle hover:text-content-primary"
        >
          <PencilLine className="h-4 w-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-xs" onSubmit={submit} noValidate>
      <div className="flex flex-wrap items-end gap-xs">
        <div className="min-w-0 flex-1 sm:max-w-md">
          <Input
            label="Project title"
            name="title"
            required
            autoFocus
            maxLength={100}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => event.key === 'Escape' && cancel()}
            error={
              apiError?.isConflict
                ? TITLE_CONFLICT_MESSAGE
                : apiError?.fieldError('title')
            }
            disabled={renameMutation.isPending}
          />
        </div>

        <div className="flex gap-xs">
          <Button
            type="submit"
            loading={renameMutation.isPending}
            disabled={!title.trim()}
          >
            <Check className="h-4 w-4" aria-hidden />
            Save
          </Button>
          <Button
            variant="secondary"
            onClick={cancel}
            disabled={renameMutation.isPending}
          >
            <X className="h-4 w-4" aria-hidden />
            Cancel
          </Button>
        </div>
      </div>

      {apiError && !apiError.isConflict && !apiError.isValidation && (
        <p className="text-body-md text-danger">{apiError.message}</p>
      )}
    </form>
  );
}

/**
 * The project's links, using the same row as the All Links catalog so copy, QR,
 * analytics and the action menu behave identically in both places. The project
 * badge is omitted: every row here belongs to the project already named above.
 */
function ProjectLinks({ links }: { links: ShortUrl[] }) {
  const [qrFor, setQrFor] = useState<ShortUrl | null>(null);
  const { deleteLink } = useDeleteLink();

  return (
    <>
      <Card className="overflow-hidden">
        <h2 className="border-b border-border-subtle px-md py-sm text-heading-md">
          Links in this project
        </h2>

        <div className="divide-y divide-border-subtle">
          {links.map((link) => (
            <LinkRow
              key={link._id}
              link={link}
              onShowQr={() => setQrFor(link)}
              onDelete={() => deleteLink(link._id)}
            />
          ))}
        </div>
      </Card>

      <QrModal link={qrFor} onOpenChange={(open) => !open && setQrFor(null)} />
    </>
  );
}
