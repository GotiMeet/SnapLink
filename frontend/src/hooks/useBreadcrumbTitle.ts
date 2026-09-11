import { useContext, useEffect } from 'react';

import { BreadcrumbTitleContext } from '@/components/layout/breadcrumbContext';

/**
 * Publishes the current entity's title as the final breadcrumb, and clears it
 * on unmount so the next page never inherits the previous one's name.
 *
 * Pass `undefined` while loading: the crumb then renders as a placeholder
 * rather than flashing an empty segment.
 */
export function useBreadcrumbTitle(title: string | undefined) {
  const setTitle = useContext(BreadcrumbTitleContext);

  useEffect(() => {
    setTitle(title ?? null);
    return () => setTitle(null);
  }, [title, setTitle]);
}
