import { useState } from 'react';
import { Navbar, MainTab } from './components/layout/Navbar';
import { MobileDrawer } from './components/layout/MobileDrawer';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './components/landing/LandingPage';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { CasesView } from './components/cases/CasesView';
import { SandboxView } from './components/sandbox/SandboxView';
import { PolicyConfigView } from './components/policies/PolicyConfigView';
import { AuditView } from './components/audit/AuditView';
import { EvaluatorScorecard } from './components/scorecard/EvaluatorScorecard';
import { LoginPage } from './components/auth/LoginPage';

/** Map tab keys to human-readable page titles for screen reader announcements */
const TAB_TITLES: Record<MainTab, string> = {
  landing: 'Showcase',
  overview: 'Revenue Recovery Command Center',
  cases: 'Cases Workbench',
  sandbox: 'Sandbox Simulator',
  policies: 'Policy Configuration',
  audit: 'Audit Trail',
  scorecard: 'Evaluator Scorecard',
  login: 'Sign In / Sign Up',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handleTabChange = (tab: MainTab) => {
    setActiveTab(tab);
  };

  // Dedicated Login / Sign Up Page view
  if (activeTab === 'login') {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-transparent text-slate-100 selection:bg-brand-500 selection:text-white relative">
        <LoginPage
          onSuccess={() => setActiveTab('overview')}
          onBack={() => setActiveTab('landing')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-100 selection:bg-brand-500 selection:text-white relative">
      {/* Skip to main content — accessibility best practice */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-brand-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Top Sticky Header */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onNavigateToLogin={() => setActiveTab('login')}
      />

      {/* Slide-out Mobile Navigation */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeTab={activeTab}
        onSelectTab={handleTabChange}
      />

      {/* Main Content Area with accessible id */}
      <main
        id="main-content"
        aria-label={TAB_TITLES[activeTab]}
        tabIndex={-1}
        className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full focus:outline-none"
      >
        {activeTab === 'landing' && <LandingPage onSelectTab={handleTabChange} />}
        {activeTab === 'overview' && <DashboardOverview />}
        {activeTab === 'cases' && <CasesView />}
        {activeTab === 'sandbox' && <SandboxView />}
        {activeTab === 'policies' && <PolicyConfigView />}
        {activeTab === 'audit' && <AuditView />}
        {activeTab === 'scorecard' && <EvaluatorScorecard />}
      </main>

      {/* Screen reader live region for page navigation announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {`Viewing ${TAB_TITLES[activeTab]} page`}
      </div>

      {/* Footer */}
      <Footer onSelectTab={handleTabChange} />
    </div>
  );
}

