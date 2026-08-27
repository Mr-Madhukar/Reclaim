import { describe, it, expect, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { PolicyEngine } from '../src/services/policy-engine';

describe('PolicyEngine — Deterministic Compliance Gate', () => {
  let policyEngine: PolicyEngine;
  const testDate = new Date('2026-08-25T08:30:00.000Z'); // 14:00 IST (valid contact hours 9-19)

  beforeEach(() => {
    policyEngine = new PolicyEngine();
  });

  const createMockDb = (overrides?: {
    caseStatus?: string;
    optedOut?: boolean;
    maxAttempts?: number;
    attemptCount?: number;
    cooldownMinutes?: number;
    lastActionMinutesAgo?: number;
    contactHourStart?: number;
    contactHourEnd?: number;
    maxIncentiveAmount?: number;
    dailyActionsToday?: number;
    dailyCapGlobal?: number;
    baseDate?: Date;
  }) => {
    const defaultDate = overrides?.baseDate || testDate;
    const opts = {
      caseStatus: 'OPEN',
      optedOut: false,
      maxAttempts: 3,
      attemptCount: 0,
      cooldownMinutes: 60,
      lastActionMinutesAgo: 120, // 2 hours ago by default
      contactHourStart: 9,
      contactHourEnd: 19,
      maxIncentiveAmount: 500,
      dailyActionsToday: 5,
      dailyCapGlobal: 500,
      baseDate: defaultDate,
      ...overrides,
    };

    return {
      recoveryCase: {
        findUnique: async () => ({
          id: 'case-test-1',
          merchantId: 'merchant-1',
          lane: 'PAYMENT',
          status: opts.caseStatus,
          customer: {
            id: 'cust-1',
            optedOut: opts.optedOut,
          },
          merchant: {
            id: 'merchant-1',
            timezone: 'Asia/Kolkata',
            contactHourStart: opts.contactHourStart,
            contactHourEnd: opts.contactHourEnd,
          },
        }),
      },
      policyConfig: {
        findUnique: async () => ({
          maxAttempts: opts.maxAttempts,
          cooldownMinutes: opts.cooldownMinutes,
          contactHourStart: opts.contactHourStart,
          contactHourEnd: opts.contactHourEnd,
          maxIncentiveAmount: opts.maxIncentiveAmount,
          dailyCapGlobal: opts.dailyCapGlobal,
        }),
      },
      recoveryAction: {
        count: async ({ where }: { where?: { case?: { merchantId?: string } } }) => {
          if (where?.case?.merchantId) {
            return opts.dailyActionsToday;
          }
          return opts.attemptCount;
        },
        findFirst: async () => {
          if (opts.lastActionMinutesAgo === undefined) return null;
          return {
            id: 'action-last',
            createdAt: new Date(opts.baseDate.getTime() - opts.lastActionMinutesAgo * 60 * 1000),
          };
        },
      },
    } as unknown as Prisma.TransactionClient;
  };

  it('Check 1: Blocks action when case status is NOT open', async () => {
    const mockDb = createMockDb({ caseStatus: 'RECOVERED' });
    const result = await policyEngine.checkPolicy(
      { caseId: 'case-test-1', actionType: 'send_retry_link', nowOverride: testDate },
      mockDb
    );

    expect(result.allowed).toBe(false);
    expect(result.ruleTriggered).toBe('case_status');
    expect(result.reason).toContain('Case status is');
  });

  it('Check 2: Blocks action when customer has opted out', async () => {
    const mockDb = createMockDb({ optedOut: true });
    const result = await policyEngine.checkPolicy(
      { caseId: 'case-test-1', actionType: 'send_retry_link', nowOverride: testDate },
      mockDb
    );

    expect(result.allowed).toBe(false);
    expect(result.ruleTriggered).toBe('opt_out');
    expect(result.reason).toContain('opted out');
  });

  it('Check 3: Blocks action when max attempts reached', async () => {
    const mockDb = createMockDb({ maxAttempts: 3, attemptCount: 3 });
    const result = await policyEngine.checkPolicy(
      { caseId: 'case-test-1', actionType: 'send_retry_link', nowOverride: testDate },
      mockDb
    );

    expect(result.allowed).toBe(false);
    expect(result.ruleTriggered).toBe('max_attempts');
    expect(result.reason).toContain('Maximum attempts (3) reached');
  });

  it('Check 3: Allows action when attempt count is below ceiling', async () => {
    const mockDb = createMockDb({ maxAttempts: 3, attemptCount: 2 });
    const result = await policyEngine.checkPolicy(
      { caseId: 'case-test-1', actionType: 'send_retry_link', nowOverride: testDate },
      mockDb
    );

    expect(result.allowed).toBe(true);
    expect(result.ruleTriggered).toBeUndefined();
  });

  it('Check 4: Blocks action when cool-down is active', async () => {
    const mockDb = createMockDb({ cooldownMinutes: 60, lastActionMinutesAgo: 20 });
    const result = await policyEngine.checkPolicy(
      { caseId: 'case-test-1', actionType: 'send_retry_link', nowOverride: testDate },
      mockDb
    );

    expect(result.allowed).toBe(false);
    expect(result.ruleTriggered).toBe('cooldown');
    expect(result.reason).toContain('Cool-down active');
  });

  it('Check 4: Allows action when cool-down window has elapsed', async () => {
    const mockDb = createMockDb({ cooldownMinutes: 60, lastActionMinutesAgo: 65 });
    const result = await policyEngine.checkPolicy(
      { caseId: 'case-test-1', actionType: 'send_retry_link', nowOverride: testDate },
      mockDb
    );

    expect(result.allowed).toBe(true);
  });

  it('Check 5: Blocks action outside permissible contact hours (e.g. 23:00 IST)', async () => {
    const mockDb = createMockDb({ contactHourStart: 9, contactHourEnd: 19 });
    const lateNightDate = new Date('2026-08-25T17:30:00.000Z'); // 23:00 IST

    const result = await policyEngine.checkPolicy(
      { caseId: 'case-test-1', actionType: 'send_retry_link', nowOverride: lateNightDate },
      mockDb
    );

    expect(result.allowed).toBe(false);
    expect(result.ruleTriggered).toBe('contact_hours');
    expect(result.reason).toContain('outside permissible contact window');
  });

  it('Check 6: Blocks incentive when proposed amount exceeds policy ceiling', async () => {
    const mockDb = createMockDb({ maxIncentiveAmount: 300 });
    const result = await policyEngine.checkPolicy(
      {
        caseId: 'case-test-1',
        actionType: 'apply_recovery_incentive',
        proposedIncentiveAmount: 500, // 500 > 300
        nowOverride: testDate,
      },
      mockDb
    );

    expect(result.allowed).toBe(false);
    expect(result.ruleTriggered).toBe('monetary_ceiling');
    expect(result.reason).toContain('exceeds policy ceiling');
  });

  it('Check 7: Blocks action when merchant daily cap is reached', async () => {
    const mockDb = createMockDb({ dailyActionsToday: 500, dailyCapGlobal: 500 });
    const result = await policyEngine.checkPolicy(
      { caseId: 'case-test-1', actionType: 'send_retry_link', nowOverride: testDate },
      mockDb
    );

    expect(result.allowed).toBe(false);
    expect(result.ruleTriggered).toBe('daily_cap');
    expect(result.reason).toContain('daily action cap');
  });

  it('Check All: Passes when all 7 policy checks are satisfied', async () => {
    const mockDb = createMockDb({
      caseStatus: 'OPEN',
      optedOut: false,
      attemptCount: 1,
      maxAttempts: 3,
      cooldownMinutes: 60,
      lastActionMinutesAgo: 90,
      dailyActionsToday: 40,
      dailyCapGlobal: 500,
    });

    const result = await policyEngine.checkPolicy(
      { caseId: 'case-test-1', actionType: 'send_retry_link', nowOverride: testDate },
      mockDb
    );

    expect(result.allowed).toBe(true);
    expect(result.ruleTriggered).toBeUndefined();
    expect(result.reason).toContain('All 7 policy gate checks passed');
  });
});
