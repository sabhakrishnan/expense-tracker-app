import { Transaction } from '../models/Transaction';

type ParseResult = {
  transaction?: Transaction;
  matched: boolean;
};

// Common regex patterns for transaction SMS messages (India examples)
const patterns: { name: string; regex: RegExp; type?: 'Cr' | 'Db' }[] = [
  { name: 'debited_inr', regex: /debited for\s*(?:INR|Rs\.?|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i, type: 'Db' },
  { name: 'debited_at', regex: /debited(?: at| by)?\s+([A-Za-z0-9 &.,'-]+)\s*(?:for|:)?\s*(?:INR|Rs\.?|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i, type: 'Db' },
  { name: 'spent_at', regex: /spent(?: at)?\s+([A-Za-z0-9 &.,'-]+)\s*(?:for|:)?\s*(?:INR|Rs\.?|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i, type: 'Db' },
  { name: 'credited', regex: /credited(?: to)?\s*(?:INR|Rs\.?|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i, type: 'Cr' },
];

function normalizeAmount(amountStr: string) {
  if (!amountStr) return 0;
  return parseFloat(amountStr.replace(/,/g, '')) || 0;
}

export function parseSmsToTransaction(smsText: string): ParseResult {
  if (!smsText) return { matched: false };

  for (const p of patterns) {
    const m = smsText.match(p.regex);
    if (m) {
      // amount may be in capture group 1 or 2 depending on pattern
      const amountStr = (m[2] || m[1] || '').toString();
      const amount = normalizeAmount(amountStr);
      const detail = smsText.slice(0, 120); // short preview
      const now = new Date();

      const tx: Transaction = {
        id: `sms-${Date.now()}`,
        detail,
        amount,
        type: p.type || 'Db',
        status: 'Review',
        category: 'Uncategorized',
        date: now,
      };

      return { matched: true, transaction: tx };
    }
  }

  return { matched: false };
}

export default { parseSmsToTransaction };
