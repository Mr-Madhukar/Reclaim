import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export type AuditActor = 'agent' | 'system' | `human:${string}` | `customer:${string}`;
export type AuditEntityType = 'RecoveryCase' | 'RecoveryAction' | 'PolicyConfig' | 'Webhook' | 'Customer';
export type AuditEventType =
  | 'case_created'
  | 'root_cause_diagnosed'
  | 'policy_passed'
  | 'policy_blocked'
  | 'action_executed'
  | 'case_recovered'
  | 'case_escalated'
  | 'case_closed'
  | 'policy_config_updated'
  | 'customer_opted_out'
  | 'promise_to_pay_logged'
  | 'promise_to_pay_resolved';

export interface CreateAuditEntryInput {
  actor: AuditActor;
  entityType: AuditEntityType;
  entityId: string;
  eventType: AuditEventType;
  beforeJson?: Prisma.InputJsonValue | Record<string, unknown>;
  afterJson?: Prisma.InputJsonValue | Record<string, unknown>;
  reason: string;
}

export class AuditService {
  /**
   * Append an immutable audit entry to the audit log.
   * Can accept a Prisma transaction client to ensure atomic state transitions.
   */
  async log(
    input: CreateAuditEntryInput,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || prisma;

    try {
      const entry = await client.auditLog.create({
        data: {
          actor: input.actor,
          entityType: input.entityType,
          entityId: input.entityId,
          eventType: input.eventType,
          beforeJson: input.beforeJson ? (input.beforeJson as Prisma.InputJsonValue) : Prisma.JsonNull,
          afterJson: input.afterJson ? (input.afterJson as Prisma.InputJsonValue) : Prisma.JsonNull,
          reason: input.reason,
        },
      });

      logger.info(
        {
          auditId: entry.id,
          entityType: input.entityType,
          entityId: input.entityId,
          eventType: input.eventType,
          actor: input.actor,
        },
        `[Audit Log] ${input.eventType}: ${input.reason}`
      );

      return entry;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err: message, input }, 'Failed to write audit log entry');
      throw err;
    }
  }

  /**
   * Query audit logs with pagination and filters
   */
  async getAuditLogs(params: {
    entityId?: string;
    entityType?: string;
    eventType?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};
    if (params.entityId) where.entityId = params.entityId;
    if (params.entityType) where.entityType = params.entityType;
    if (params.eventType) where.eventType = params.eventType;

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const auditService = new AuditService();
