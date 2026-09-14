import { GoogleLogin } from '@react-oauth/google';
import { useEffect, useRef, useState } from 'react';

import { isGoogleAuthEnabled } from '@/env';

/**
 * Google Identity Services button.
 *
 * The `GoogleLogin` component is used rather than `useGoogleLogin` because the
 * backend's `POST /auth/google` verifies an **ID token**; the hook's default
 * flow yields an OAuth access token, which that endpoint cannot verify.
 *
 * Renders nothing when VITE_GOOGLE_CLIENT_ID is unset, so a deployment without
 * Google configured shows no dead control.
 */
export function GoogleSignInButton({
  text,
  onCredential,
  onError,
}: {
  text: 'signin_with' | 'signup_with';
  onCredential: (idToken: string) => void;
  onError: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  // Google renders into an iframe sized in pixels, so it cannot inherit a
  // percentage width. Measuring the row keeps it flush with the form fields at
  // every breakpoint instead of guessing one fixed width.
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = container.current;
    if (!element) return;

    const measure = () => setWidth(element.offsetWidth);
    measure();

    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  if (!isGoogleAuthEnabled) return null;

  return (
    <div ref={container} className="flex justify-center">
      {width > 0 && (
        <GoogleLogin
          text={text}
          width={width}
          shape="rectangular"
          logo_alignment="center"
          onSuccess={(response) => {
            if (response.credential) onCredential(response.credential);
            else onError();
          }}
          onError={onError}
        />
      )}
    </div>
  );
}

/** Divider between the credential form and the Google button. */
export function AuthDivider() {
  if (!isGoogleAuthEnabled) return null;

  return (
    <div className="flex items-center gap-sm" aria-hidden>
      <span className="h-px flex-1 bg-border-subtle" />
      <span className="text-body-sm text-content-tertiary">or</span>
      <span className="h-px flex-1 bg-border-subtle" />
    </div>
  );
}
