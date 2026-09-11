import { createContext } from 'react';

/**
 * Lets a detail page name the last breadcrumb.
 *
 * The trail is otherwise derived from the pathname, which cannot label a
 * dynamic segment: `/app/projects/671f3a…` carries an id, and only the page
 * that fetches it knows the title behind it. FRONTEND_REQUIREMENTS §290
 * specifies `Dashboard > Projects > [Project Title]`, so the page pushes the
 * title up rather than the shell fetching it a second time.
 *
 * Deliberately just a setter. The value lives in AppShell, which is the only
 * thing that renders Breadcrumbs.
 */
export const BreadcrumbTitleContext = createContext<(title: string | null) => void>(
  () => {}
);
