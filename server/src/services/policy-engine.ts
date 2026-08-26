import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { BoundedActionType, PolicyCheckResult } from '../types';

export interface PolicyCheckInput {
  caseId: string;
  actionType: BoundedActionType;
  proposedIncentiveAmount?: number;
  nowOverride?: Date; // Enables exact deterministic boundary unit testing
}

/**
 * Returns current hour (0-23) in the merchant's specified IANA timezone (e.g. 'Asia/Kolkata')
 */
export function getHourInTimezone(date: Date, timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hourPart = parts.find((p) => p.type === 'hour');
    return hourPart ? parseInt(hourPart.value, 10) : date.getUTCHours();
  } catch {
    // Fallback if timezone string is invalid
    return date.getUTCHours();
  }
}

/**
 * Gets start of today (00:00:00.000) for a given date in UTC
 */
export function getStartOfToday(date: Date): Date {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export class PolicyEngine {
  /**
   * Deterministic Policy Gate enforcing all 7 compliance checks.
   * Zero LLM authority — 100% deterministic code.
   */
  async checkPolicy(
    input: PolicyCheckInput,
    tx?: Prisma.TransactionClient
  ): Promise<PolicyCheckResult> {
    const client = (tx || prisma) as any;
    const now = input.nowOverride || new Date();

    // 1. Fetch case with customer & merchant details
    const recoveryCase = await client.recoveryCase.findUnique({
      where: { id: input.caseId },
      include: {
        customer: true,
        merchant: true,
      },
    });

    if (!recoveryCase) {
      return {
        allowed: false,
        reason: `Recovery case ${input.caseId} not found`,
        ruleTriggered: 'case_status',
      };
    }

    // Check 1: Case status must be OPEN
    if (recoveryCase.status !== 'OPEN') {
      return {
        allowed: false,
        reason: `Case status is '${recoveryCase.status}'. Actions only allowed on 'OPEN' cases.`,
        ruleTriggered: 'case_status',
      };
    }

    // Check 2: Customer Opt-Out Check
    if (recoveryCase.customer.optedOut) {
      return {
        allowed: false,
        reason: 'Customer has explicitly opted out of communications.',
        ruleTriggered: 'opt_out',
      };
    }

    // 2. Fetch policy configuration for merchant & lane
    let config = await client.policyConfig.findUnique({
      where: {
        merchantId_lane: {
          merchantId: recoveryCase.merchantId,
          lane: recoveryCase.lane,
        },
      },
    });

    // Fallback safe defaults if not explicitly seeded
    if (!config) {
      config = {
        maxAttempts: 3,
        cooldownMinutes: 60,
        contactHourStart: recoveryCase.merchant?.contactHourStart ?? 9,
        contactHourEnd: recoveryCase.merchant?.contactHourEnd ?? 19,
        maxIncentiveAmount: 500,
        dailyCapGlobal: 500,
      };
    }

    // Check 3: Attempt Count Check (action-specific or case-wide)
    const attemptCount = await client.recoveryAction.count({
      where: {
        caseId: input.caseId,
        actionType: input.actionType,
      },
    });

    if (attemptCount >= config.maxAttempts) {
      return {
        allowed: false,
        reason: `Maximum attempts (${config.maxAttempts}) reached for action '${input.actionType}'. Current count: ${attemptCount}.`,
        ruleTriggered: 'max_attempts',
      };
    }

    // Check 4: Cool-down Window Check
    const lastAction = await client.recoveryAction.findFirst({
      where: { caseId: input.caseId },
      orderBy: { createdAt: 'desc' },
    });

    if (lastAction) {
      const minutesSinceLastAction = (now.getTime() - new Date(lastAction.createdAt).getTime()) / (1000 * 60);
      if (minutesSinceLastAction < config.cooldownMinutes) {
        const remainingMinutes = Math.ceil(config.cooldownMinutes - minutesSinceLastAction);
        return {
          allowed: false,
          reason: `Cool-down active. ${remainingMinutes} minute(s) remaining before next touch.`,
          ruleTriggered: 'cooldown',
        };
      }
    }

    // Check 5: Contact Hours Check (Merchant / Customer Timezone)
    const timezone = recoveryCase.merchant?.timezone || 'Asia/Kolkata';
    const contactHourStart = config.contactHourStart ?? recoveryCase.merchant?.contactHourStart ?? 9;
    const contactHourEnd = config.contactHourEnd ?? recoveryCase.merchant?.contactHourEnd ?? 19;
    const currentHour = getHourInTimezone(now, timezone);

    if (currentHour < contactHourStart || currentHour >= contactHourEnd) {
      return {
        allowed: false,
        reason: `Current time (${currentHour}:00 in ${timezone}) is outside permissible contact window (${contactHourStart}:00 - ${contactHourEnd}:00).`,
        ruleTriggered: 'contact_hours',
      };
    }

    // Check 6: Monetary Ceiling Check (for incentives/discounts)
    if (
      input.actionType === 'apply_recovery_incentive' &&
      input.proposedIncentiveAmount !== undefined
    ) {
      const maxIncentive = Number(config.maxIncentiveAmount);
      if (input.proposedIncentiveAmount > maxIncentive) {
        return {
          allowed: false,
          reason: `Proposed incentive ₹${input.proposedIncentiveAmount} exceeds policy ceiling ₹${maxIncentive}.`,
          ruleTriggered: 'monetary_ceiling',
        };
      }
    }

    // Check 7: Global Daily Cap Check
    const startOfToday = getStartOfToday(now);
    const dailyActionsCount = await client.recoveryAction.count({
      where: {
        case: { merchantId: recoveryCase.merchantId },
        createdAt: { gte: startOfToday },
      },
    });

    if (dailyActionsCount >= config.dailyCapGlobal) {
      return {
        allowed: false,
        reason: `Merchant global daily action cap (${config.dailyCapGlobal}) reached for today.`,
        ruleTriggered: 'daily_cap',
      };
    }

    return {
      allowed: true,
      reason: 'All 7 policy gate checks passed successfully.',
    };
  }
}

export const policyEngine = new PolicyEngine();
