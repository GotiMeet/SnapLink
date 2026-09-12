import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { TabPanel, Tabs } from '@/components/ui/Tabs';
import { usePageMeta } from '@/hooks/usePageMeta';

type SettingsTab = 'profile' | 'security';

/**
 * SCR-AUTH-11.
 *
 * Two tabs, and only two. PROJECT_MASTER.md section 9 rules out everything the
 * earlier designs carried here — avatar upload, timezone, role, tier, 2FA,
 * password age, a session list, delete account, transfer ownership — because no
 * endpoint backs any of them.
 *
 * Theme has no backend representation at all: it is a localStorage preference,
 * so it lives inside Profile rather than occupying a route of its own.
 *
 * These are real routes rather than in-page panels because the sidebar and the
 * account menu both link straight to them, so each has to be reachable by URL.
 */
export function SettingsLayout() {
  usePageMeta({ title: 'Settings', noindex: true });
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const active: SettingsTab = pathname.endsWith('/security') ? 'security' : 'profile';

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-2xs">
        <h1 className="text-heading-xl">Settings</h1>
        <p className="text-body-md text-content-secondary">
          Your account details and how you sign in.
        </p>
      </header>

      <Tabs<SettingsTab>
        label="Settings sections"
        active={active}
        /*
         * `replace` because Tabs selects on focus: arrowing across the strip
         * would otherwise push a history entry per keypress, so a keyboard user
         * exploring the tabs silently buried whatever they arrived from. The
         * Recycle Bin and analytics tab strips already do this.
         */
        onChange={(next) => navigate(`/app/settings/${next}`, { replace: true })}
        tabs={[
          { id: 'profile', label: 'Profile' },
          { id: 'security', label: 'Security' },
        ]}
      />

      <TabPanel id={active}>
        <Outlet />
      </TabPanel>
    </div>
  );
}
