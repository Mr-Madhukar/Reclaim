import React, { useState } from 'react';
import {
  Lock,
  Mail,
  UserCheck,
  AlertCircle,
  ArrowLeft,
  User,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Award,
  Layers,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

interface LoginPageProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

type AuthMode = 'signin' | 'signup';

const ROLE_OPTIONS: { role: UserRole; label: string }[] = [
  { role: 'ADMIN', label: 'Admin' },
  { role: 'REVIEWER', label: 'Reviewer' },
  { role: 'OPS_VIEWER', label: 'Ops Viewer' },
];

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/**
 * Left Column: Platform Value & Architecture Showcase
 */
const PlatformShowcase: React.FC = () => (
  <div className="lg:col-span-5 p-6 sm:p-10 bg-gradient-to-b from-cream-200/50 via-cream-100/30 to-transparent dark:from-surface-850/60 dark:via-surface-900/40 dark:to-transparent border-b lg:border-b-0 lg:border-r border-cream-300 dark:border-surface-750 flex flex-col justify-between space-y-8">
    <div className="space-y-6">
      {/* Brand Header */}
      <div className="flex items-center space-x-3">
        <div className="h-12 w-12 rounded-2xl bg-white shadow-xl shadow-orange-500/20 border border-cream-300/80 dark:border-white/20 p-1.5 flex items-center justify-center shrink-0">
          <img
            src="/android-chrome-192x192.png"
            alt="Reclaim Brand Logo"
            className="h-full w-full object-contain rounded-xl"
          />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            RECLAIM
          </h2>
          <p className="text-xs text-brand-600 dark:text-brand-400 font-mono font-semibold">
            Autonomous Revenue Recovery Platform
          </p>
        </div>
      </div>

      {/* Tagline & Pitch */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
          Find revenue that&apos;s slipping away, and win it back — with a receipt for every rupee.
        </h3>
        <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
          Autonomous agents diagnose root causes and dispatch bounded interventions across payment failure, checkout abandonment, and overdue B2B receivables.
        </p>
      </div>

      {/* The Three Loss Lanes Feature Cards */}
      <div className="space-y-2.5 pt-2">
        <div className="p-3 rounded-2xl bg-cream-200/80 dark:bg-surface-850/80 border border-brand-500/20 flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 shrink-0">
            <Zap className="h-4 w-4" />
          </div>
          <div className="text-xs">
            <strong className="text-slate-900 dark:text-white block font-semibold">
              Lane A: Payment Degradation
            </strong>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight block">
              Smart retry cadences &amp; instant alternate gateway failover.
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-cream-200/80 dark:bg-surface-850/80 border border-indigo-500/20 flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Layers className="h-4 w-4" />
          </div>
          <div className="text-xs">
            <strong className="text-slate-900 dark:text-white block font-semibold">
              Lane B: Checkout Drop-off
            </strong>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight block">
              Intent preservation &amp; WhatsApp/SMS 1-click UPI nudges.
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-cream-200/80 dark:bg-surface-850/80 border border-amber-500/20 flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Activity className="h-4 w-4" />
          </div>
          <div className="text-xs">
            <strong className="text-slate-900 dark:text-white block font-semibold">
              Lane C: B2B Receivables
            </strong>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight block">
              Autonomous dunning, dynamic incentives &amp; promise-to-pay logging.
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* Architecture Safeguards Summary */}
    <div className="pt-4 border-t border-cream-300/80 dark:border-surface-750/80">
      <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
        <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span>100% Policy Engine</span>
        </div>
        <div className="flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400">
          <Award className="h-3.5 w-3.5 shrink-0" />
          <span>TRAI DND Compliant</span>
        </div>
      </div>
    </div>
  </div>
);

/**
 * 1-Click Instant Demo Login Subcomponent
 */
interface QuickDemoLoginProps {
  onQuickSwitch: (role: UserRole) => void;
  isSubmitting: boolean;
}

const QuickDemoLogin: React.FC<QuickDemoLoginProps> = ({ onQuickSwitch, isSubmitting }) => (
  <div className="space-y-3 mb-6 p-4 rounded-2xl bg-cream-200/60 dark:bg-surface-850/60 border border-cream-300 dark:border-surface-750">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 flex items-center space-x-1.5">
        <Zap className="h-3.5 w-3.5 text-brand-500" />
        <span>1-Click Demo Login</span>
      </span>
      <span className="text-[10px] text-brand-600 dark:text-brand-400 font-mono px-2 py-0.5 rounded-md bg-brand-500/10 border border-brand-500/30 font-semibold">
        Instant RBAC
      </span>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      <button
        type="button"
        onClick={() => onQuickSwitch('ADMIN')}
        disabled={isSubmitting}
        className="p-3 rounded-xl bg-cream-100 dark:bg-surface-800 hover:bg-brand-500/10 dark:hover:bg-brand-500/20 text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 border border-cream-300 dark:border-surface-700 hover:border-brand-500/40 text-left transition-all disabled:opacity-50 cursor-pointer group"
      >
        <div className="flex items-center space-x-2 mb-1">
          <UserCheck className="h-4 w-4 text-brand-500" />
          <span className="font-bold text-xs">Admin</span>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">
          Full controls, policies &amp; batch triggers
        </p>
      </button>

      <button
        type="button"
        onClick={() => onQuickSwitch('REVIEWER')}
        disabled={isSubmitting}
        className="p-3 rounded-xl bg-cream-100 dark:bg-surface-800 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 border border-cream-300 dark:border-surface-700 hover:border-indigo-500/40 text-left transition-all disabled:opacity-50 cursor-pointer group"
      >
        <div className="flex items-center space-x-2 mb-1">
          <UserCheck className="h-4 w-4 text-indigo-500" />
          <span className="font-bold text-xs">Reviewer</span>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">
          Manual overrides &amp; dunning actions
        </p>
      </button>

      <button
        type="button"
        onClick={() => onQuickSwitch('OPS_VIEWER')}
        disabled={isSubmitting}
        className="p-3 rounded-xl bg-cream-100 dark:bg-surface-800 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 border border-cream-300 dark:border-surface-700 hover:border-amber-500/40 text-left transition-all disabled:opacity-50 cursor-pointer group"
      >
        <div className="flex items-center space-x-2 mb-1">
          <UserCheck className="h-4 w-4 text-amber-500" />
          <span className="font-bold text-xs">Ops Viewer</span>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">
          Read-only telemetry &amp; audit reports
        </p>
      </button>
    </div>

    <div className="relative flex items-center justify-center pt-2">
      <div className="border-t border-cream-300 dark:border-surface-750 w-full" />
      <span className="bg-cream-200/60 dark:bg-surface-850 px-3 text-[10px] font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
        Or custom credentials
      </span>
    </div>
  </div>
);

/**
 * Sign In Form Subcomponent
 */
interface SignInFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const SignInForm: React.FC<SignInFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isSubmitting,
  onSubmit,
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5 sm:col-span-2">
        <label htmlFor="signin-email" className="text-xs font-semibold text-slate-800 dark:text-slate-300">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="signin-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@reclaim.demo"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <label htmlFor="signin-password" className="text-xs font-semibold text-slate-800 dark:text-slate-300">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="signin-password"
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>

    <button
      type="submit"
      disabled={isSubmitting}
      className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs shadow-glow-orange transition-all flex items-center justify-center space-x-2 cursor-pointer"
    >
      {isSubmitting ? (
        <span>Authenticating...</span>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          <span>Sign In</span>
        </>
      )}
    </button>
  </form>
);

