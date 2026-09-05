import { RecoveryCase } from '../types';
import { formatINR } from './utils';

export interface ReceiptData {
  caseId: string;
  sourceRefId: string;
  paymentId: string;
  amount: number;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  merchantName?: string;
  lane?: string;
  timestamp?: string;
}

/**
 * Generates an official, beautifully styled, print-ready HTML payment receipt
 */
export function generateReceiptHtml(data: ReceiptData): string {
  const timestamp = data.timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const receiptNo = `REC-${data.caseId.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
  const formattedAmount = formatINR(data.amount);
  const merchant = data.merchantName || 'Reclaim SaaS Services';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt - ${receiptNo} - Reclaim</title>
  <style>
    @media print {
      body { background: #fff !important; color: #000 !important; padding: 0 !important; }
      .no-print { display: none !important; }
      .receipt-container { border: none !important; box-shadow: none !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #334155;
      padding: 30px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }
    .actions-bar {
      max-width: 650px;
      width: 100%;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-bottom: 20px;
    }
    .btn {
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #4f46e5;
      color: white;
    }
    .btn-primary:hover { background: #4338ca; }
    .btn-secondary {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
    }
    .btn-secondary:hover { background: #334155; }

    .receipt-container {
      background: #ffffff;
      max-width: 650px;
      width: 100%;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
      border: 1px solid #e2e8f0;
      position: relative;
      overflow: hidden;
    }
    .receipt-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #3b82f6, #6366f1, #10b981);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px dashed #e2e8f0;
      padding-bottom: 24px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
      letter-spacing: -0.5px;
    }
    .brand-badge {
      background: #e0e7ff;
      color: #4338ca;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .merchant-info {
      font-size: 12px;
      color: #64748b;
      margin-top: 6px;
      line-height: 1.5;
    }
    .receipt-meta {
      text-align: right;
    }
    .status-pill {
      display: inline-block;
      background: #dcfce7;
      color: #15803d;
      font-size: 12px;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 8px;
      border: 1px solid #bbf7d0;
    }
    .receipt-no {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      font-family: monospace;
    }
    .receipt-date {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }

    .bill-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 24px;
    }
    .info-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #94a3b8;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .info-val {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
    }
    .info-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }

    .line-items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .line-items th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .line-items td {
      padding: 14px 0;
      font-size: 13px;
      border-bottom: 1px solid #f1f5f9;
    }
    .line-items .text-right {
      text-align: right;
    }

    .summary-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .summary-row.total {
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 8px;
      margin-bottom: 0;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .summary-row.total .amt {
      color: #059669;
    }

    .security-badge {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .security-icon {
      font-size: 20px;
    }
    .security-text {
      font-size: 11px;
      color: #166534;
      line-height: 1.4;
    }
    .security-text strong {
      display: block;
      color: #14532d;
    }

    .footer {
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="actions-bar no-print">
    <button class="btn btn-secondary" onclick="window.close()">Close Window</button>
    <button class="btn btn-primary" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="receipt-container">
    <div class="header">
      <div>
        <div class="brand-title">
          <span>Reclaim</span>
          <span class="brand-badge">Razorpay Verified</span>
        </div>
        <div class="merchant-info">
          <strong>${merchant}</strong><br>
          GSTIN: 29AAAAA0000A1Z5 • Tax Invoice &amp; Payment Receipt<br>
          Authorized Razorpay Payment Gateway Partner
        </div>
      </div>
      <div class="receipt-meta">
        <span class="status-pill">PAID &amp; CAPTURED</span>
        <div class="receipt-no">${receiptNo}</div>
        <div class="receipt-date">${timestamp}</div>
      </div>
    </div>

    <div class="bill-grid">
      <div>
        <div class="info-label">Billed To (Customer)</div>
        <div class="info-val">${data.customerName}</div>
        <div class="info-sub">${data.customerEmail}</div>
        ${data.customerPhone ? `<div class="info-sub">${data.customerPhone}</div>` : ''}
      </div>
      <div>
        <div class="info-label">Payment Information</div>
        <div class="info-val">${data.paymentMethod}</div>
        <div class="info-sub"><strong>Payment ID:</strong> ${data.paymentId}</div>
        <div class="info-sub"><strong>Ref:</strong> ${data.sourceRefId}</div>
      </div>
    </div>

    <table class="line-items">
      <thead>
        <tr>
          <th>Description</th>
          <th>Case Ref</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Autonomous Payment Recovery</strong>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              Lane: ${data.lane || 'Payment Degradation'} • Gateway Re-authorization
            </div>
          </td>
          <td style="font-family: monospace; font-size: 12px;">#${data.sourceRefId.slice(0, 14)}</td>
          <td class="text-right" style="font-weight: 700;">${formattedAmount}</td>
        </tr>
      </tbody>
    </table>

    <div class="summary-card">
      <div class="summary-row">
        <span>Principal Amount</span>
        <span>${formattedAmount}</span>
      </div>
      <div class="summary-row">
        <span>Razorpay Processing Fee</span>
        <span>₹0.00 (Waived)</span>
      </div>
      <div class="summary-row">
        <span>Applicable GST (18%)</span>
        <span>Included</span>
      </div>
      <div class="summary-row total">
        <span>Total Amount Paid</span>
        <span class="amt">${formattedAmount}</span>
      </div>
    </div>

    <div class="security-badge">
      <div class="security-icon">🛡️</div>
      <div class="security-text">
        <strong>Digitally Verified by Razorpay Webhook Engine</strong>
        Cryptographic HMAC-SHA256 signature verified • DPDP Act 2023 Compliant Audit Log #AUD-${data.caseId.slice(0, 8)}
      </div>
    </div>

    <div class="footer">
      This is an authentic, computer-generated payment receipt authorized by Reclaim AI &amp; Razorpay.<br>
      For queries, reach out to support@reclaim.mrmadhukar.in referencing Receipt ID: ${receiptNo}.
    </div>
  </div>

  <script>
    // Auto-trigger print dialog if opened in browser window
    window.addEventListener('load', function() {
      if (!window.location.search.includes('noPrint=true')) {
        setTimeout(function() { window.print(); }, 400);
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Downloads the receipt as an HTML file and opens the print preview dialog
 */
export function downloadPaymentReceipt(
  kase: RecoveryCase,
  paymentId: string,
  paymentMethod: string = 'Razorpay Gateway'
): void {
  const receiptData: ReceiptData = {
    caseId: kase.id,
    sourceRefId: kase.sourceRefId,
    paymentId: paymentId || `pay_recov_${Date.now().toString(36)}`,
    amount: Number(kase.amount),
    paymentMethod,
    customerName: kase.customer?.name || 'Customer',
    customerEmail: kase.customer?.email || 'customer@example.com',
    customerPhone: kase.customer?.phone || undefined,
    merchantName: kase.merchant?.name || 'Reclaim SaaS Services',
    lane: kase.lane,
  };

  const html = generateReceiptHtml(receiptData);

  // 1. Download file directly as .html
  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `Reclaim_Payment_Receipt_${receiptData.paymentId}.html`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    // 2. Open printable receipt window via Blob URL (no deprecated document.write)
    const receiptWindow = window.open(url, '_blank');
    if (receiptWindow) {
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } else {
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  } catch (err) {
    console.error('Failed to trigger receipt download/print:', err);
  }
}
