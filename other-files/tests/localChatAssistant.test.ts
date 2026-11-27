import { describe, expect, it } from 'vitest';
import { generateLocalAssistantReply } from '../../backend/engine/localChatAssistant';
import type { SummaryStats } from '../../backend/engine/types';

const emptySummary: SummaryStats = {
  totalDetections: 0,
  uniqueValues: 0,
  countByType: { email: 0, phone: 0, ip: 0, pan: 0, aadhaar: 0, card: 0 },
  uniqueByType: { email: 0, phone: 0, ip: 0, pan: 0, aadhaar: 0, card: 0 },
};

const baseContext = {
  hasDocument: false,
  summary: emptySummary,
  mode: 'full' as const,
  strictAadhaar: false,
  enabledTypes: {
    email: true,
    phone: true,
    ip: true,
    pan: true,
    aadhaar: true,
    card: true,
  },
};

describe('generateLocalAssistantReply', () => {
  it('diagnoses failed-Luhn card numbers accurately', () => {
    const reply = generateLocalAssistantReply(
      'Why was 4111 1111 1111 1112 not flagged as a card?',
      baseContext
    );
    expect(reply).toContain('FAILS');
    expect(reply).toContain('Luhn');
  });

  it('diagnoses invalid IPv4 addresses accurately', () => {
    const reply = generateLocalAssistantReply(
      'Why was 999.10.1.1 skipped?',
      baseContext
    );
    expect(reply).toContain('Not a valid IPv4');
    expect(reply).toContain('0–255');
  });

  it('runs inline local scan queries without network calls', () => {
    const reply = generateLocalAssistantReply(
      'scan: Contact alice@example.com or 9876543210',
      baseContext
    );
    expect(reply).toContain('EMAIL');
    expect(reply).toContain('PHONE');
  });

  it('reports active document summary when loaded', () => {
    const reply = generateLocalAssistantReply('Explain my current scan summary', {
      ...baseContext,
      hasDocument: true,
      summary: {
        ...emptySummary,
        totalDetections: 5,
        uniqueValues: 3,
        countByType: { ...emptySummary.countByType, email: 3, ip: 2 },
        uniqueByType: { ...emptySummary.uniqueByType, email: 2, ip: 1 },
      },
    });
    expect(reply).toContain('Total detections: 5');
    expect(reply).toContain('Unique normalized values: 3');
  });
});
