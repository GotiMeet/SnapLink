/**
 * The password gate's only endpoint.
 *
 * It lives at the SHORT-LINK origin (`POST {VITE_APP_URL}/:shortCode`), not
 * under /api/v1, which is why it does not go through the versioned `request`
 * helper — see PROJECT_MASTER.md section 10.
 *
 * `src=qr` must be forwarded from the incoming redirect. Without it, unlocking
 * a link that was scanned is recorded as an ordinary click and the QR-versus-web
 * split — the whole point of the QR metric — silently drifts.
 *
 * The returned destination must never be cached or persisted. The caller
 * navigates with it immediately and drops it; anything else would let a later
 * visitor on the same browser reach a protected destination without the password
 * (PROJECT_MASTER.md section 13, rule 2).
 */

import { requestPublic } from '@/lib/api';

export const unlockShortLink = ({
  shortCode,
  password,
  isQrVisit,
}: {
  shortCode: string;
  password: string;
  isQrVisit: boolean;
}) =>
  requestPublic<{ originalUrl: string }>(`/${encodeURIComponent(shortCode)}`, {
    method: 'POST',
    body: { password },
    params: isQrVisit ? { src: 'qr' } : undefined,
  }).then((data) => data.originalUrl);
