export type Lane = 'PAYMENT' | 'CHECKOUT' | 'RECEIVABLE';

export type CaseStatus =
  | 'OPEN'
  | 'RECOVERED'
  | 'STOPPED_MAX_ATTEMPTS'
  | 'STOPPED_OPTED_OUT'
  | 'ESCALATED_TO_HUMAN'
  | 'EXPIRED';

export type UserRole = 'ADMIN' | 'REVIEWER' | 'OPS_VIEWER';

export type BoundedActionType =
  | 'send_retry_link'
  | 'suggest_alt_payment_method'
  | 'send_mandate_reauth_link'
  | 'send_checkout_recovery_nudge'
  | 'apply_recovery_incentive'
  | 'send_reminder'
  | 'offer_payment_plan'
  | 'log_promise_to_pay'
  | 'escalate_to_human'
  | 'no_action_hold';

export type RootCauseBucket =
  | 'insufficient_funds'
  | 'bank_timeout'
  | 'card_expired'
  | 'otp_failure'
  | 'mandate_expired'
  | 'risk_decline'
  | 'network_error'
  | 'unknown';

export interface Customer {
  id: string;
  merchantId: string;
  name: string;
  email: string;
  phone?: string | null;
  optedOut: boolean;
  createdAt: string;
}

export interface PromiseToPay {
  id: string;
  caseId: string;
  promisedAmount: number;
  promisedDate: string;
  status: 'PENDING' | 'KEPT' | 'BROKEN';
  recordedBy: string;
  createdAt: string;
}

export interface RecoveryAction {
  id: string;
  caseId: string;
  actionType: string;
  channel?: string | null;
  payloadJson: Record<string, unknown> | null;
  decisionReason: string;
  modelUsed?: string | null;
  attemptNumber: number;
  createdAt: string;
  outcome?: string | null;
}

export interface RecoveryCase {
  id: string;
  merchantId: string;
  customerId: string;
  customer: Customer;
  lane: Lane;
  sourceRefId: string;
  rootCause?: string | null;
  status: CaseStatus;
  amount: number;
  openedAt: string;
  closedAt?: string | null;
  closedReason?: string | null;
  actions: RecoveryAction[];
  promiseToPay?: PromiseToPay | null;
}

export interface PolicyConfig {
  id: string;
  merchantId: string;
  lane: Lane;
  maxAttempts: number;
  cooldownMinutes: number;
  maxIncentiveAmount: number;
  dailyCapGlobal: number;
}

export interface AuditLog {
  id: string;
  actor: string;
  entityType: string;
  entityId: string;
  eventType: string;
  beforeJson?: Record<string, unknown> | null;
  afterJson?: Record<string, unknown> | null;
  reason: string;
  createdAt: string;
}

export interface LaneMetric {
  atRisk: number;
  recovered: number;
  rate: number;
  caseCount: number;
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
  laneMetrics: {
    payment: LaneMetric;
    checkout: LaneMetric;
    receivable: LaneMetric;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  merchantId: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CaseFilterParams {
  lane?: Lane | 'ALL';
  status?: CaseStatus | 'ALL';
  rootCause?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BatchRunResult {
  processedCount: number;
  recoveredCount: number;
  stoppedCount: number;
  escalatedCount: number;
  errorsCount: number;
  durationMs: number;
}
