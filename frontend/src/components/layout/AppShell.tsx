import { Outlet } from 'react-router-dom';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { UnverifiedEmailBanner } from './UnverifiedEmailBanner';

/** Chrome for every /app route: top bar, sidebar, and the main stage. */
export function AppShell() {
  return (
    <div className="min-h-screen bg-surface-canvas">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <UnverifiedEmailBanner />
          <div className="mx-auto max-w-7xl p-md lg:p-lg">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
