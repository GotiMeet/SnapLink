import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import App from './App';
import { AuthProvider } from '@/auth/AuthProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { queryClient } from '@/lib/queryClient';
import { initTheme } from '@/hooks/useTheme';
import './index.css';

// Applied before React mounts so a dark-mode user never sees a white flash.
initTheme();

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found in index.html');

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {/* AuthProvider sits inside the router so route guards can read it. */}
          <AuthProvider>
            <App />
          </AuthProvider>
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
