import { Link, Outlet } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { BrandMark } from './BrandMark';

const NAV = [
  { to: '/features', label: 'Features' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

/** Header + footer chrome for the marketing pages. */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      {/*
        Two rows below `sm`, one above.

        The single-row version needs 418px of horizontal space before anything
        wraps — the wordmark, three nav links and a sign-in button do not fit on
        any common phone, so "Sign in" used to clip against the viewport edge
        with the container's own padding collapsed to nothing. Below `sm` the
        nav drops to its own centred row instead of a drawer: three links do not
        justify an overlay, and keeping them visible is what made them reachable
        on a phone in the first place.
      */}
      <header className="border-b border-border-subtle bg-surface-card">
        <div className="mx-auto flex max-w-6xl flex-col px-md sm:h-16 sm:flex-row sm:items-center sm:gap-lg">
          <div className="flex h-16 shrink-0 items-center justify-between gap-md sm:h-auto">
            <Link to="/" className="rounded-md">
              <BrandMark />
            </Link>

            <div className="flex items-center gap-xs sm:hidden">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Get started</Button>
              </Link>
            </div>
          </div>

          <nav
            aria-label="Main"
            className="flex gap-md border-t border-border-subtle py-xs sm:border-t-0 sm:py-0"
          >
            {NAV.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="rounded-md text-body-md text-content-secondary hover:text-content-primary"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-xs sm:flex">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Get started free</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border-subtle bg-surface-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-md px-md py-lg text-body-sm text-content-tertiary">
          <span>© {new Date().getFullYear()} SnapLink</span>
          <nav aria-label="Footer" className="ml-auto flex gap-md">
            {NAV.map(({ to, label }) => (
              <Link key={to} to={to} className="rounded-md hover:text-content-primary">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
