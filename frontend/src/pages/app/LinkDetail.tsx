import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, BarChart3, LinkIcon, QrCode, RotateCcw, Trash2 } from 'lucide-react';

import { updateUrl, type UpdateUrlBody } from '@/api/urls';
import { AliasField } from '@/components/links/AliasField';
import { CopyButton } from '@/components/links/CopyButton';
import { LinkStatusBadge, LinkVisibilityBadge } from '@/components/links/LinkBadges';
import { ScheduleFields, VisibilityFields } from '@/components/links/LinkFormFields';
import { QrModal } from '@/components/links/QrModal';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { env } from '@/env';
import { useBreadcrumbTitle } from '@/hooks/useBreadcrumbTitle';
import { useDeleteLink } from '@/hooks/useDeleteLink';
import { useProject } from '@/hooks/useProjects';
import { useUrl } from '@/hooks/useUrls';
import { ApiError } from '@/lib/api';
import { fromLocalInputValue, toLocalInputValue } from '@/lib/dates';
import { aliasFormatError, linkPasswordError, validateSchedule } from '@/lib/links';
import { formatCount, formatDate } from '@/lib/format';
import type { ShortUrl, Visibility } from '@/types/models';

const shortLinkHost = env.appUrl.replace(/^https?:\/\//, '');
const RESET_PHRASE = 'RESET_ANALYTICS';

/** SCR-AUTH-07. */
export function LinkDetailPage() {
  const { urlId } = useParams();
  const linkQuery = useUrl(urlId);

  useBreadcrumbTitle(
    linkQuery.data?.title ?? (linkQuery.isError ? 'Not found' : undefined)
  );

  if (linkQuery.isPending) {
    return (
      <div className="flex flex-col gap-lg">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (linkQuery.isError) {
    const notFound =
      linkQuery.error instanceof ApiError && linkQuery.error.status === 404;

    return (
      <EmptyState
        icon={<LinkIcon className="h-8 w-8" aria-hidden />}
        title={
          notFound ? 'Link not found or has been deleted' : 'Failed to load this link'
        }
        description={
          notFound
            ? 'It may be in the Recycle Bin, or its project may have been deleted — a link comes back automatically when its project is restored.'
            : 'Please try again in a moment.'
        }
        action={
          <Link to="/app/links">
            <Button>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to links
            </Button>
          </Link>
        }
      />
    );
  }

  return <LinkDetail link={linkQuery.data} />;
}

function LinkDetail({ link }: { link: ShortUrl }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const projectQuery = useProject(link.project);

  const [qrOpen, setQrOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [confirmPublic, setConfirmPublic] = useState(false);

  const { deleteLink, isDeleting } = useDeleteLink(() =>
    navigate('/app/links', { replace: true })
  );

  const [form, setForm] = useState({
    title: link.title,
    originalUrl: link.originalUrl,
    customAlias: link.shortCode,
    visibility: link.visibility as Visibility,
    password: '',
    confirmPassword: '',
    liveAt: toLocalInputValue(link.scheduledLiveAt),
    deleteAt: toLocalInputValue(link.scheduledDeleteAt),
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: updateUrl,
    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['urls'] }),
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
      ]);
      toast.success('Changes saved');
      setForm((current) => ({
        ...current,
        customAlias: updated.shortCode,
        password: '',
        confirmPassword: '',
        liveAt: toLocalInputValue(updated.scheduledLiveAt),
        deleteAt: toLocalInputValue(updated.scheduledDeleteAt),
      }));
    },
  });

  const resetMutation = useMutation({
    mutationFn: updateUrl,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['urls'] });
      await queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Analytics reset for this link');
      setResetOpen(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Could not reset analytics.'
      );
    },
  });

  const schedule = validateSchedule(form.liveAt, form.deleteAt);
  const aliasError = form.customAlias.trim()
    ? aliasFormatError(form.customAlias.trim())
    : 'Alias is required';
  const passwordError = form.password ? linkPasswordError(form.password) : null;

  const becomingPublic = link.visibility === 'private' && form.visibility === 'public';
  const becomingPrivate = link.visibility === 'public' && form.visibility === 'private';

  // A link turned private with no password would be private with no gate, which
  // the API refuses outright — so the form requires one up front.
  const needsNewPassword = becomingPrivate && form.password.length === 0;

  const canSave =
    form.title.trim() !== '' &&
    form.originalUrl.trim() !== '' &&
    !aliasError &&
    !schedule.liveError &&
    !schedule.deleteError &&
    !passwordError &&
    !needsNewPassword &&
    (form.password.length === 0 || form.password === form.confirmPassword);

  /** Only what actually changed, so an untouched field is never resubmitted. */
  const buildPatch = (): UpdateUrlBody & { urlId: string } => {
    const body: UpdateUrlBody & { urlId: string } = { urlId: link._id };

    if (form.title.trim() !== link.title) body.title = form.title.trim();
    if (form.originalUrl.trim() !== link.originalUrl) {
      body.originalUrl = form.originalUrl.trim();
    }
    if (form.customAlias.trim() !== link.shortCode) {
      body.customAlias = form.customAlias.trim();
    }
    if (form.visibility !== link.visibility) body.visibility = form.visibility;

    // Sent only for a private link: the API rejects a password on a public one.
    if (form.visibility === 'private' && form.password) {
      body.password = form.password;
      body.confirmPassword = form.confirmPassword;
    }

    // null clears a schedule; undefined leaves it untouched.
    const live = fromLocalInputValue(form.liveAt);
    if (
      live !==
      (link.scheduledLiveAt ? new Date(link.scheduledLiveAt).toISOString() : null)
    ) {
      body.scheduledLiveAt = live;
    }
    const expiry = fromLocalInputValue(form.deleteAt);
    if (
      expiry !==
      (link.scheduledDeleteAt ? new Date(link.scheduledDeleteAt).toISOString() : null)
    ) {
      body.scheduledDeleteAt = expiry;
    }

    return body;
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSave) return;

    // Turning a protected link public deletes its stored password server-side.
    // That is not recoverable from this screen, so it is confirmed first.
    if (becomingPublic) {
      setConfirmPublic(true);
      return;
    }

    saveMutation.mutate(buildPatch());
  };

  const apiError = saveMutation.error instanceof ApiError ? saveMutation.error : null;
  const shortUrl = `${env.appUrl}/${link.shortCode}`;

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-md">
        <div className="flex flex-wrap items-start justify-between gap-md">
          <div className="min-w-0">
            <h1 className="break-words text-heading-xl">{link.title}</h1>
            <div className="mt-xs flex flex-wrap items-center gap-xs">
              <LinkStatusBadge link={link} />
              <LinkVisibilityBadge link={link} />
              {projectQuery.data && (
                <Link
                  to={`/app/projects/${link.project}`}
                  className="rounded-sm bg-surface-subtle px-xs py-3xs text-body-sm text-content-secondary hover:text-content-primary"
                >
                  {projectQuery.data.title}
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-xs">
            <Button variant="secondary" onClick={() => setQrOpen(true)}>
              <QrCode className="h-4 w-4" aria-hidden />
              QR code
            </Button>
            <Link to={`/app/links/${link._id}/analytics`}>
              <Button variant="secondary">
                <BarChart3 className="h-4 w-4" aria-hidden />
                View analytics
              </Button>
            </Link>
          </div>
        </div>

        <Card className="flex flex-wrap items-center gap-md p-md">
          <div className="flex min-w-0 items-center gap-xs">
            <span className="break-all font-mono text-mono-code text-primary-600">
              {shortLinkHost}/{link.shortCode}
            </span>
            <CopyButton value={shortUrl} label="short link" />
          </div>

          <dl className="ml-auto flex flex-wrap items-center gap-lg text-body-sm">
            <div>
              <dt className="text-content-tertiary">Visits</dt>
              <dd className="text-label-lg text-content-primary">
                {formatCount(link.clickCount)}
              </dd>
            </div>
            {/* clicks + qrScans always equals clickCount, so the split is shown
                rather than a second total that could look contradictory. */}
            <div>
              <dt className="text-content-tertiary">Web / QR</dt>
              <dd className="text-label-lg text-content-primary">
                {formatCount(link.clicks)} / {formatCount(link.qrScans)}
              </dd>
            </div>
            <div>
              <dt className="text-content-tertiary">Created</dt>
              <dd className="text-content-secondary">{formatDate(link.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-content-tertiary">Last visit</dt>
              <dd className="text-content-secondary">
                {link.lastAccessedAt ? formatDate(link.lastAccessedAt) : 'Never'}
              </dd>
            </div>
          </dl>
        </Card>
      </header>

      <Card className="p-lg">
        <h2 className="text-heading-md">Configuration</h2>

        <form className="mt-lg flex flex-col gap-lg" onSubmit={submit} noValidate>
          {apiError && !apiError.isValidation && (
            <Alert tone="danger">{apiError.message}</Alert>
          )}

          <Input
            label="Title"
            name="title"
            required
            maxLength={150}
            value={form.title}
            onChange={(event) => set('title', event.target.value)}
            error={apiError?.fieldError('title')}
            disabled={saveMutation.isPending}
          />

          <Input
            label="Destination URL"
            name="originalUrl"
            type="url"
            required
            maxLength={2048}
            value={form.originalUrl}
            onChange={(event) => set('originalUrl', event.target.value)}
            error={apiError?.fieldError('originalUrl')}
            disabled={saveMutation.isPending}
          />

          <AliasField
            value={form.customAlias}
            onChange={(value) => set('customAlias', value)}
            currentAlias={link.shortCode}
            error={apiError?.fieldError('customAlias')}
            disabled={saveMutation.isPending}
          />

          <VisibilityFields
            visibility={form.visibility}
            onVisibilityChange={(value) => set('visibility', value)}
            password={form.password}
            onPasswordChange={(value) => set('password', value)}
            confirmPassword={form.confirmPassword}
            onConfirmPasswordChange={(value) => set('confirmPassword', value)}
            // An existing private link already has a password; a new one is
            // only required when protection is being switched on.
            passwordOptional={link.visibility === 'private'}
            passwordError={
              passwordError ??
              (needsNewPassword ? 'Set a password to protect this link' : undefined) ??
              apiError?.fieldError('password') ??
              undefined
            }
            disabled={saveMutation.isPending}
          />

          <ScheduleFields
            liveAt={form.liveAt}
            onLiveAtChange={(value) => set('liveAt', value)}
            deleteAt={form.deleteAt}
            onDeleteAtChange={(value) => set('deleteAt', value)}
            liveError={
              schedule.liveError ?? apiError?.fieldError('scheduledLiveAt') ?? undefined
            }
            deleteError={
              schedule.deleteError ??
              apiError?.fieldError('scheduledDeleteAt') ??
              undefined
            }
            disabled={saveMutation.isPending}
          />

          <div className="flex justify-end">
            <Button type="submit" loading={saveMutation.isPending} disabled={!canSave}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>

      <Card className="border-danger/30 p-lg">
        <h2 className="text-heading-md">Danger zone</h2>

        <div className="mt-md flex flex-wrap items-center justify-between gap-md border-b border-border-subtle pb-md">
          <div className="min-w-0">
            <p className="text-label-lg text-content-primary">Reset analytics</p>
            <p className="text-body-md text-content-secondary">
              Permanently removes every recorded visit for this link. The link keeps
              working.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setResetOpen(true)}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reset analytics
          </Button>
        </div>

        <div className="mt-md flex flex-wrap items-center justify-between gap-md">
          <div className="min-w-0">
            <p className="text-label-lg text-content-primary">Move to Recycle Bin</p>
            <p className="text-body-md text-content-secondary">
              The link stops resolving. Restore it from the Recycle Bin whenever you like.
            </p>
          </div>
          <Button
            variant="danger"
            loading={isDeleting}
            onClick={() => deleteLink(link._id)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Move to Recycle Bin
          </Button>
        </div>
      </Card>

      <QrModal link={qrOpen ? link : null} onOpenChange={setQrOpen} />

      <ConfirmMakePublicDialog
        open={confirmPublic}
        onOpenChange={setConfirmPublic}
        saving={saveMutation.isPending}
        onConfirm={() => {
          setConfirmPublic(false);
          saveMutation.mutate(buildPatch());
        }}
      />

      <ResetAnalyticsDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        visits={link.clickCount}
        pending={resetMutation.isPending}
        onConfirm={() =>
          resetMutation.mutate({
            urlId: link._id,
            resetAnalytics: true,
            confirmationText: RESET_PHRASE,
          })
        }
      />
    </div>
  );
}

/**
 * Turning a protected link public deletes its stored password in the same
 * request. Nothing on this screen can put it back — the hash is never
 * serialized — so the consequence is stated before the save runs.
 */
function ConfirmMakePublicDialog({
  open,
  onOpenChange,
  saving,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Remove password protection?"
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button variant="danger" loading={saving} onClick={onConfirm}>
            Make public
          </Button>
        </>
      }
    >
      <p className="text-body-md text-content-secondary">
        Anyone with the short link will reach the destination straight away, and the
        current password is deleted. You can protect the link again later, but you will
        have to choose a new password.
      </p>
    </Modal>
  );
}

/**
 * The API requires `resetAnalytics: true` *and* `confirmationText` equal to the
 * exact phrase, so the dialog asks the user to type it. This is the one genuinely
 * irreversible action in the product: there is no restore for analytics.
 */
function ResetAnalyticsDialog({
  open,
  onOpenChange,
  visits,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visits: number;
  pending: boolean;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (open) setTyped('');
  }, [open]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Reset analytics for this link?"
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={pending}
            disabled={typed !== RESET_PHRASE}
            onClick={onConfirm}
          >
            Reset analytics
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-md">
        <Alert tone="danger">
          This cannot be undone. {formatCount(visits)}{' '}
          {visits === 1 ? 'recorded visit' : 'recorded visits'} and every daily breakdown
          for this link are deleted.
        </Alert>

        <Input
          label={`Type ${RESET_PHRASE} to confirm`}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          placeholder={RESET_PHRASE}
          disabled={pending}
        />
      </div>
    </Modal>
  );
}
