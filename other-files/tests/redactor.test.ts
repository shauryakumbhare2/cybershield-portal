import { describe, expect, it } from 'vitest';
import { detectAll } from '../../backend/engine/detectors';
import { redactText } from '../../backend/engine/redactor';

describe('redactText modes', () => {
  const doc = [
    'Email: john.doe@example.com',
    'Phone: +91 98765-43210',
    'IPv4: 192.0.2.15',
    'IPv6: 2001:db8:85a3::8a2e:370:7334',
    'PAN: ABCPK1234F',
    'Aadhaar: 2345 6789 0124',
    'Card: 4111 1111 1111 1111',
  ].join('\n');

  it('applies full mask mode', () => {
    const detections = detectAll(doc);
    const result = redactText(doc, detections, 'full');
    expect(result.sanitizedText).toBe(
      [
        'Email: [REDACTED]',
        'Phone: [REDACTED]',
        'IPv4: [REDACTED]',
        'IPv6: [REDACTED]',
        'PAN: [REDACTED]',
        'Aadhaar: [REDACTED]',
        'Card: [REDACTED]',
      ].join('\n')
    );
  });

  it('applies partial mask mode for every PII type', () => {
    const detections = detectAll(doc);
    const result = redactText(doc, detections, 'partial');
    expect(result.sanitizedText).toBe(
      [
        'Email: j***@example.com',
        'Phone: XXXXXX3210',
        'IPv4: 192.0.XXX.XXX',
        'IPv6: 2001:db8:XXXX:XXXX:XXXX:XXXX:XXXX:XXXX',
        'PAN: XXXXXX234F',
        'Aadhaar: XXXX-XXXX-0124',
        'Card: XXXX-XXXX-XXXX-1111',
      ].join('\n')
    );
  });

  it('applies consistent pseudonymization with normalization and order of first appearance', () => {
    const repeatedDoc = [
      '1) Alice.Sharma+tag@example.com / alice.sharma+tag@example.com / bob@example.org',
      '2) +91 98765-43210 / 09876543210 / 98765 43210 / +1-202-555-0148',
      '3) 2001:db8::1 / 2001:0db8:0000:0000:0000:0000:0000:0001 / 192.0.2.15',
      '4) ABCPK1234F / abcpk1234f / AAACF9876L',
      '5) 2345 6789 0124 / 234567890124',
      '6) 4111 1111 1111 1111 / 4111111111111111',
    ].join('\n');

    const detections = detectAll(repeatedDoc);
    const result = redactText(repeatedDoc, detections, 'pseudonym');

    expect(result.sanitizedText).toBe(
      [
        '1) USER_01 / USER_01 / USER_02',
        '2) PHONE_01 / PHONE_01 / PHONE_01 / PHONE_02',
        '3) IP_01 / IP_01 / IP_02',
        '4) PAN_01 / PAN_01 / PAN_02',
        '5) AADHAAR_01 / AADHAAR_01',
        '6) CARD_01 / CARD_01',
      ].join('\n')
    );

    expect(result.summary.totalDetections).toBe(17);
    expect(result.summary.uniqueValues).toBe(10);
    expect(result.summary.countByType).toEqual({
      email: 3,
      phone: 4,
      ip: 3,
      pan: 3,
      aadhaar: 2,
      card: 2,
    });
  });

  it('resets pseudonym numbering for each document', () => {
    const docA = 'a@example.com b@example.com';
    const docB = 'b@example.com';

    const resA = redactText(docA, detectAll(docA), 'pseudonym');
    const resB = redactText(docB, detectAll(docB), 'pseudonym');

    expect(resA.sanitizedText).toBe('USER_01 USER_02');
    expect(resB.sanitizedText).toBe('USER_01');
  });

  it('preserves CRLF line endings and CSV structure', () => {
    const csv =
      'id,email,notes\r\n1,"alice@example.com","Called from 9876543210, ok"\r\n2,bob@example.org,"IP 192.0.2.15"\r\n';
    const res = redactText(csv, detectAll(csv), 'pseudonym');
    expect(res.sanitizedText).toBe(
      'id,email,notes\r\n1,"USER_01","Called from PHONE_01, ok"\r\n2,USER_02,"IP IP_01"\r\n'
    );
  });
});
