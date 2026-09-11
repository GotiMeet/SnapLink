import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, FolderPlus, Link2, Plus } from 'lucide-react';

import { CreateLinkDrawer } from '@/components/links/CreateLinkDrawer';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { DropdownMenu, menuItemClass } from '@/components/ui/DropdownMenu';

/**
 * The top bar's "+ Create" (PROJECT_MASTER.md section 8): Shorten URL and New
 * Project, in that order.
 *
 * It mounts its own drawer and modal. Pages that also offer these actions mount
 * their own instances, which keeps overlays owned by whatever opened them (D12)
 * and avoids a shell-wide state channel for two booleans.
 */
export function CreateMenu() {
  const navigate = useNavigate();
  const [linkOpen, setLinkOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);

  return (
    <>
      <DropdownMenu
        label="Create"
        width="w-52"
        triggerClassName="inline-flex h-10 items-center gap-xs rounded-md bg-primary-600 px-sm text-body-md font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 active:bg-primary-800"
        trigger={
          <>
            <Plus className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Create</span>
            <ChevronDown className="h-4 w-4" aria-hidden />
            <span className="sr-only">Create a link or project</span>
          </>
        }
      >
        <button
          role="menuitem"
          type="button"
          onClick={() => setLinkOpen(true)}
          className={menuItemClass}
        >
          <Link2 className="h-4 w-4 shrink-0" aria-hidden />
          Shorten URL
        </button>
        <button
          role="menuitem"
          type="button"
          onClick={() => setProjectOpen(true)}
          className={menuItemClass}
        >
          <FolderPlus className="h-4 w-4 shrink-0" aria-hidden />
          New Project
        </button>
      </DropdownMenu>

      <CreateLinkDrawer open={linkOpen} onOpenChange={setLinkOpen} />
      <CreateProjectModal
        open={projectOpen}
        onOpenChange={setProjectOpen}
        onCreated={(projectId) => navigate(`/app/projects/${projectId}`)}
      />
    </>
  );
}