/**
 * Sign Up Form Subcomponent
 */
interface SignUpFormProps {
  fullName: string;
  setFullName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  selectedRole: UserRole;
  setSelectedRole: (role: UserRole) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  selectedRole,
  setSelectedRole,
  showPassword,
  setShowPassword,
  isSubmitting,
  onSubmit,
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5 sm:col-span-2">
        <label htmlFor="signup-fullname" className="text-xs font-semibold text-slate-800 dark:text-slate-300">
          Full Name
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="signup-fullname"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Vikram Malhotra"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="signup-email" className="text-xs font-semibold text-slate-800 dark:text-slate-300">
          Work Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="signup-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vikram@enterprise.com"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="signup-password" className="text-xs font-semibold text-slate-800 dark:text-slate-300">
          Create Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>

    <fieldset className="space-y-1.5 border-0 p-0 m-0">
      <legend className="text-xs font-semibold text-slate-800 dark:text-slate-300">
        Platform Role
      </legend>
      <div className="grid grid-cols-3 gap-2">
        {ROLE_OPTIONS.map(({ role, label }) => (
          <button
            key={role}
            type="button"
            onClick={() => setSelectedRole(role)}
            className={`py-2 px-1 text-[11px] font-mono font-semibold rounded-xl border transition-all cursor-pointer ${
              selectedRole === role
                ? 'bg-brand-500/20 border-brand-500 text-brand-600 dark:text-brand-400'
                : 'bg-cream-200 dark:bg-surface-850 border-cream-300 dark:border-surface-750 text-cream-700 dark:text-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </fieldset>

    <button
      type="submit"
      disabled={isSubmitting}
      className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs shadow-glow-orange transition-all flex items-center justify-center space-x-2 cursor-pointer"
    >
      {isSubmitting ? (
        <span>Creating Account...</span>
      ) : (
        <>
          <Shield className="h-4 w-4" />
          <span>Create Account &amp; Sign In</span>
        </>
      )}
    </button>
  </form>
);

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onBack }) => {
  const { login, switchRole } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      onSuccess?.();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Login failed. Please verify your credentials.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      await switchRole(selectedRole);
      setSuccessMessage(`Account created successfully as ${selectedRole}!`);
      setTimeout(() => {
        onSuccess?.();
      }, 600);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Signup failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSwitch = async (role: UserRole) => {
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      await switchRole(role);
      onSuccess?.();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Switch failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-10 relative">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 flex items-center justify-center">
        <div className="w-[650px] h-[650px] bg-brand-500/10 dark:bg-brand-500/15 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between mb-6">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-cream-200/80 dark:bg-surface-850/80 border border-cream-300 dark:border-surface-750 text-xs font-semibold text-cream-800 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 hover:border-brand-500/40 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Platform</span>
          </button>
        )}

        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-mono ml-auto">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Razorpay AI Buildathon 2026</span>
        </div>
      </div>

      {/* Main Wide 2-Column Split Container */}
      <div className="w-full glass-panel rounded-3xl border border-cream-300 dark:border-surface-750 shadow-2xl overflow-hidden animate-slide-up">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Platform Value & Architecture Showcase */}
          <PlatformShowcase />

          {/* Right Column: Interactive Login & Quick Switch Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6">
            <div>
              {/* Tab Switcher: Sign In / Sign Up */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-750 mb-6 max-w-sm">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                      : 'text-cream-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                      : 'text-cream-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* 1-Click Quick Demo Login */}
              {mode === 'signin' && (
                <QuickDemoLogin onQuickSwitch={handleQuickSwitch} isSubmitting={isSubmitting} />
              )}

              {/* Feedback Messages */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Form Content */}
              {mode === 'signin' ? (
                <SignInForm
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  isSubmitting={isSubmitting}
                  onSubmit={handleSignIn}
                />
              ) : (
                <SignUpForm
                  fullName={fullName}
                  setFullName={setFullName}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  selectedRole={selectedRole}
                  setSelectedRole={setSelectedRole}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  isSubmitting={isSubmitting}
                  onSubmit={handleSignUp}
                />
              )}

              {/* Security & RBAC badge note */}
              <div className="mt-6 text-center">
                <p className="text-[11px] text-slate-500 dark:text-zinc-500 flex items-center justify-center space-x-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>End-to-end audit logging &amp; deterministic guardrails</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
