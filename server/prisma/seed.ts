import crypto from 'node:crypto';
import { PrismaClient, Role, Lane, CaseStatus, PaymentStatus, CheckoutStatus, InvoiceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Reclaim demo database on Neon PostgreSQL...');

  // Clean existing tables (Idempotent seed)
  await prisma.auditLog.deleteMany();
  await prisma.accessLog.deleteMany();
  await prisma.recoveryAction.deleteMany();
  await prisma.promiseToPay.deleteMany();
  await prisma.recoveryCase.deleteMany();
  await prisma.paymentAttempt.deleteMany();
  await prisma.checkoutSession.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.policyConfig.deleteMany();
  await prisma.user.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.merchant.deleteMany();

  // 1. Create Demo Merchant
  const merchant = await prisma.merchant.create({
    data: {
      name: 'Reclaim Demo Merchant Store',
      timezone: 'Asia/Kolkata',
      contactHourStart: 9,
      contactHourEnd: 19,
    },
  });

  console.log(`✅ Created Merchant: ${merchant.name} (${merchant.id})`);

  // 2. Create RBAC Users
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
  const demoPasswordHash = await bcrypt.hash('Demo@12345', 10);

  await prisma.user.createMany({
    data: [
      {
        email: 'admin@reclaim.local',
        name: 'Admin User',
        passwordHash: adminPasswordHash,
        role: Role.ADMIN,
        merchantId: merchant.id,
      },
      {
        email: 'admin@reclaim.demo',
        name: 'Admin User',
        passwordHash: demoPasswordHash,
        role: Role.ADMIN,
        merchantId: merchant.id,
      },
      {
        email: 'ops@reclaim.local',
        name: 'Operations Viewer',
        passwordHash: adminPasswordHash,
        role: Role.OPS_VIEWER,
        merchantId: merchant.id,
      },
      {
        email: 'ops@reclaim.demo',
        name: 'Operations Viewer',
        passwordHash: demoPasswordHash,
        role: Role.OPS_VIEWER,
        merchantId: merchant.id,
      },
      {
        email: 'reviewer@reclaim.local',
        name: 'Human Reviewer',
        passwordHash: adminPasswordHash,
        role: Role.REVIEWER,
        merchantId: merchant.id,
      },
      {
        email: 'reviewer@reclaim.demo',
        name: 'Human Reviewer',
        passwordHash: demoPasswordHash,
        role: Role.REVIEWER,
        merchantId: merchant.id,
      },
    ],
  });

  console.log('✅ Created Demo and Local Users (Admin, Ops, Reviewer)');

  // 3. Create Default Policy Configurations for all 3 lanes
  await prisma.policyConfig.createMany({
    data: [
      {
        merchantId: merchant.id,
        lane: Lane.PAYMENT,
        maxAttempts: 3,
        cooldownMinutes: 60,
        contactHourStart: 9,
        contactHourEnd: 19,
        maxIncentiveAmount: 500,
        dailyCapGlobal: 500,
      },
      {
        merchantId: merchant.id,
        lane: Lane.CHECKOUT,
        maxAttempts: 3,
        cooldownMinutes: 120,
        contactHourStart: 9,
        contactHourEnd: 19,
        maxIncentiveAmount: 500,
        dailyCapGlobal: 500,
      },
      {
        merchantId: merchant.id,
        lane: Lane.RECEIVABLE,
        maxAttempts: 4,
        cooldownMinutes: 1440, // 24 hours
        contactHourStart: 9,
        contactHourEnd: 19,
        maxIncentiveAmount: 1000,
        dailyCapGlobal: 500,
      },
    ],
  });

  console.log('✅ Created Policy Configs for PAYMENT, CHECKOUT, RECEIVABLE');

  // 4. Create 60 Synthetic Customers
  const customerNames = [
    'Aarav Sharma', 'Priya Patel', 'Rohan Gupta', 'Neha Verma', 'Vikram Singh',
    'Ananya Iyer', 'Aditya Joshi', 'Kavita Nair', 'Rahul Mehta', 'Pooja Reddy',
    'Siddharth Malhotra', 'Riya Sen', 'Amitabh Roy', 'Deepika Rao', 'Varun Kapoor',
    'Ishaan Saxena', 'Sanya Bhatia', 'Kunal Deshmukh', 'Tanvi Chawla', 'Gaurav Kulkarni',
    'Meera Nambiar', 'Arjun Pillai', 'Bhavna Menon', 'Harsh Singhal', 'Divya Jain',
    'Karan Bajaj', 'Shreya Aggarwal', 'Manish Tiwari', 'Swati Das', 'Rajat Bose',
    'Tarun Mathur', 'Pavitra Sundaram', 'Nikhil Goel', 'Geeta Bhatt', 'Ashok Kumar',
    'Simran Kohli', 'Mohit Bansal', 'Zoya Khan', 'Kabir Bedi', 'Sunita Sethi',
    'Devendra Yadav', 'Pallavi Sen', 'Alok Pandey', 'Archana Roy', 'Chirag Parekh',
    'Sonali Kadam', 'Sameer Ali', 'Jyoti Mishra', 'Abhishek Dubey', 'Rani Mukherjee',
    'Pranav Hegde', 'Kalyani Pai', 'Vinay Nayak', 'Lata Shenoy', 'Girish Kamath',
    'Preeti Merchant', 'Tushar Shroff', 'Ankita Dalal', 'Rajesh Vora', 'Hema Zaveri'
  ];

  const customers = [];
  for (let i = 0; i < customerNames.length; i++) {
    const name = customerNames[i];
    const emailName = name.toLowerCase().replace(/\s+/g, '.');
    const optedOut = i === 5 || i === 23; // Intentionally seed opt-out customers for stopping-rule tests

    const customer = await prisma.customer.create({
      data: {
        merchantId: merchant.id,
        name,
        email: `${emailName}@example.com`,
        phone: `+9198${crypto.randomInt(10000000, 100000000)}`,
        optedOut,
      },
    });
    customers.push(customer);
  }

  console.log(`✅ Seeded ${customers.length} Customers`);

  // 5. Seed 55+ Cases across all 3 lanes with ground-truth tags

  const failureCodes = [
    { code: 'PAYMENT_FAILED_INSUFFICIENT_FUNDS', reason: 'Insufficient funds in bank account', cause: 'insufficient_funds', shouldRecover: true },
    { code: 'GATEWAY_ERROR', reason: 'Acquiring bank timeout during 3DS', cause: 'bank_timeout', shouldRecover: true },
    { code: 'CARD_EXPIRED', reason: 'Card expiration date has elapsed', cause: 'card_expired', shouldRecover: true },
    { code: 'OTP_EXPIRED', reason: 'Two-factor OTP timed out', cause: 'otp_failure', shouldRecover: true },
    { code: 'MANDATE_EXPIRED', reason: 'Subscription e-mandate invalid', cause: 'mandate_expired', shouldRecover: true },
    { code: 'RISK_DECLINE', reason: 'Declined by anti-fraud heuristics', cause: 'risk_decline', shouldRecover: false },
    { code: 'NETWORK_ERROR', reason: 'Connection reset by peer', cause: 'network_error', shouldRecover: true },
  ];

  let caseCount = 0;

  // 5.1 Lane A: PAYMENT Cases (~25 cases)
  for (let i = 0; i < 25; i++) {
    const cust = customers[i];
    const failInfo = failureCodes[i % failureCodes.length];
    const amount = crypto.randomInt(500, 10000);

    const paymentAttempt = await prisma.paymentAttempt.create({
      data: {
        customerId: cust.id,
        orderId: `order_pay_${1000 + i}`,
        amount,
        currency: 'INR',
        status: PaymentStatus.FAILED,
        failureCode: failInfo.code,
        failureReasonRaw: failInfo.reason,
        paymentMethod: i % 2 === 0 ? 'card' : 'upi',
        isMandate: failInfo.cause === 'mandate_expired',
        mandateId: failInfo.cause === 'mandate_expired' ? `mandate_${1000 + i}` : null,
      },
    });

    // Distribute statuses across cases for realistic demo
    let status: CaseStatus = CaseStatus.OPEN;
    let closedAt: Date | null = null;
    let closedReason: string | null = null;

    if (cust.optedOut) {
      status = CaseStatus.STOPPED_OPTED_OUT;
      closedAt = new Date();
      closedReason = 'Customer opted out of recovery communications';
    } else if (i % 4 === 0) {
      status = CaseStatus.RECOVERED;
      closedAt = new Date();
      closedReason = 'Payment recovered via 1-Click UPI Intent link';
    } else if (i % 7 === 0) {
      status = CaseStatus.ESCALATED_TO_HUMAN;
      closedReason = 'High value transaction flagged for manual review';
    }

    const recoveryCase = await prisma.recoveryCase.create({
      data: {
        merchantId: merchant.id,
        customerId: cust.id,
        lane: Lane.PAYMENT,
        sourceRefId: paymentAttempt.id,
        rootCause: failInfo.cause,
        status,
        amount,
        closedAt,
        closedReason,
        shouldRecover: cust.optedOut ? false : failInfo.shouldRecover,
      },
    });

    // Create realistic actions & audit logs
    if (status === CaseStatus.RECOVERED) {
      await prisma.recoveryAction.create({
        data: {
          caseId: recoveryCase.id,
          actionType: 'send_payment_link',
          channel: 'whatsapp',
          payloadJson: { upiIntent: `upi://pay?pa=reclaim@razorpay&am=${amount}`, template: 'upi_retry_prompt' },
          decisionReason: 'Autonomous policy gate passed. Customer engaged via WhatsApp UPI intent.',
          modelUsed: 'gemini-2.0-flash',
          attemptNumber: 1,
          outcome: 'confirmed',
        },
      });

      await prisma.auditLog.create({
        data: {
          actor: 'agent',
          entityType: 'RecoveryCase',
          entityId: recoveryCase.id,
          eventType: 'case_recovered',
          reason: `Auto-recovered ₹${amount} via WhatsApp UPI Intent link`,
        },
      });
    } else if (status === CaseStatus.STOPPED_OPTED_OUT) {
      await prisma.recoveryAction.create({
        data: {
          caseId: recoveryCase.id,
          actionType: 'policy_check',
          channel: null,
          payloadJson: { stoppedRule: 'OPTED_OUT' },
          decisionReason: 'Stopping Rule triggered: Customer has opted out of communication.',
          modelUsed: 'rules',
          attemptNumber: 1,
          outcome: 'blocked',
        },
      });

      await prisma.auditLog.create({
        data: {
          actor: 'system',
          entityType: 'RecoveryCase',
          entityId: recoveryCase.id,
          eventType: 'policy_blocked',
          reason: 'Deterministic Policy Gate blocked outreach: DPDP Act Opt-Out flag active',
        },
      });
    } else if (status === CaseStatus.ESCALATED_TO_HUMAN) {
      await prisma.auditLog.create({
        data: {
          actor: 'agent',
          entityType: 'RecoveryCase',
          entityId: recoveryCase.id,
          eventType: 'case_escalated',
          reason: 'Tier 1 Policy Engine routed case to Human-in-the-Loop review queue',
        },
      });
    }

    caseCount++;
  }

  // 5.2 Lane B: CHECKOUT Drop-off Cases (~15 cases)
  for (let i = 25; i < 40; i++) {
    const cust = customers[i];
    const cartValue = crypto.randomInt(1200, 16200);
    const hoursAgo = crypto.randomInt(1, 49);
    const abandonedAt = new Date(Date.now() - hoursAgo * 3600 * 1000);

    const checkoutSession = await prisma.checkoutSession.create({
      data: {
        customerId: cust.id,
        cartValue,
        currency: 'INR',
        status: CheckoutStatus.ABANDONED,
        abandonedAt,
        itemsJson: [
          { sku: 'PROD_001', name: 'Premium Cloud Subscription', quantity: 1, price: cartValue },
        ],
      },
    });

    let status: CaseStatus = CaseStatus.OPEN;
    let closedAt: Date | null = null;
    let closedReason: string | null = null;

    if (cust.optedOut) {
      status = CaseStatus.STOPPED_OPTED_OUT;
      closedAt = new Date();
      closedReason = 'Customer opted out of marketing/recovery messages';
    } else if (i % 3 === 0) {
      status = CaseStatus.RECOVERED;
      closedAt = new Date();
      closedReason = 'Cart checkout completed with personalized incentive';
    }

    const recoveryCase = await prisma.recoveryCase.create({
      data: {
        merchantId: merchant.id,
        customerId: cust.id,
        lane: Lane.CHECKOUT,
        sourceRefId: checkoutSession.id,
        rootCause: 'price_sensitivity',
        status,
        amount: cartValue,
        closedAt,
        closedReason,
        shouldRecover: cust.optedOut ? false : i % 4 !== 0,
      },
    });

    if (status === CaseStatus.RECOVERED) {
      await prisma.recoveryAction.create({
        data: {
          caseId: recoveryCase.id,
          actionType: 'send_discount_coupon',
          channel: 'sms',
          payloadJson: { coupon: 'RECLAIM10', discountPercent: 10 },
          decisionReason: 'Cart abandonment intervention: Offered 10% coupon within merchant policy bounds.',
          modelUsed: 'gemini-2.0-flash',
          attemptNumber: 1,
          outcome: 'confirmed',
        },
      });
    }

    caseCount++;
  }

  // 5.3 Lane C: RECEIVABLE Overdue Invoices (~15 cases)
  for (let i = 40; i < 55; i++) {
    const cust = customers[i];
    const amountDue = crypto.randomInt(10000, 100000);
    const daysOverdue = crypto.randomInt(5, 50);
    const dueDate = new Date(Date.now() - daysOverdue * 24 * 3600 * 1000);

    const invoice = await prisma.invoice.create({
      data: {
        customerId: cust.id,
        invoiceNumber: `INV-2026-${1000 + i}`,
        amountDue,
        currency: 'INR',
        dueDate,
        status: InvoiceStatus.OVERDUE,
      },
    });

    let status: CaseStatus = CaseStatus.OPEN;
    let closedAt: Date | null = null;
    let closedReason: string | null = null;

    if (i % 3 === 0) {
      status = CaseStatus.RECOVERED;
      closedAt = new Date();
      closedReason = 'Invoice paid via structured automated payment schedule';
    } else if (i === 42 || i === 48) {
      status = CaseStatus.ESCALATED_TO_HUMAN;
      closedReason = 'Promise-to-pay schedule agreed, pending merchant approval';
    }

    const recoveryCase = await prisma.recoveryCase.create({
      data: {
        merchantId: merchant.id,
        customerId: cust.id,
        lane: Lane.RECEIVABLE,
        sourceRefId: invoice.id,
        rootCause: 'cashflow_timing',
        status,
        amount: amountDue,
        closedAt,
        closedReason,
        shouldRecover: cust.optedOut ? false : i % 3 !== 0,
      },
    });

    // Seed promise to pay for 2 cases
    if (i === 42 || i === 48) {
      await prisma.promiseToPay.create({
        data: {
          caseId: recoveryCase.id,
          promisedAmount: amountDue,
          promisedDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
          kept: null,
        },
      });
    }

    if (status === CaseStatus.RECOVERED) {
      await prisma.recoveryAction.create({
        data: {
          caseId: recoveryCase.id,
          actionType: 'schedule_reconciliation',
          channel: 'email',
          payloadJson: { invoiceNumber: invoice.invoiceNumber, amount: amountDue },
          decisionReason: 'Automated executive invoice reminder dispatched with payment gateway link.',
          modelUsed: 'gemini-2.0-flash',
          attemptNumber: 1,
          outcome: 'confirmed',
        },
      });
    }

    caseCount++;
  }

  console.log(`✅ Seeded ${caseCount} Recovery Cases across Payment, Checkout, and Receivable lanes.`);
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
