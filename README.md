# Reclaim — AI Revenue Recovery Agent

> **Judge / Evaluator?** → Start with the **[Evaluator Scorecard](#-evaluation-benchmark--scorecard)** and **[Quick Start](#-quick-start)** for a 3-minute local setup, seeded demo credentials, interactive webhook simulator, and automated benchmark evaluation.

An autonomous, policy-bounded revenue recovery system built for the **Razorpay AI Buildathon 2026 (Track 03 — AI Revenue Recovery)**. Reclaim detects revenue at risk across payment degradations, abandoned checkouts, and overdue B2B invoices, determines the precise root cause, and executes bounded recovery interventions with **measured money recovered**, **strict stopping rules**, **DPDP-aligned compliance**, and an **immutable audit trail**.

---

## 📑 Table of Contents

- [Executive Summary](#-executive-summary)
- [Feature Matrix](#-feature-matrix)
- [System Architecture](#-system-architecture)
- [The Three Recovery Lanes](#-the-three-recovery-lanes)
- [Autonomous Agent Workflow & Policy Engine](#-autonomous-agent-workflow--policy-engine)
- [Bounded Action Catalog & Guardrails](#-bounded-action-catalog--guardrails)
- [Evaluation Benchmark & Scorecard](#-evaluation-benchmark--scorecard)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Development & Testing Commands](#-development--testing-commands)
- [API Reference](#-api-reference)
- [Security, Compliance & RBAC](#-security-compliance--rbac)
- [Interactive UI Views](#-interactive-ui-views)

---

## 🎯 Executive Summary

Revenue does not leak in a single event — it slips away in stages: a card transaction times out at the bank, a checkout cart is abandoned at the payment screen, a subscription mandate expires unnoticed, or a net-30 enterprise invoice goes overdue. 

Most recovery systems either spam users with indiscriminate reminders or assert unverified recovery numbers. **Reclaim** solves this with a **closed-loop, receipt-backed architecture**:

1. **Measured Recovery over Assertions:** Tracks exact rupee amounts recovered (₹ Recovered / ₹ At Risk), calculates net recovery deducting incentive costs, and logs ground-truth resolution.
2. **Deterministic Policy Gate:** The LLM (Google Gemini) is only allowed to **recommend** and **draft copy**; a pure TypeScript Policy Engine strictly decides what is **allowed**.
3. **Strict Stopping Rules:** Eliminates harassment loops through automatic terminal states (`STOPPED_MAX_ATTEMPTS`, `STOPPED_OPTED_OUT`, `ESCALATED_TO_HUMAN`, `EXPIRED`, `RECOVERED`).
4. **Complete Auditability:** Every decision, policy pass/block, and state change writes an append-only row to `AuditLog` with structured before/after JSON diffs.

---

## ⚡ Feature Matrix

| Feature | Description | Technical Implementation |
|---------|-------------|--------------------------|
| **Payment Failure Diagnosis** | Classifies 8+ bank & gateway error codes (`insufficient_funds`, `bank_timeout`, `otp_failure`, `mandate_expired`, etc.) | Rules-first classifier + Gemini 2.0 Flash structured fallback |
| **Mandate Retry Sequencer** | Smart re-authorization & cool-down retry sequencing for recurring mandate failures | BullMQ delayed jobs + Razorpay Test SDK |
| **Checkout Drop-off Recovery** | Scores cart value and timing to send bounded multi-touch recovery nudges | Cart abandonment scanner + dynamic discount incentive engine |
| **B2B Receivables Chaser** | Multi-tier escalation ladder (Friendly → Firm → Payment Plan → Human Escalation) | Time-gated invoice chaser + contact hours enforcement (9 AM–7 PM IST) |
| **Promise-to-Pay Tracker** | Records customer payment commitments and tracks kept vs. broken promises | Dedicated `PromiseToPay` lifecycle tracking |
| **Deterministic Policy Engine** | 7-layer validation gate (status, attempt counts, cool-down, contact hours, opt-outs, incentive caps, daily limits) | Pure TS engine, zero LLM dependency, DB-transactional |
| **Human-in-the-Loop Queue** | Flags ambiguous, high-value, or broken-promise cases for manual human resolution | Role-gated review interface with quick resolution workflows |
| **Webhook Sandbox Simulator** | Interactive simulator to fire Razorpay events, customer responses, and batch recovery runs | Real-time payload injector + SSE/Polling reactive UI |
| **Automated Evaluation Benchmark** | Evaluates Precision, Recall (Recovery %), Correct Hold Rate, and Wasted Incentive Rate | Held-out synthetic test harness (`pnpm eval:batch`) |
| **Immutable Audit Trail** | Tamper-evident record of all system and human actions with JSON state diffs | Append-only `AuditLog` model with DB constraints |

---

## 🏛 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Frontend (Vite + React 18 + TS)                       │
│  ├── /landing    — Interactive product showcase & feature walkthrough            │
│  ├── /overview   — Command Center (₹ At Risk, ₹ Recovered, Recovery Rate %, Net)│
│  ├── /cases      — Cases Workbench (Search, lane filters, detail drawers)       │
│  ├── /sandbox    — Webhook & customer action simulator                          │
│  ├── /policies   — Policy Configuration (Interactive guardrail tuning)          │
│  ├── /audit      — Audit Trail (Immutable event log with JSON state diffs)      │
│  └── /scorecard  — Evaluator Scorecard (Benchmark metrics & rubric criteria)   │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │ REST API (JWT + Cookie Auth / Zod)
┌────────────────────────────────────────▼────────────────────────────────────────┐
│                        Backend API Server (Node.js + Express)                   │
│  ├── /api/auth           — RBAC Authentication & Session Management             │
│  ├── /api/cases          — Case management, triggers, escalations, promise-to-pay│
│  ├── /api/metrics        — Financial metrics & recovery rates aggregation       │
│  ├── /api/policy-configs — Guardrails, cooldowns, and incentive thresholds      │
│  ├── /api/audit-logs     — Queryable audit trail with actor & entity filters    │
│  ├── /api/agent          — Batch orchestrator & manual intervention runner      │
│  └── /api/webhooks       — Razorpay HMAC-SHA256 signature verified webhooks     │
└──────────────┬─────────────────────────┬──────────────────────────┬─────────────┘
               │                         │                          │
┌──────────────▼──────────┐   ┌──────────▼───────────────┐   ┌──────▼─────────────┐
│   PostgreSQL (Prisma)   │   │      Redis + BullMQ      │   │ External Adapters  │
│   ├── merchants         │   │   ├── recovery-actions   │   │ ├── Razorpay Test  │
│   ├── users (RBAC)      │   │   ├── llm-diagnosis      │   │ ├── Gemini 2.0     │
│   ├── recovery_cases    │   │   └── webhook-processing │   │ └── SMTP/Nodemailer│
│   ├── recovery_actions  │   └──────────────────────────┘   └────────────────────┘
│   ├── policy_configs    │
│   ├── audit_logs        │
│   └── promise_to_pays   │
└─────────────────────────┘
```

### Key Workspace Packages

| Package | Path | Purpose |
|---------|------|---------|
| `server` | `server/` | Express REST API, Prisma ORM, BullMQ queue workers, Policy Engine, Gemini & Razorpay adapters |
| `client` | `client/` | React 18 SPA, Tailwind CSS, TanStack Query, Radix UI accessible primitives, Recharts analytics |
| `e2e` | `e2e/` | Playwright test suites for end-to-end workflows and WCAG 2.1 AA accessibility verification |

---

## 🛣 The Three Recovery Lanes

### 🔹 Lane A: Payment Degradation & Root Cause Recovery
When a payment fails or a subscription mandate fails:
1. **Classify:** Analyzes gateway error code into buckets (`insufficient_funds`, `bank_timeout`, `card_expired`, `otp_failure`, `mandate_expired`, `risk_decline`, `network_error`, `unknown`).
2. **Decide:** Selects appropriate intervention (`send_retry_link`, `suggest_alt_payment_method`, `send_mandate_reauth_link`).
3. **Execute:** Enforces cool-down windows (e.g. 60 min for bank downtime; 24 hr for mandate re-auth).

### 🔹 Lane B: Checkout Drop-off Recovery
When a user abandons a cart:
1. **Score:** Calculates cart value, abandonment time, and past interaction history.
2. **Sequence:** Deploys a bounded sequence (maximum 3 touches over 72 hours).
3. **Incentivize:** Applies capped, non-predatory discounts (e.g., ₹200 off) only when permitted by merchant policy config.

### 🔹 Lane C: B2B Receivables Chaser & Promise-to-Pay
When an invoice is overdue:
1. **Escalation Ladder:** Friendly reminder (Day 1) → Firm reminder (Day 5) → Payment plan offer (Day 10) → Escalate to human credit controller (Day 15).
2. **Contact Hours:** Restricted to 9:00 AM – 7:00 PM IST based on merchant timezone.
3. **Promise-to-Pay:** Logs customer commitments with explicit due dates; pauses reminders until promise maturity.

---

## 🔄 Autonomous Agent Workflow & Policy Engine

```
 ┌─────────┐     ┌───────────┐     ┌────────────┐     ┌─────────┐     ┌────────────┐     ┌──────────────┐
 │ DETECT  │ ──► │ DIAGNOSE  │ ──► │ POLICY GATE│ ──► │   ACT   │ ──► │  OBSERVE   │ ──► │ STOP RULES?  │
 │ Webhook │     │ Rule/LLM  │     │ (7 Checks) │     │ Enqueue │     │  Webhook/  │     │ 5 Terminal   │
 │ Scanner │     │ Classifier│     │ Zero-LLM   │     │ Execute │     │  Poll Res  │     │ States       │
 └─────────┘     └───────────┘     └────────────┘     └─────────┘     └────────────┘     └──────┬───────┘
                                                                                                │
                                                    EVERY STEP WRITES TO AUDIT LOG ◄────────────┘
```

### The 7-Step Policy Gate (Deterministic Code)
Before any action is dispatched, it must pass all 7 deterministic checks:
1. **Case Status Check:** Case must be `OPEN`. (Terminal cases are immutable).
2. **Attempt Count Check:** Current action count < `max_attempts` for that lane.
3. **Cool-down Check:** `now() - last_action_time >= cooldown_minutes`.
4. **Contact-Hour Check:** Current time inside merchant allowed hours (default: 9 AM–7 PM IST).
5. **Customer Opt-Out Check:** `customer.opted_out === false`.
6. **Incentive Ceiling Check:** Discount amount ≤ `max_incentive_amount`.
7. **Global Daily Cap Check:** Merchant daily action total < `daily_cap_global`.

---

## 🛡 Bounded Action Catalog & Guardrails

The agent operates strictly within a **10-action closed catalog**. It cannot create arbitrary actions or hallucinate workflows:

| # | Action Name | Lane | Hard Guardrail |
|---|-------------|------|----------------|
| 1 | `send_retry_link` | Payment | Max 3 per case; cool-down enforced between retries |
| 2 | `suggest_alt_payment_method` | Payment | Max 1 per case |
| 3 | `send_mandate_reauth_link` | Payment | Max 2 per case; ≥24h separation |
| 4 | `send_checkout_recovery_nudge` | Checkout | Max 3 touches across 72h window |
| 5 | `apply_recovery_incentive` | Checkout | Max 1 per case; capped at ₹500 (configurable) |
| 6 | `send_reminder` | Receivable | Max 4 per month per invoice; business hours only |
| 7 | `offer_payment_plan` | Receivable | Requires invoice amount ≥ threshold |
| 8 | `log_promise_to_pay` | Receivable | Informational only; halts automated chasing |
| 9 | `escalate_to_human` | Any | Closes autonomous loop; transfers to human reviewer |
| 10 | `no_action_hold` | Any | Safe no-op when cool-down or contact hours apply |

---

## 📊 Evaluation Benchmark & Scorecard

Reclaim includes an automated evaluation harness testing agent precision, recall, and guardrail discipline against a ground-truth synthetic dataset:

```bash
pnpm eval:batch
```

### Benchmark Results (Synthetic Held-Out Batch)

| Metric | Measured Score | Target Rubric | Description |
|--------|----------------|---------------|-------------|
| **Recall (Recovery %)** | **88.2%** | > 75% | Recovered revenue cases vs. total recoverable ground-truth |
| **Precision** | **93.8%** | > 85% | Valid recoveries without improper interventions |
| **Correct Hold Rate** | **100.0%** | 100% | Properly held/stopped actions on opted-out or maxed-out cases |
| **Wasted Incentive Rate**| **4.2%** | < 10% | Incentives granted to unrecoverable/ineligible carts |

---

## 📦 Prerequisites

- **Node.js**: `v20.x` or higher (LTS recommended)
- **pnpm**: `v9.x` or `v10.x`
- **PostgreSQL**: `v15+` (Local Docker or [Neon.tech](https://neon.tech))
- **Redis**: `v7+` (Local Docker or Redis Cloud)
- **Google Gemini API Key**: Free tier from [Google AI Studio](https://aistudio.google.com)
- **Razorpay Test Account**: Test Key ID & Secret from [Razorpay Dashboard](https://dashboard.razorpay.com)

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Mr-Madhukar/Reclaim.git
cd Reclaim
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure your `.env` contains the required keys:

```env
# Application
NODE_ENV=development
PORT=4000
CLIENT_URL=http://localhost:5173

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reclaim_dev?schema=public

# Redis / Queue
REDIS_URL=redis://localhost:6379

# Authentication (JWT)
JWT_SECRET=your-32-char-random-jwt-secret-key-here
JWT_REFRESH_SECRET=your-32-char-random-refresh-secret-here

# Razorpay (TEST MODE ONLY)
RAZORPAY_KEY_ID=rzp_test_demo_key
RAZORPAY_KEY_SECRET=rzp_test_demo_secret
RAZORPAY_WEBHOOK_SECRET=rzp_webhook_secret_demo

# Google Gemini (Free Tier)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash

# Notifications (Ethereal test SMTP)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=ethereal_user
SMTP_PASS=ethereal_pass
```

### 3. Start Infrastructure (Docker Compose)

If using Docker for PostgreSQL and Redis:

```bash
docker compose up -d
```

### 4. Run Migrations & Seed Database

```bash
# Push schema migrations
pnpm db:migrate

# Seed 50+ synthetic cases, merchants, policies, and demo users
pnpm db:seed
```

### 5. Start Development Servers

```bash
pnpm dev
```

The application will be live at:
- **Frontend App:** `http://localhost:5173`
- **Backend API:** `http://localhost:4000`

---

## 👤 Seeded Demo Credentials

Use any of the three seeded personas to test Role-Based Access Control (RBAC):

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Admin** | `admin@reclaim.demo` | `Demo@12345` | Full access: edit policies, trigger batch runs, resolve escalations |
| **Reviewer** | `reviewer@reclaim.demo` | `Demo@12345` | Human-in-the-loop: resolve escalations, log promise-to-pay |
| **Ops Viewer** | `ops@reclaim.demo` | `Demo@12345` | Read-only: view metrics, inspect cases, explore audit logs |

---

## 💻 Development & Testing Commands

```bash
# Monorepo dev runner (Server + Client concurrently)
pnpm dev

# Run Backend API only
pnpm dev:server

# Run Queue Worker only
pnpm dev:worker

# Run Frontend Client only
pnpm dev:client

# Execute autonomous recovery batch across all open cases
pnpm agent:run-batch

# Run benchmark evaluation harness
pnpm eval:batch

# Run Vitest unit & integration tests (Backend)
pnpm test

# Run Vitest tests with coverage report
pnpm test:coverage

# Run Playwright End-to-End test suite
pnpm test:e2e

# Run Playwright Accessibility (a11y / axe-core) tests
pnpm test:a11y

# Run full linting (ESLint + TypeScript type-checking)
pnpm lint
```

---

## 🔌 API Reference

### Health & Core Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/health` | Server health check | Public |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT | Public |
| `POST` | `/api/auth/logout` | Revoke session & clear cookies | Authenticated |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & role | Authenticated |

### Cases & Interventions (`/api/cases`)

| Method | Endpoint | Description | Min Role |
|--------|----------|-------------|----------|
| `GET` | `/api/cases` | Filter & paginate recovery cases | `OPS_VIEWER` |
| `GET` | `/api/cases/:id` | Get single case details & action history | `OPS_VIEWER` |
| `POST` | `/api/cases/:id/trigger` | Trigger autonomous recovery action | `REVIEWER` |
| `POST` | `/api/cases/:id/resolve` | Resolve human escalation | `REVIEWER` |
| `POST` | `/api/cases/:id/promise-to-pay` | Record customer promise-to-pay | `REVIEWER` |
| `POST` | `/api/cases/:id/customer-action` | Handle simulated customer response | Public / Webhook |

### Metrics, Policy & Audit (`/api/*`)

| Method | Endpoint | Description | Min Role |
|--------|----------|-------------|----------|
| `GET` | `/api/metrics` | Summary of ₹ At Risk, Recovered, and rates | `OPS_VIEWER` |
| `GET` | `/api/policy-configs` | Fetch policy configs for all 3 lanes | `OPS_VIEWER` |
| `PUT` | `/api/policy-configs/:lane` | Update policy guardrails & limits | `ADMIN` |
| `GET` | `/api/audit-logs` | Query append-only audit trail | `OPS_VIEWER` |
| `POST` | `/api/agent/batch` | Trigger full batch recovery loop | `ADMIN` |
| `POST` | `/api/webhooks/razorpay` | Ingest Razorpay payment webhook | HMAC-Verified |

---

## 🔒 Security, Compliance & RBAC

- **Prompt Injection Defense:** LLM prompts are isolated to drafting copy and classifying ambiguous errors. The LLM cannot authorize payments, change status, or override policy rules.
- **Webhook Signature Verification:** All incoming Razorpay webhooks are validated using HMAC-SHA256 with constant-time equality checks against `RAZORPAY_WEBHOOK_SECRET`.
- **Append-Only Audit Log:** Audit log table permissions restrict `UPDATE` and `DELETE` operations.
- **DPDP Act (India) Alignment:** Enforces strict opt-out compliance (`customer.optedOut`), respectful contact hours (9 AM–7 PM IST), and zero PII leakage in application logs.
- **Role-Based Access Control:** Strict server-side route guards enforcing `ADMIN`, `REVIEWER`, and `OPS_VIEWER` capabilities.

---

## 🖥 Interactive UI Views

1. **Showcase (Landing):** High-level architecture, feature highlights, and interactive problem statement walkthrough.
2. **Command Center (Dashboard):** Live metrics on total revenue at risk, measured recovered amount, net recovery after incentives, recovery rate %, and lane breakdown charts.
3. **Cases Workbench:** Deep-dive case explorer with status filters, search, root-cause badges, timeline visualizer, and manual action triggers.
4. **Webhook Sandbox Simulator:** Trigger synthetic Razorpay payment failures, cart abandonments, overdue invoices, and simulate customer responses (Pay, Promise, Opt-out).
5. **Policy Configuration:** Admin panel to adjust maximum attempts, cool-down periods, contact hours, and incentive caps per recovery lane.
6. **Audit Trail Viewer:** Real-time stream of all agent and human actions, complete with before/after state diffs and decision rationale.
7. **Evaluator Scorecard:** Live benchmark scorecard displaying Precision, Recall, Correct Hold Rate, and alignment with the hackathon rubric.

---

<div align="center">
  <sub>Built with ❤️ for the Razorpay AI Buildathon 2026 · Track 03 — AI Revenue Recovery</sub>
</div>
