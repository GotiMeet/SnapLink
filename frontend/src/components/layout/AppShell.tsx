import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Breadcrumbs } from './Breadcrumbs';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { UnverifiedEmailBanner } from './UnverifiedEmailBanner';

const COLLAPSE_KEY = 'snaplink-sidebar-collapsed';

const readCollapsed = (): boolean => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === 'true';
  } catch {
    // Private mode or blocked storage: start expanded.
    return false;
  }
};

/**
 * Chrome for every /app route: top bar, sidebar, and the main stage.
 *
 * The collapse state lives here because the rail is the only thing that reads
 * it, and putting it in context would mean a provider for a single boolean with
 * one consumer.
 */
export function AppShell() {
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggleSidebar = useCallback(() => {
    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem(COLLAPSE_KEY, String(next));
      } catch {
        // Persisting is best-effort; the session still behaves correctly.
      }
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-surface-canvas">
      {/*
        WCAG 2.4.1. The sidebar puts six links between the top of the document
        and the content on every single page; without this a keyboard or screen
        reader user tabs through all of them again on every navigation.
      */}
      <a
        href="#main-content"
        className="sr-only-focusable absolute left-md top-md z-50 rounded-md bg-primary-600 px-sm py-xs text-body-md text-white"
      >
        Skip to content
      </a>

      <TopBar />

      <div className="flex">
        <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />

        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">
          <UnverifiedEmailBanner />
          <div className="mx-auto max-w-7xl p-md lg:p-lg">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
