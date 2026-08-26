import { caseService } from '../services/case.service';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

async function run() {
  console.log('🚀 Initiating Reclaim Autonomous Revenue Recovery Batch Run...\n');

  const startTime = Date.now();
  const { processedCount, results } = await caseService.runBatch();

  const successCount = results.filter((r) => r.status === 'RECOVERED').length;
  const blockedCount = results.filter((r) => r.outcome === 'blocked').length;
  const escalatedCount = results.filter((r) => r.status === 'ESCALATED_TO_HUMAN').length;

  const metrics = await caseService.getMetrics();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RECLAIM BATCH EXECUTION RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total Cases Processed:   ${processedCount}`);
  console.log(`Successfully Recovered:  ${successCount}`);
  console.log(`Compliance-Blocked:      ${blockedCount} (Stopping Rules Enforced)`);
  console.log(`Escalated to Human:      ${escalatedCount}`);
  console.log(`Execution Time:          ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💰 FINANCIAL RECOVERY SUMMARY (LIVE DB)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`₹ Total at Risk:         ₹${metrics.totalAtRisk.toLocaleString('en-IN')}`);
  console.log(`₹ Total Recovered:       ₹${metrics.totalRecovered.toLocaleString('en-IN')}`);
  console.log(`₹ Net Recovered:         ₹${metrics.netRecovered.toLocaleString('en-IN')}`);
  console.log(`Recovery Rate:           ${metrics.recoveryRatePercent}%`);
  console.log(`Stopping Rule Triggers:  ${metrics.stoppingRuleTriggersCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await prisma.$disconnect();
}

run().catch((err) => {
  logger.error({ err: err.message }, 'Batch run failed');
  process.exit(1);
});
