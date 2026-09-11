import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

import { getQrBlob } from '@/api/urls';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { env } from '@/env';
import type { ShortUrl } from '@/types/models';

const shortLinkHost = env.appUrl.replace(/^https?:\/\//, '');

/**
 * SCR-AUTH-08.
 *
 * The QR encodes `{APP_URL}/{shortCode}?src=qr`, which is what makes a scan
 * count as a QR scan instead of an ordinary click — the whole basis of the
 * clicks-versus-scans split. The copy says so, because a user who reproduces
 * the plain short URL in their own QR generator loses that attribution silently.
 *
 * PNG only. There is no SVG option in v1 (PROJECT_MASTER.md section 16), so no
 * format control is offered.
 */
export function QrModal({
  link,
  onOpenChange,
}: {
  /** The link whose QR is shown, or null when the modal is closed. */
  link: ShortUrl | null;
  onOpenChange: (open: boolean) => void;
}) {
  const qrQuery = useQuery({
    queryKey: ['qr', link?._id],
    queryFn: () => getQrBlob(link!._id),
    enabled: Boolean(link),
    staleTime: 5 * 60_000,
  });

  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Object URLs are revoked explicitly; without this each open leaks one blob
  // for the lifetime of the document.
  useEffect(() => {
    const blob = qrQuery.data;
    if (!blob) {
      setObjectUrl(null);
      return;
    }

    const next = URL.createObjectURL(blob);
    setObjectUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [qrQuery.data]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const download = () => {
    if (!objectUrl || !link) return;
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `snaplink-${link.shortCode}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const copyImage = async () => {
    const blob = qrQuery.data;
    if (!blob) return;

    // Image clipboard writes need a secure context and, in several browsers,
    // are unsupported outright. Download is always available, so the failure
    // path points there rather than leaving the user stuck.
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        throw new Error('unsupported');
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
    } catch {
      toast.error('Your browser blocked copying the image. Download it instead.');
    }
  };

  return (
    <Modal
      open={link !== null}
      onOpenChange={onOpenChange}
      title="QR code"
      description={link ? `${shortLinkHost}/${link.shortCode}` : undefined}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={copyImage} disabled={!qrQuery.data}>
            {copied ? (
              <Check className="h-4 w-4" aria-hidden />
            ) : (
              <Copy className="h-4 w-4" aria-hidden />
            )}
            {copied ? 'Copied' : 'Copy image'}
          </Button>
          <Button onClick={download} disabled={!objectUrl}>
            <Download className="h-4 w-4" aria-hidden />
            Download PNG
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-md">
        {qrQuery.isPending && <Skeleton className="h-56 w-56 rounded-lg" />}

        {qrQuery.isError && (
          <Alert
            tone="danger"
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => qrQuery.refetch()}
                loading={qrQuery.isFetching}
              >
                Retry
              </Button>
            }
          >
            Unable to generate QR code.
          </Alert>
        )}

        {objectUrl && (
          <img
            src={objectUrl}
            alt={`QR code for ${link?.title ?? 'this link'}`}
            className="h-56 w-56 rounded-lg border border-border-subtle bg-white p-xs"
          />
        )}

        <p className="text-center text-body-sm text-content-secondary">
          Scans of this code are recorded as QR scans, separately from web clicks.
          Generating your own code from the short URL would count those scans as ordinary
          clicks.
        </p>
      </div>
    </Modal>
  );
}
