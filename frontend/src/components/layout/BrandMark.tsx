import { Link2 } from 'lucide-react';

/**
 * Wordmark only. PROJECT_MASTER.md section 8 is explicit that there is no
 * sub-brand label under the logo — earlier designs carried several competing
 * ones ("Enterprise Hub", "Workspace") that contradict the product's positioning.
 */
export function BrandMark() {
  return (
    <span className="flex items-center gap-xs">
      <span
        aria-hidden
        className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-white"
      >
        <Link2 className="h-5 w-5" />
      </span>
      <span className="font-heading text-heading-md text-content-primary">SnapLink</span>
    </span>
  );
}
