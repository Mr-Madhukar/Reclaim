import { caseService } from '../services/case.service';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { getHourInTimezone } from '../services/policy-engine';

async function run() {
  console.log('🚀 Initiating Reclaim Autonomous Revenue Recovery Batch Run...\n');

  const now = new Date();
  const currentHourIST = getHourInTimezone(now, 'Asia/Kolkata');
  const isOffHours = currentHourIST < 9 || currentHourIST >= 19;
  const isStrictClock = process.argv.includes('--strict-clock');

  let nowOverride: Date | undefined;
  if (isOffHours && !isStrictClock) {
    console.log(`ℹ️ Current local time (${currentHourIST}:00 in Asia/Kolkata) is outside permissible contact window (9:00 - 19:00).`);
    console.log('ℹ️ Simulating standard daytime business hours (14:00 IST) for synthetic batch benchmark...\n');
    const simDate = new Date();
    simDate.setHours(14, 0, 0, 0);
    nowOverride = simDate;
  }

  const startTime = Date.now();
  const { processedCount, results } = await caseService.runBatch(undefined, { nowOverride });

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
