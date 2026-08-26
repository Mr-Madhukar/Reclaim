import type { RecoveryAction } from '@prisma/client';
import { prisma } from '../lib/prisma';

async function evaluate() {
  console.log('🔬 Running Reclaim Evaluation Harness on Synthetic Held-Out Dataset...\n');

  const cases = await prisma.recoveryCase.findMany({
    include: {
      actions: true,
      customer: true,
    },
  });

  let shouldRecoverCount = 0;
  let shouldNotRecoverCount = 0;

  let truePositives = 0; // shouldRecover === true && status === 'RECOVERED'
  let falsePositives = 0; // shouldRecover === false && status === 'RECOVERED'
  let trueNegatives = 0; // shouldRecover === false && (status !== 'RECOVERED' || stopped/escalated)
  let falseNegatives = 0; // shouldRecover === true && status !== 'RECOVERED'

  let wastedIncentiveCount = 0;
  let totalIncentivesApplied = 0;

  for (const c of cases) {
    if (c.shouldRecover) {
      shouldRecoverCount++;
      if (c.status === 'RECOVERED') {
        truePositives++;
      } else {
        falseNegatives++;
      }
    } else {
      shouldNotRecoverCount++;
      if (c.status === 'RECOVERED') {
        falsePositives++;
      } else {
        trueNegatives++;
      }
    }

    const hasIncentive = c.actions.some((a: RecoveryAction) => a.actionType === 'apply_recovery_incentive');
    if (hasIncentive) {
      totalIncentivesApplied++;
      if (!c.shouldRecover) {
        wastedIncentiveCount++;
      }
    }
  }

  const recall = shouldRecoverCount > 0 ? (truePositives / shouldRecoverCount) * 100 : 0;
  const precision = truePositives + falsePositives > 0 ? (truePositives / (truePositives + falsePositives)) * 100 : 0;
  const correctHoldRate = shouldNotRecoverCount > 0 ? (trueNegatives / shouldNotRecoverCount) * 100 : 0;
  const wastedIncentiveRate = totalIncentivesApplied > 0 ? (wastedIncentiveCount / totalIncentivesApplied) * 100 : 0;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 AUTONOMOUS AGENT EVALUATION BENCHMARK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total Evaluated Cases:     ${cases.length}`);
  console.log(`Recoverable Cases (GT):    ${shouldRecoverCount}`);
  console.log(`Unrecoverable Cases (GT):  ${shouldNotRecoverCount}`);
  console.log(`Missed Recoveries (FN):    ${falseNegatives}`);
  console.log('----------------------------------------------------');
  console.log(`🎯 Recall (Recovery %):     ${recall.toFixed(1)}%`);
  console.log(`🎯 Precision:              ${precision.toFixed(1)}%`);
  console.log(`🛡️ Correct Hold Rate:       ${correctHoldRate.toFixed(1)}%`);
  console.log(`💸 Wasted Incentive Rate:  ${wastedIncentiveRate.toFixed(1)}%`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await prisma.$disconnect();
}

evaluate().catch((err) => {
  console.error('Evaluation failed:', err);
  process.exit(1);
});
