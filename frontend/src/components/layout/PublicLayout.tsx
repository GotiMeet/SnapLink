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
      <header className="border-b border-border-subtle bg-surface-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-md px-md sm:gap-lg">
          <Link to="/" className="rounded-md">
            <BrandMark />
          </Link>
          {/*
            Visible at every width. Hiding these on mobile with no drawer left
            the marketing pages unreachable from the header on a phone; the
            secondary CTA yields instead, since the Home hero carries one.
          */}
          <nav aria-label="Main" className="flex gap-sm sm:gap-md">
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
          <div className="ml-auto flex items-center gap-xs">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/signup" className="hidden sm:block">
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
