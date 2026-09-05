import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.use({
  video: {
    mode: 'on',
    size: { width: 1366, height: 768 },
  },
  viewport: { width: 1366, height: 768 },
});

test('Record Full Feature Walkthrough Video of Reclaim AI Revenue Recovery', async ({ page }) => {
  test.setTimeout(180000); // 3 minutes for comprehensive video

  // Helper for human-like smooth pacing in video recording (avoids framework fixed wait)
  const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  console.log('🎥 [Video Recording] Step 1: Loading Showcase Landing Page...');
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/Reclaim/i);
  await expect(page.getByText('RECLAIM', { exact: false }).first()).toBeVisible();
  await pause(2000);

  // 1. Showcase & Hero Section Walkthrough
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await pause(1200);

  // Switch Telemetry tabs on landing page
  const policyTabBtn = page.getByRole('button', { name: /Policy Gates/i }).first();
  if (await policyTabBtn.isVisible()) {
    console.log('🛡️ [Video Recording] Switching Telemetry console to Policy Gates tab...');
    await policyTabBtn.click();
    await pause(1500);
    const liveStreamBtn = page.getByRole('button', { name: /Live Stream/i }).first();
    if (await liveStreamBtn.isVisible()) {
      await liveStreamBtn.click();
      await pause(1200);
    }
  }

  await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'smooth' }));
  await pause(1200);
  await page.evaluate(() => window.scrollBy({ top: 600, behavior: 'smooth' }));
  await pause(1200);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await pause(1000);

  // 2. Dashboard & Command Center
  console.log('📊 [Video Recording] Step 2: Navigating to Dashboard Command Center...');
  const launchDashboardBtn = page.getByRole('button', { name: /Launch Command Center/i }).first();
  if (await launchDashboardBtn.isVisible()) {
    await launchDashboardBtn.click();
    await pause(1000);
  } else {
    const dashBtn = page.getByRole('button', { name: /^Dashboard$/i }).first();
    if (await dashBtn.isVisible()) {
      await dashBtn.click();
      await pause(1000);
    }
  }

  // If login page is displayed, log in as Admin
  const adminLoginBtn = page.getByRole('button', { name: /Admin/i }).first();
  if (await adminLoginBtn.isVisible()) {
    console.log('🔐 [Video Recording] Authenticating as ADMIN...');
    await adminLoginBtn.click();
    await pause(2000);
  }

  // Trigger Autonomous Agent Batch Run
  const runBatchBtn = page.getByRole('button', { name: /Run Recovery Batch/i }).first();
  if (await runBatchBtn.isVisible()) {
    console.log('⚡ [Video Recording] Triggering Autonomous Agent Batch Processing...');
    await runBatchBtn.click();
    // Wait for batch complete banner
    try {
      await page.locator('text=Batch Complete').first().waitFor({ state: 'visible', timeout: 15000 });
      console.log('✅ [Video Recording] Batch processing completed with live statistics!');
    } catch {
      // fallback pause
    }
    await pause(3500); // Let viewer view the batch recovery metrics & counts
  }

  // Scroll through Dashboard KPIs and Charts
  await page.evaluate(() => window.scrollBy({ top: 450, behavior: 'smooth' }));
  await pause(1500);
  await page.evaluate(() => window.scrollBy({ top: 450, behavior: 'smooth' }));
  await pause(1500);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await pause(1000);

  // 3. Sandbox — Webhook Simulator
  console.log('🧪 [Video Recording] Step 3: Navigating to Sandbox & Webhook Simulator...');
  await page.getByRole('button', { name: /Sandbox/i }).first().click();
  await pause(1500);

  // Click Webhook Simulator tab
  const webhookTab = page.getByRole('button', { name: /Webhook Simulator/i }).first();
  if (await webhookTab.isVisible()) {
    await webhookTab.click();
    await pause(1000);
  }

  // Select failure preset (e.g. Card Expired)
  const failureSelect = page.locator('select').nth(1);
  if (await failureSelect.isVisible()) {
    await failureSelect.selectOption('CARD_EXPIRED');
    await pause(800);
  }

  // Dispatch Webhook
  const dispatchBtn = page.locator('button[type="submit"]').filter({ hasText: /Dispatch Signed/i }).first();
  await dispatchBtn.waitFor({ state: 'visible', timeout: 5000 });
  console.log('📡 [Video Recording] Dispatching Signed Razorpay Webhook Payload...');
  await dispatchBtn.click();
  try {
    await page.locator('text=SIGNATURE VERIFIED').first().waitFor({ state: 'visible', timeout: 8000 });
  } catch {
    // fallback
  }
  await pause(3000); // Show HMAC SHA-256 signature and signed response payload

  // 4. Sandbox — Customer Recovery Portal (AI Voice Call + Razorpay Payment)
  console.log('📱 [Video Recording] Step 4: Testing End-Customer Portal & AI Voice Agent...');
  const customerTab = page.getByRole('button', { name: /Customer Portal Mock/i }).first();
  await customerTab.waitFor({ state: 'visible', timeout: 5000 });
  await customerTab.click();
  await pause(2000);

  // Switch Language to Hinglish
  const hinglishBtn = page.getByRole('button', { name: /Hinglish/i }).first();
  if (await hinglishBtn.isVisible()) {
    console.log('🌐 [Video Recording] Switching Recovery Copy Language to Hinglish...');
    await hinglishBtn.click();
    await pause(1500);
  }

  // Start AI Voice Agent Call simulation
  const voiceCallBtn = page.getByRole('button', { name: /AI Voice Call/i }).first();
  if (await voiceCallBtn.isVisible()) {
    console.log('📞 [Video Recording] Simulating Outbound AI Voice Agent Call with audio waveforms...');
    await voiceCallBtn.click();
    await pause(4500); // Watch active call animation & speech transcript

    const endCallBtn = page.locator('button').filter({ has: page.locator('svg.lucide-phone-off') }).first();
    if (await endCallBtn.isVisible()) {
      await endCallBtn.click();
      await pause(1000);
    }
  }

  // Simulate Pay via Razorpay Direct Modal
  const payBtn = page.getByRole('button', { name: /Pay ₹.*via Razorpay|Instant UPI/i }).first();
  if (await payBtn.isVisible()) {
    console.log('💳 [Video Recording] Opening Razorpay 256-bit Secure Payment Modal...');
    await payBtn.click();
    await pause(1500);

    // Click UPI Google Pay button in modal
    const gpayBtn = page.getByRole('button', { name: /Google Pay/i }).first();
    if (await gpayBtn.isVisible()) {
      console.log('📱 [Video Recording] Simulating Instant UPI (Google Pay) One-Click Capture...');
      await gpayBtn.click();
      try {
        await page.locator('text=Payment Captured Successfully!').first().waitFor({ state: 'visible', timeout: 8000 });
      } catch {
        // fallback
      }
      await pause(3000); // Wait for verification & green success receipt screen
    }

    // Close modal / Done
    const doneBtn = page.getByRole('button', { name: /Done & Return|Done|Close/i }).first();
    if (await doneBtn.isVisible()) {
      await doneBtn.click();
      await pause(1200);
    }
  }

  // Test Promise-to-Pay Commitment Option
  const promiseBtn = page.getByRole('button', { name: /Submit Promise/i }).first();
  if (await promiseBtn.isVisible()) {
    console.log('📅 [Video Recording] Submitting Customer Promise-to-Pay Date Commitment...');
    await promiseBtn.click();
    await pause(2500);
  }

  // 5. Workbench — Case Explorer & Detail Drawer
  console.log('📁 [Video Recording] Step 5: Navigating to Cases Workbench...');
  await page.getByRole('button', { name: /Workbench/i }).first().click();
  await pause(2000);

  // Filter by Lane using select dropdown
  const laneSelect = page.locator('select[aria-label*="recovery lane"]').first();
  if (await laneSelect.isVisible()) {
    console.log('🎯 [Video Recording] Filtering Cases by Payment Degradation Lane...');
    await laneSelect.selectOption('PAYMENT');
    await pause(1500);
    await laneSelect.selectOption('ALL');
    await pause(1500);
  }

  // Search input demonstration
  const searchInput = page.locator('input#case-search').first();
  if (await searchInput.isVisible()) {
    console.log('🔍 [Video Recording] Searching Cases in Workbench...');
    await searchInput.fill('Priya');
    await pause(1500);
    await searchInput.fill('');
    await pause(1500);
  }

  // Click on the first case row to open inspection drawer
  const firstRow = page.locator('tbody tr').first();
  await firstRow.waitFor({ state: 'visible', timeout: 15000 });
  console.log('🔍 [Video Recording] Opening Case Inspection Drawer...');
  await firstRow.click();
  await pause(2500);

  // Trigger Bounded Action
  const triggerBtn = page.getByRole('button', { name: /Trigger Next Bounded Action/i }).first();
  if (await triggerBtn.isVisible() && await triggerBtn.isEnabled()) {
    console.log('⚡ [Video Recording] Dispatching Next Bounded Recovery Action...');
    await triggerBtn.click();
    await pause(2500);
  }

  // Scroll down drawer to view timeline and audit history
  const drawerContainer = page.locator('.fixed.inset-0 div[class*="overflow-y-auto"]').first();
  if (await drawerContainer.isVisible()) {
    await drawerContainer.evaluate((el) => el.scrollBy({ top: 350, behavior: 'smooth' }));
    await pause(2000);
  }

  // Close drawer
  const closeDrawerBtn = page.locator('.fixed.inset-0 button').filter({ has: page.locator('svg.lucide-x') }).first();
  if (await closeDrawerBtn.isVisible()) {
    await closeDrawerBtn.click();
    await pause(1200);
  }

  // 6. Policy Configurations
  console.log('⚙️ [Video Recording] Step 6: Navigating to Policy Configurations...');
  await page.getByRole('button', { name: /Policies/i }).first().click();
  await pause(2000);

  // Save Policy
  const savePolicyBtn = page.getByRole('button', { name: /Save.*Guardrails/i }).first();
  if (await savePolicyBtn.isVisible()) {
    console.log('💾 [Video Recording] Saving Policy Guardrails Configuration...');
    await savePolicyBtn.click();
    await pause(2500); // Let viewer view the green success toast
  }

  // 7. Audit Trail & State Proofs
  console.log('📜 [Video Recording] Step 7: Navigating to Audit Trail...');
  await page.getByRole('button', { name: /Audit/i }).first().click();
  await pause(2000);

  // Inspect first audit log JSON diff
  const viewDiffBtn = page.getByRole('button', { name: /View Diff/i }).first();
  if (await viewDiffBtn.isVisible()) {
    console.log('🔎 [Video Recording] Inspecting Immutable JSON State Diff in Audit Trail...');
    await viewDiffBtn.click();
    await pause(3000); // Allow viewer to inspect full JSON state diff

    // Close diff modal
    const closeDiffBtn = page.locator('.fixed.inset-0 button').filter({ has: page.locator('svg.lucide-x') }).first();
    if (await closeDiffBtn.isVisible()) {
      await closeDiffBtn.click();
      await pause(1500);
    }
  }

  // 8. Evaluator Scorecard
  console.log('🏆 [Video Recording] Step 8: Navigating to Evaluator Scorecard...');
  await page.getByRole('button', { name: /Scorecard/i }).first().click();
  await pause(2000);

  // Run Batch Benchmark
  const runEvalBtn = page.getByRole('button', { name: /Run Batch Benchmark/i }).first();
  if (await runEvalBtn.isVisible()) {
    console.log('🚀 [Video Recording] Running Benchmark Evaluation Batch...');
    await runEvalBtn.click();
    await pause(4000);
  }

  // Open Export Markdown Scorecard Modal
  const exportBtn = page.getByRole('button', { name: /Export Markdown Scorecard/i }).first();
  if (await exportBtn.isVisible()) {
    console.log('📄 [Video Recording] Viewing Exportable Hackathon Markdown Scorecard...');
    await exportBtn.click();
    await pause(3000);

    const closeExportBtn = page.locator('.fixed.inset-0 button').filter({ has: page.locator('svg.lucide-x') }).first();
    if (await closeExportBtn.isVisible()) {
      await closeExportBtn.click();
      await pause(1200);
    }
  }

  // Final Overview Scroll
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await pause(1500);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await pause(2000);

  console.log('✅ [Video Recording] Full feature walkthrough video completed successfully!');
  await expect(page.locator('body')).toBeVisible();
  expect(page.video()).not.toBeNull();
});

test.afterEach(async ({ page }) => {
  const video = page.video();
  if (video) {
    const videoPath = await video.path();
    const recordingsDir = path.resolve(process.cwd(), 'recordings');
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
    }
    const targetPath = path.join(recordingsDir, 'reclaim_full_walkthrough.webm');
    fs.copyFileSync(videoPath, targetPath);
    expect(fs.existsSync(targetPath)).toBe(true);
    console.log(`🎬 [Video Saved] Walkthrough video successfully saved to: ${targetPath}`);
  }
});
