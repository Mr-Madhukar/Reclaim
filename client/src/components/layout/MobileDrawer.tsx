import React, { useEffect } from 'react';
import {
  X,
  Sparkles,
  LayoutDashboard,
  FileText,
  Sliders,
  History,
  FlaskConical,
  Award,
  ShieldCheck,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { MainTab } from './Navbar';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
}) => {
  const { user, switchRole, logout } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const roles: { role: UserRole; label: string }[] = [
    { role: 'ADMIN', label: 'Admin' },
    { role: 'REVIEWER', label: 'Reviewer' },
    { role: 'OPS_VIEWER', label: 'Ops Viewer' },
  ];

  const navItems: { tab: MainTab; label: string; icon: React.ComponentType<{ className?: string }>; allowedRoles?: UserRole[] }[] = [
    { tab: 'landing', label: 'Project Showcase', icon: Sparkles },
    { tab: 'overview', label: 'Dashboard KPIs', icon: LayoutDashboard },
    { tab: 'cases', label: 'Case Workbench', icon: FileText },
    { tab: 'sandbox', label: 'Simulation Sandbox', icon: FlaskConical, allowedRoles: ['ADMIN', 'REVIEWER'] },
    { tab: 'policies', label: 'Policy Engine', icon: Sliders, allowedRoles: ['ADMIN'] },
    { tab: 'audit', label: 'Audit Trail', icon: History, allowedRoles: ['ADMIN', 'OPS_VIEWER'] },
    { tab: 'scorecard', label: 'Scorecard', icon: Award, allowedRoles: ['ADMIN', 'OPS_VIEWER'] },
  ];

  // Unauthorised users only see Showcase; logged-in users see permitted tabs
  const visibleNavItems = navItems.filter((item) => {
    if (!user) {
      return item.tab === 'landing';
    }
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(user.role);
  });

  const handleSwitchRole = (newRole: UserRole) => {
    switchRole(newRole);

    const permittedTabs = navItems.filter(
      (item) => !item.allowedRoles || item.allowedRoles.includes(newRole)
    ).map((t) => t.tab);

    if (!permittedTabs.includes(activeTab)) {
      onSelectTab('overview');
    }
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    onSelectTab('landing');
  };

  return (
    <dialog
      open
      aria-modal="true"
      aria-label="Navigation Menu"
      className="fixed inset-0 z-50 flex xl:hidden animate-fade-in w-full h-full max-w-none max-h-none m-0 p-0 bg-transparent border-0"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close navigation drawer backdrop"
        className="fixed inset-0 bg-black/60 backdrop-blur-sm w-full h-full border-0 p-0 cursor-default"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative ml-auto w-full max-w-xs h-full bg-cream-100 dark:bg-surface-900 shadow-2xl p-6 flex flex-col justify-between border-l border-cream-300 dark:border-surface-750 animate-slide-up overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-cream-300 dark:border-surface-750">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-white shadow-xs border border-cream-300/80 dark:border-surface-700/80 p-0.5 overflow-hidden flex items-center justify-center">
                <img
                  src="/android-chrome-192x192.png"
                  alt="Reclaim Logo"
                  className="h-full w-full object-contain rounded-md"
                />
              </div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                RECLAIM
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-cream-200 dark:bg-surface-800 text-cream-700 dark:text-slate-300 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="py-6 space-y-1.5">
            {visibleNavItems.map(({ tab, label, icon: Icon }) => (
              <button
                key={tab}
                onClick={() => {
                  onSelectTab(tab);
                  onClose();
                }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-cream-800 dark:text-slate-300 hover:bg-cream-200 dark:hover:bg-surface-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}

            {/* Auth CTA or User profile card */}
            {!user ? (
              <button
                type="button"
                onClick={() => {
                  onSelectTab('login');
                  onClose();
                }}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all mt-3 cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-brand-600 dark:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30'
                }`}
              >
                <span>Login / Sign Up Page</span>
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-cream-200/80 dark:bg-surface-850/80 border border-cream-300 dark:border-surface-750 mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/30">
                    {user.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                  {user.email}
                </p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Persona Switcher or Unauthenticated Prompt */}
        <div className="pt-4 border-t border-cream-300 dark:border-surface-750">
          {user ? (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-cream-600 dark:text-slate-400 mb-2">
                Active RBAC Persona
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {roles.map(({ role, label }) => (
                  <button
                    key={role}
                    onClick={() => handleSwitchRole(role)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                      user.role === role
                        ? 'bg-brand-500 text-white'
                        : 'bg-cream-200 dark:bg-surface-800 text-cream-800 dark:text-slate-300 border border-cream-300 dark:border-surface-750'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Policy Engine Guardrails On</span>
              </div>
            </>
          ) : (
            <div className="space-y-2 text-center">
              <div className="flex items-center justify-center space-x-1.5 text-xs text-brand-600 dark:text-brand-400 font-medium">
                <UserCheck className="h-4 w-4" />
                <span>Protected Enterprise Access</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Login with Admin, Reviewer, or Ops credentials to view recovery pipelines.
              </p>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
};
