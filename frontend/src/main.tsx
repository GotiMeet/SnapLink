import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';

import App from './App';
import { env, isGoogleAuthEnabled } from '@/env';
import { AuthProvider } from '@/auth/AuthProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { queryClient } from '@/lib/queryClient';
import { initTheme } from '@/hooks/useTheme';
import './index.css';

// Applied before React mounts so a dark-mode user never sees a white flash.
initTheme();

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found in index.html');

/**
 * GoogleOAuthProvider loads Google's script as soon as it mounts, so it is only
 * mounted when a client id is configured. A deployment without Google set up
 * then costs nothing and renders no Google controls.
 */
const withGoogle = (children: ReactNode) =>
  isGoogleAuthEnabled ? (
    <GoogleOAuthProvider clientId={env.googleClientId}>{children}</GoogleOAuthProvider>
  ) : (
    children
  );

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {/* AuthProvider sits inside the router so route guards can read it. */}
          <AuthProvider>{withGoogle(<App />)}</AuthProvider>
        </BrowserRouter>
        <Toaster
          position="top-right"
          duration={4000}
          closeButton
          toastOptions={{ className: 'font-body' }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
