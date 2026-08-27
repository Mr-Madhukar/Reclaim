import { describe, it, expect, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { AuditService } from '../src/services/audit.service';

describe('AuditService — Immutability & Event Logging', () => {
  it('Logs audit entries with actor, entity, event type, and JSON state diffs', async () => {
    const mockTx = {
      auditLog: {
        create: vi.fn().mockImplementation(async ({ data }) => ({
          id: 'audit-entry-1',
          createdAt: new Date(),
          ...data,
        })),
      },
    } as unknown as Prisma.TransactionClient;

    const auditService = new AuditService();

    const entry = await auditService.log(
      {
        actor: 'agent',
        entityType: 'RecoveryCase',
        entityId: 'case-123',
        eventType: 'policy_blocked',
        beforeJson: { status: 'OPEN' },
        afterJson: { status: 'STOPPED_OPTED_OUT' },
        reason: 'Customer has explicitly opted out.',
      },
      mockTx
    );

    expect(mockTx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actor: 'agent',
        entityType: 'RecoveryCase',
        entityId: 'case-123',
        eventType: 'policy_blocked',
        reason: 'Customer has explicitly opted out.',
      }),
    });

    expect(entry.id).toBe('audit-entry-1');
  });
});
