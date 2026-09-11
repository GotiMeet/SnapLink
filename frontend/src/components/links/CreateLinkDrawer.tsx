import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, QrCode } from 'lucide-react';
import { createUrl, type CreateUrlBody } from '@/api/urls';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { env } from '@/env';
import { useProjects } from '@/hooks/useProjects';
import { ApiError } from '@/lib/api';
import { fromLocalInputValue } from '@/lib/dates';
import { aliasFormatError, linkPasswordError, validateSchedule } from '@/lib/links';
import { AliasField } from './AliasField';
import { CopyButton } from './CopyButton';
import { ScheduleFields, VisibilityFields } from './LinkFormFields';
import { QrModal } from './QrModal';
import type { ShortUrl, Visibility } from '@/types/models';

const shortLinkHost = env.appUrl.replace(/^https?:\/\//, '');

const EMPTY = {
  originalUrl: '',
  title: '',
  projectId: '',
  customAlias: '',
  visibility: 'public' as Visibility,
  password: '',
  confirmPassword: '',
  liveAt: '',
  deleteAt: '',
};

/**
 * SCR-AUTH-06.
 *
 * A project is mandatory (D3): `projectId` is required by POST /urls and a
 * link's project is fixed at creation, so the field is a required select rather
 * than an optional one, and there is no "no project" choice to pick.
 */
export function CreateLinkDrawer({
  open,
  onOpenChange,
  /** Preselects and locks the project when opened from inside one. */
  projectId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}) {
  const queryClient = useQueryClient();
  const projectsQuery = useProjects();

  const [form, setForm] = useState(EMPTY);
  const [created, setCreated] = useState<ShortUrl | null>(null);
  const [qrFor, setQrFor] = useState<ShortUrl | null>(null);

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const createMutation = useMutation({
    mutationFn: createUrl,
    onSuccess: async (shortUrl) => {
      // Project cards show link counts derived from the link list, so both
      // caches are stale after a create.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['urls'] }),
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
      ]);
      setCreated(shortUrl);
    },
  });

  const { reset } = createMutation;

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY, projectId: projectId ?? '' });
    setCreated(null);
    reset();
  }, [open, projectId, reset]);

  const schedule = validateSchedule(form.liveAt, form.deleteAt);
  const passwordError =
    form.visibility === 'private' && form.password
      ? linkPasswordError(form.password)
      : null;
  const aliasError = form.customAlias.trim()
    ? aliasFormatError(form.customAlias.trim())
    : null;

  const canSubmit =
    form.originalUrl.trim() !== '' &&
    form.title.trim() !== '' &&
    form.projectId !== '' &&
    !aliasError &&
    !schedule.liveError &&
    !schedule.deleteError &&
    (form.visibility === 'public' ||
      (form.password.length > 0 &&
        !passwordError &&
        form.password === form.confirmPassword));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const body: CreateUrlBody = {
      projectId: form.projectId,
      title: form.title.trim(),
      originalUrl: form.originalUrl.trim(),
      visibility: form.visibility,
    };

    const alias = form.customAlias.trim();
    if (alias) body.customAlias = alias;

    // A password on a public link is rejected outright, so it is only ever sent
    // alongside private.
    if (form.visibility === 'private') {
      body.password = form.password;
      body.confirmPassword = form.confirmPassword;
    }

    const live = fromLocalInputValue(form.liveAt);
    if (live) body.scheduledLiveAt = live;

    const expiry = fromLocalInputValue(form.deleteAt);
    if (expiry) body.scheduledDeleteAt = expiry;

    createMutation.mutate(body);
  };

  const apiError = createMutation.error instanceof ApiError ? createMutation.error : null;

  if (created) {
    const shortUrl = `${shortLinkHost}/${created.shortCode}`;

    return (
      <>
        <Drawer
          open={open}
          onOpenChange={onOpenChange}
          title="Link created"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreated(null)}>
                Create another
              </Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </>
          }
        >
          <div className="flex flex-col items-center gap-md text-center">
            <span
              aria-hidden
              className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success"
            >
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <p className="text-body-md text-content-secondary">
              <strong className="text-content-primary">{created.title}</strong> is ready
              to share.
            </p>

            <div className="flex w-full items-center gap-xs rounded-md border border-border-subtle bg-surface-subtle px-sm py-xs">
              <span className="min-w-0 flex-1 break-all text-left font-mono text-mono-code text-primary-600">
                {shortUrl}
              </span>
              <CopyButton
                value={`${env.appUrl}/${created.shortCode}`}
                label="short link"
              />
            </div>

            <Button variant="secondary" onClick={() => setQrFor(created)}>
              <QrCode className="h-4 w-4" aria-hidden />
              View QR code
            </Button>
          </div>
        </Drawer>

        <QrModal link={qrFor} onOpenChange={(value) => !value && setQrFor(null)} />
      </>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title="Shorten a link"
      description="Every link lives in a project, so it stays organised from the start."
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-link-form"
            loading={createMutation.isPending}
            disabled={!canSubmit}
          >
            Create short link
          </Button>
        </>
      }
    >
      <form
        id="create-link-form"
        className="flex flex-col gap-lg"
        onSubmit={submit}
        noValidate
      >
        {apiError && !apiError.isValidation && !apiError.isConflict && (
          <Alert tone="danger">{apiError.message}</Alert>
        )}
        {apiError?.isConflict && <Alert tone="danger">{apiError.message}</Alert>}

        <Input
          label="Destination URL"
          name="originalUrl"
          type="url"
          required
          autoFocus
          maxLength={2048}
          placeholder="https://example.com/a-very-long-address"
          value={form.originalUrl}
          onChange={(event) => set('originalUrl', event.target.value)}
          error={apiError?.fieldError('originalUrl')}
          disabled={createMutation.isPending}
        />

        <Input
          label="Title"
          name="title"
          required
          maxLength={150}
          placeholder="Spring campaign hero"
          value={form.title}
          onChange={(event) => set('title', event.target.value)}
          error={apiError?.fieldError('title')}
          hint="Unique within its project."
          disabled={createMutation.isPending}
        />

        <label className="flex flex-col gap-2xs">
          <span className="text-label-lg text-content-primary">Project</span>
          <select
            name="projectId"
            required
            value={form.projectId}
            onChange={(event) => set('projectId', event.target.value)}
            disabled={createMutation.isPending || Boolean(projectId)}
            className="h-10 rounded-md border border-border-subtle bg-surface-card px-sm text-body-md text-content-primary focus:outline-none focus-visible:border-primary-600 focus-visible:ring-2 focus-visible:ring-primary-600/20 disabled:bg-surface-subtle disabled:text-content-tertiary"
          >
            <option value="" disabled>
              {projectsQuery.isPending ? 'Loading projects…' : 'Choose a project'}
            </option>
            {projectsQuery.data?.map((project) => (
              <option key={project._id} value={project._id}>
                {project.title}
              </option>
            ))}
          </select>
          {projectsQuery.isSuccess && projectsQuery.data.length === 0 && (
            <span className="text-body-sm text-danger">
              Create a project first — every link needs one.
            </span>
          )}
          {apiError?.fieldError('projectId') && (
            <span className="text-body-sm text-danger">
              {apiError.fieldError('projectId')}
            </span>
          )}
        </label>

        <AliasField
          value={form.customAlias}
          onChange={(value) => set('customAlias', value)}
          error={apiError?.fieldError('customAlias')}
          disabled={createMutation.isPending}
        />

        <VisibilityFields
          visibility={form.visibility}
          onVisibilityChange={(value) => set('visibility', value)}
          password={form.password}
          onPasswordChange={(value) => set('password', value)}
          confirmPassword={form.confirmPassword}
          onConfirmPasswordChange={(value) => set('confirmPassword', value)}
          passwordError={passwordError ?? apiError?.fieldError('password') ?? undefined}
          disabled={createMutation.isPending}
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
            schedule.deleteError ?? apiError?.fieldError('scheduledDeleteAt') ?? undefined
          }
          disabled={createMutation.isPending}
        />
      </form>
    </Drawer>
  );
}
