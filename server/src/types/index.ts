export const BOUNDED_ACTIONS = [
  'send_retry_link',
  'suggest_alt_payment_method',
  'send_mandate_reauth_link',
  'send_checkout_recovery_nudge',
  'apply_recovery_incentive',
  'send_reminder',
  'offer_payment_plan',
  'log_promise_to_pay',
  'escalate_to_human',
  'no_action_hold',
] as const;

export type BoundedActionType = typeof BOUNDED_ACTIONS[number];

export const ROOT_CAUSE_BUCKETS = [
  'insufficient_funds',
  'bank_timeout',
  'card_expired',
  'otp_failure',
  'mandate_expired',
  'risk_decline',
  'network_error',
  'unknown',
] as const;

export type RootCauseBucket = typeof ROOT_CAUSE_BUCKETS[number];

export interface PolicyCheckResult {
  allowed: boolean;
  reason: string;
  ruleTriggered?: 'case_status' | 'max_attempts' | 'cooldown' | 'contact_hours' | 'opt_out' | 'monetary_ceiling' | 'daily_cap';
}

export interface DiagnosisResult {
  rootCause: RootCauseBucket;
  confidence: number;
  explanation: string;
  recommendedAction: BoundedActionType;
  modelUsed: 'rules' | 'gemini-2.0-flash' | 'fallback_template';
  customerCopy?: {
    channel: 'email' | 'sms' | 'whatsapp';
    subject?: string;
    body: string;
  };
}

export interface StoppingRulesBreakdown {
  maxAttempts: number;
  customerOptOut: number;
  cooldownActive: number;
  contactHours: number;
  monetaryCeiling: number;
  dailyCap: number;
  total: number;
}

export interface EvaluationBenchmark {
  totalEvaluated: number;
  shouldRecoverCount: number;
  shouldNotRecoverCount: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  recall: number;
  precision: number;
  correctHoldRate: number;
  wastedIncentiveRate: number;
  f1Score: number;
}

export interface MetricSummary {
  totalAtRisk: number;
  totalRecovered: number;
  recoveryRatePercent: number;
  totalIncentiveSpent: number;
  netRecovered: number;
  activeCasesCount: number;
  recoveredCasesCount: number;
  stoppingRuleTriggersCount: number;
  stoppingRulesBreakdown?: StoppingRulesBreakdown;
  evaluation?: EvaluationBenchmark;
  laneMetrics: {
    payment: { atRisk: number; recovered: number; rate: number; caseCount: number };
    checkout: { atRisk: number; recovered: number; rate: number; caseCount: number };
    receivable: { atRisk: number; recovered: number; rate: number; caseCount: number };
  };
  rootCauseBreakdown: Record<string, { count: number; recoveredCount: number; recoveredAmount: number }>;
}

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'OPS_VIEWER' | 'REVIEWER';
  merchantId?: string;
}
