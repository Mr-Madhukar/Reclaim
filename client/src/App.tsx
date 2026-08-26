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
import { LoginModal } from './components/auth/LoginModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex flex-col bg-cream-100 dark:bg-surface-950 text-cream-900 dark:text-slate-100 selection:bg-brand-500 selection:text-white transition-colors">
      {/* Top Sticky Header */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onOpenLoginModal={() => setLoginModalOpen(true)}
      />

      {/* Slide-out Mobile Navigation */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'landing' && <LandingPage onSelectTab={setActiveTab} />}
        {activeTab === 'overview' && <DashboardOverview />}
        {activeTab === 'cases' && <CasesView />}
        {activeTab === 'sandbox' && <SandboxView />}
        {activeTab === 'policies' && <PolicyConfigView />}
        {activeTab === 'audit' && <AuditView />}
        {activeTab === 'scorecard' && <EvaluatorScorecard />}
      </main>

      {/* Footer */}
      <Footer />

      {/* Auth Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </div>
  );
}
