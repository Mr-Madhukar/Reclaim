import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { CaseStatus, Lane } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '₹0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
  } catch {
    return '—';
  }
}

export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return '—';
  }
}

export function getLaneBadgeProps(lane: Lane): { label: string; bgClass: string; textClass: string; borderClass: string } {
  switch (lane) {
    case 'PAYMENT':
      return {
        label: 'Payment Degradation',
        bgClass: 'bg-brand-500/10 dark:bg-brand-500/15',
        textClass: 'text-brand-600 dark:text-brand-400',
        borderClass: 'border-brand-500/30',
      };
    case 'CHECKOUT':
      return {
        label: 'Checkout Drop-off',
        bgClass: 'bg-indigo-500/10 dark:bg-indigo-500/15',
        textClass: 'text-indigo-600 dark:text-indigo-400',
        borderClass: 'border-indigo-500/30',
      };
    case 'RECEIVABLE':
      return {
        label: 'B2B Receivables',
        bgClass: 'bg-amber-500/10 dark:bg-amber-500/15',
        textClass: 'text-amber-700 dark:text-amber-400',
        borderClass: 'border-amber-500/30',
      };
    default:
      return {
        label: lane,
        bgClass: 'bg-slate-500/10',
        textClass: 'text-slate-600 dark:text-slate-400',
        borderClass: 'border-slate-500/30',
      };
  }
}

export function getStatusBadgeProps(status: CaseStatus): { label: string; bgClass: string; textClass: string; borderClass: string; dotClass: string } {
  switch (status) {
    case 'OPEN':
      return {
        label: 'Active at Risk',
        bgClass: 'bg-amber-500/10 dark:bg-amber-500/15',
        textClass: 'text-amber-700 dark:text-amber-400',
        borderClass: 'border-amber-500/30',
        dotClass: 'bg-amber-500 animate-pulse',
      };
    case 'RECOVERED':
      return {
        label: 'Recovered (Receipted)',
        bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15',
        textClass: 'text-emerald-700 dark:text-emerald-400',
        borderClass: 'border-emerald-500/30',
        dotClass: 'bg-emerald-500',
      };
    case 'STOPPED_MAX_ATTEMPTS':
      return {
        label: 'Stopped (Max Attempts)',
        bgClass: 'bg-rose-500/10 dark:bg-rose-500/15',
        textClass: 'text-rose-700 dark:text-rose-400',
        borderClass: 'border-rose-500/30',
        dotClass: 'bg-rose-500',
      };
    case 'STOPPED_OPTED_OUT':
      return {
        label: 'Stopped (Customer Opt-out)',
        bgClass: 'bg-slate-500/10 dark:bg-slate-500/15',
        textClass: 'text-slate-700 dark:text-slate-400',
        borderClass: 'border-slate-500/30',
        dotClass: 'bg-slate-500',
      };
    case 'ESCALATED_TO_HUMAN':
      return {
        label: 'Escalated to Human',
        bgClass: 'bg-purple-500/10 dark:bg-purple-500/15',
        textClass: 'text-purple-700 dark:text-purple-400',
        borderClass: 'border-purple-500/30',
        dotClass: 'bg-purple-500',
      };
    case 'EXPIRED':
      return {
        label: 'Expired',
        bgClass: 'bg-slate-500/10 dark:bg-slate-500/15',
        textClass: 'text-slate-600 dark:text-slate-400',
        borderClass: 'border-slate-500/30',
        dotClass: 'bg-slate-400',
      };
    default:
      return {
        label: status,
        bgClass: 'bg-slate-500/10',
        textClass: 'text-slate-700 dark:text-slate-400',
        borderClass: 'border-slate-500/30',
        dotClass: 'bg-slate-400',
      };
  }
}

export function formatRootCause(rootCause?: string | null): string {
  if (!rootCause) return 'Under Diagnosis';
  return rootCause
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
