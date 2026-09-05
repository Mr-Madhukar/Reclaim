import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Menu,
  ChevronDown,
  LayoutDashboard,
  Sparkles,
  FileText,
  Sliders,
  History,
  FlaskConical,
  Award,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

export type MainTab = 'landing' | 'overview' | 'cases' | 'sandbox' | 'policies' | 'audit' | 'scorecard' | 'login';

interface NavbarProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  onOpenMobileMenu: () => void;
  onNavigateToLogin: () => void;
}

interface NavTabItem {
  id: MainTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: UserRole[];
}

const NAV_TABS: NavTabItem[] = [
  { id: 'landing', label: 'Showcase', icon: Sparkles },
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cases', label: 'Workbench', icon: FileText },
  { id: 'sandbox', label: 'Sandbox', icon: FlaskConical, allowedRoles: ['ADMIN', 'REVIEWER'] },
  { id: 'policies', label: 'Policies', icon: Sliders, allowedRoles: ['ADMIN'] },
  { id: 'audit', label: 'Audit', icon: History, allowedRoles: ['ADMIN', 'OPS_VIEWER'] },
  { id: 'scorecard', label: 'Scorecard', icon: Award, allowedRoles: ['ADMIN', 'OPS_VIEWER'] },
];

const TAB_ACTIVE_CLASS = 'bg-brand-500 text-white shadow-[0_0_15px_-3px_rgba(249,115,22,0.4)]';
const TAB_INACTIVE_CLASS = 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-cream-300/50 dark:hover:bg-white/[0.05]';

const ROLE_CONFIG: Record<
  UserRole,
  { label: string; desc: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  ADMIN: {
    label: 'Admin',
    desc: 'Full write & batch trigger access',
    badgeClass: 'bg-brand-500/10 border-brand-500/30 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20',
    icon: ShieldCheck,
  },
  REVIEWER: {
    label: 'Reviewer',
    desc: 'Case resolution & interventions',
    badgeClass: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20',
    icon: UserCheck,
  },
  OPS_VIEWER: {
    label: 'Ops Viewer',
    desc: 'Read-only financial audit mode',
    badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20',
    icon: Award,
  },
};

const ROLES_LIST: { role: UserRole; label: string; desc: string }[] = [
  { role: 'ADMIN', label: 'Admin', desc: 'Full write & batch trigger access' },
  { role: 'REVIEWER', label: 'Reviewer', desc: 'Case resolution & interventions' },
  { role: 'OPS_VIEWER', label: 'Ops Viewer', desc: 'Read-only financial audit mode' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenMobileMenu,
  onNavigateToLogin,
}) => {
  const { user, switchRole, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Unauthorised users only see the Showcase tab; logged in users see their role-permitted tabs
  const visibleNavTabs = NAV_TABS.filter((tab) => {
    if (!user) {
      return tab.id === 'landing';
    }
    if (!tab.allowedRoles) return true;
    return tab.allowedRoles.includes(user.role);
  });

  const handleSwitchRole = (newRole: UserRole) => {
    switchRole(newRole);
    setProfileDropdownOpen(false);

    // Auto-switch to dashboard if the current activeTab is not allowed in the new role
    const permittedTabs = NAV_TABS.filter(
      (tab) => !tab.allowedRoles || tab.allowedRoles.includes(newRole)
    ).map((t) => t.id);

    if (!permittedTabs.includes(activeTab)) {
      onSelectTab('overview');
    }
  };

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    onSelectTab('landing');
  };

  const ActiveRoleIcon = user ? ROLE_CONFIG[user.role]?.icon || UserCheck : UserCheck;

  return (
    <header className="sticky top-0 z-40 w-full bg-cream-100/80 dark:bg-[#020202]/80 backdrop-blur-xl border-b border-cream-300/80 dark:border-white/[0.08] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand / Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onSelectTab('landing')}
            className="flex items-center space-x-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-xl"
            aria-label="Reclaim — Go to Showcase page"
          >
            <div className="h-9 w-9 rounded-xl bg-white shadow-md shadow-orange-500/15 border border-cream-300/80 dark:border-white/20 p-1 overflow-hidden flex items-center justify-center group-hover:scale-105 transition-all">
              <img
                src="/android-chrome-192x192.png"
                alt="Reclaim Logo"
                className="h-full w-full object-contain rounded-lg"
              />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
              RECLAIM
            </span>
          </button>
        </div>

        {/* Center: Desktop Navigation Tabs (Filtered dynamically by auth & role) */}
        <nav aria-label="Main navigation" className="hidden xl:flex items-center space-x-1 bg-cream-200/80 dark:bg-white/[0.03] p-1 rounded-full border border-cream-300/80 dark:border-white/[0.08] backdrop-blur-md">
          {visibleNavTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onSelectTab(id)}
              aria-current={activeTab === id ? 'page' : undefined}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeTab === id ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Right: Guardrails + Dynamic Auth / Role Pill + Mobile Trigger */}
        <div className="flex items-center space-x-2.5">
          {/* Policy Guardrail Live Pulse (visible when logged in) */}
          {user && (
            <div className="hidden lg:flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span className="font-medium text-[11px]">Guardrails Active</span>
            </div>
          )}

          {/* DYNAMIC AUTH / ROLE SECTION */}
          {!user ? (
            /* Unauthorised state: Prominent Login / Sign Up Button */
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <span>Login / Sign Up</span>
            </button>
          ) : (
            /* Authenticated state: Role Badge Profile Pill & Dropdown */
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
                aria-label={`User profile for ${user.name}, role ${user.role}`}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  ROLE_CONFIG[user.role]?.badgeClass || 'bg-cream-200 dark:bg-surface-850'
                }`}
              >
                <ActiveRoleIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="font-mono font-bold uppercase tracking-wider text-[11px]">
                  {user.role}
                </span>
                <span className="hidden sm:inline font-sans text-slate-700 dark:text-slate-300 border-l border-cream-300 dark:border-white/10 pl-2 text-xs">
                  {user.name}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-500 dark:text-slate-400 shrink-0" />
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel shadow-2xl p-2.5 z-50 animate-slide-down border border-cream-300 dark:border-surface-700"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  {/* User Profile Header */}
                  <div className="px-2.5 py-2 border-b border-cream-200 dark:border-surface-750">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                      {user.email}
                    </p>
                    <div className="mt-1.5 inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                      <span>ROLE:</span>
                      <span>{user.role}</span>
                    </div>
                  </div>

                  {/* Switch Persona (RBAC) section */}
                  <div className="pt-2 pb-1">
                    <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      Switch Persona (RBAC)
                    </div>
                    <div className="space-y-1">
                      {ROLES_LIST.map(({ role, label, desc }) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleSwitchRole(role)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex flex-col transition-colors cursor-pointer ${
                            user.role === role
                              ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400 font-semibold border border-brand-500/30'
                              : 'text-slate-800 dark:text-slate-200 hover:bg-cream-200/60 dark:hover:bg-surface-800'
                          }`}
                        >
                          <span className="flex items-center justify-between">
                            <span>{label}</span>
                            {user.role === role && (
                              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                            )}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-normal">
                            {desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sign Out Action */}
                  <div className="pt-1.5 border-t border-cream-200 dark:border-surface-750">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors font-semibold cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5 shrink-0" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={onOpenMobileMenu}
            className="xl:hidden p-2 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-750 text-cream-800 dark:text-slate-200 cursor-pointer"
            aria-label="Open mobile menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
