import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  FolderX,
  Link2,
  Lock,
  PencilLine,
  Trash2,
  X,
} from 'lucide-react';

import { renameProject } from '@/api/projects';
import { DeleteProjectDialog } from '@/components/projects/DeleteProjectDialog';
import { TITLE_CONFLICT_MESSAGE } from '@/components/projects/messages';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { env } from '@/env';
import { useBreadcrumbTitle } from '@/hooks/useBreadcrumbTitle';
import { useProject } from '@/hooks/useProjects';
import { useUrls } from '@/hooks/useUrls';
import { ApiError } from '@/lib/api';
import { formatCount, formatDate } from '@/lib/format';
import type { Project, ShortUrl } from '@/types/models';

const shortLinkHost = env.appUrl.replace(/^https?:\/\//, '');

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

          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-danger hover:bg-danger/10 hover:text-danger"
            onClick={() => setDeleting(project)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete project
          </Button>
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
            />
          </Card>
        ) : (
          <ProjectLinks links={links} />
        ))}

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
 * Read-only list of the project's links.
 *
 * Copy, QR, and the per-row action menu arrive in Phase 4 with the shared link
 * row; this shows what the project contains without implying controls that do
 * not work yet.
 */
function ProjectLinks({ links }: { links: ShortUrl[] }) {
  return (
    <Card className="overflow-hidden">
      <h2 className="border-b border-border-subtle px-md py-sm text-heading-md">
        Links in this project
      </h2>

      <ul className="divide-y divide-border-subtle">
        {links.map((link) => (
          <li key={link._id} className="flex flex-wrap items-center gap-sm px-md py-sm">
            <div className="min-w-0 flex-1">
              <Link
                to={`/app/links/${link._id}`}
                className="rounded-sm text-label-lg text-content-primary hover:text-primary-600"
              >
                <span className="line-clamp-1 break-all">{link.title}</span>
              </Link>

              <p className="mt-3xs flex flex-wrap items-center gap-xs">
                <span className="font-mono text-mono-code text-primary-600">
                  {shortLinkHost}/{link.shortCode}
                </span>
                <a
                  href={link.originalUrl}
                  target="_blank"
                  // The destination is user-supplied, so the opened page must
                  // not receive a handle on this one.
                  rel="noopener noreferrer"
                  className="flex min-w-0 items-center gap-3xs rounded-sm text-body-sm text-content-tertiary hover:text-content-primary"
                >
                  <span className="line-clamp-1 break-all">{link.originalUrl}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                </a>
              </p>
            </div>

            <div className="flex items-center gap-xs">
              {link.status === 'inactive' ? (
                <Badge tone="warning">Scheduled</Badge>
              ) : (
                <Badge tone="success">Active</Badge>
              )}
              {/*
                visibility is independent of status, so it is a separate badge
                and never a column value (PROJECT_MASTER.md section 4).
              */}
              {link.visibility === 'private' && (
                <Badge tone="accent" icon={<Lock className="h-3 w-3" aria-hidden />}>
                  Protected
                </Badge>
              )}
            </div>

            <p className="w-20 text-right text-body-md text-content-secondary">
              {formatCount(link.clickCount)}
              <span className="sr-only"> visits</span>
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
