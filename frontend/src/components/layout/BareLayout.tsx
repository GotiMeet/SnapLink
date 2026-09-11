import { Link, Outlet } from 'react-router-dom';

import { BrandMark } from './BrandMark';

/**
 * Chrome-free shell for auth screens and the public password gate: a centred
 * card on the canvas, no navigation. Keeps the visitor focused on one action.
 */
export function BareLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-lg bg-surface-canvas p-md">
      <Link to="/" className="rounded-md">
        <BrandMark />
      </Link>
      <main className="w-full max-w-md">
        <Outlet />
      </main>
    </div>
  );
}
