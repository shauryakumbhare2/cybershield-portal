import { describe, expect, it } from 'vitest';
import {
  detectAadhaars,
  detectAll,
  detectCards,
  detectEmails,
  detectIPs,
  detectPANs,
  detectPhones,
  findSkippedAadhaarPrefixCandidates,
} from '../../backend/engine/detectors';
import { NOISY_SAMPLE_TEXT } from '../../backend/engine/sampleData';
import { isValidVerhoeff } from '../../backend/engine/validators';

describe('detectEmails', () => {
  it('matches standard, subdomain, and plus-addressed emails', () => {
    const text =
      'Send to user@example.com, alice+billing@sub.mail.example.co.uk, and bob_1@example.org.';
    const matches = detectEmails(text);
    expect(matches.map((m) => m.value)).toEqual([
      'user@example.com',
      'alice+billing@sub.mail.example.co.uk',
      'bob_1@example.org',
    ]);
  });

  it('rejects malformed emails', () => {
    const text =
      'bad..user@example.com .lead@example.com trail.@example.com @example.com user@localhost user@-bad.example.com user@bad-.example.com user@example.123 a@b.c';
    expect(detectEmails(text)).toEqual([]);
  });
});

describe('detectPhones', () => {
  it('matches Indian mobiles and international + numbers', () => {
    const text =
      'Indian: 9876543210, 98765 43210, 98765-43210, +91 98765-43210, 09876543210, 0 98765 43210. Intl: +1-202-555-0148, +44 7911 123456, +1 (555) 234-5678.';
    const matches = detectPhones(text);
    expect(matches.map((m) => m.value)).toEqual([
      '9876543210',
      '98765 43210',
      '98765-43210',
      '+91 98765-43210',
      '09876543210',
      '0 98765 43210',
      '+1-202-555-0148',
      '+44 7911 123456',
      '+1 (555) 234-5678',
    ]);
  });

  it('rejects invalid prefixes, too short/long numbers, and embedded tokens', () => {
    const text =
      'Invalid: 5876543210 1234567890 98765432101 ORD-9876543210 +12345 12 98765 43210';
    expect(detectPhones(text)).toEqual([]);
  });
});

describe('detectIPs', () => {
  it('matches IPv4 and IPv6 (full, compressed, IPv4-mapped)', () => {
    const text =
      'v4=192.0.2.15, bracketed=[2001:db8::1]:443, full=2001:0db8:85a3:0000:0000:8a2e:0370:7334, mapped=::ffff:192.0.2.128, loopback=::1.';
    const matches = detectIPs(text);
    expect(matches.map((m) => m.value)).toEqual([
      '192.0.2.15',
      '2001:db8::1',
      '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      '::ffff:192.0.2.128',
      '::1',
    ]);
  });

  it('rejects invalid octets, version numbers, timestamps, and MACs', () => {
    const text =
      'bad=999.10.1.1 ver=v2.14.0.1 three=1.2.3 five=1.2.3.4.5 time=10:25:47 mac=00:1A:2B:3C:4D:5E';
    expect(detectIPs(text)).toEqual([]);
  });
});

describe('detectPANs', () => {
  it('matches case-insensitive PANs with valid 4th letter', () => {
    const validFourth = ['A', 'B', 'C', 'F', 'G', 'H', 'J', 'L', 'P', 'T'];
    const sample = validFourth.map((ch) => `ABC${ch}K1234F`).join(' ') + ' abcpk1234f';
    const matches = detectPANs(sample);
    expect(matches).toHaveLength(11);
  });

  it('rejects invalid 4th letters and embedded tokens', () => {
    const text = 'ABCDK1234F ABCEK1234F XABCPK1234F ABCPK1234FX ABCPK12345';
    expect(detectPANs(text)).toEqual([]);
  });
});

describe('detectAadhaars', () => {
  it('matches 12-digit numbers starting 2-9 (plain or 4-4-4) when strict is off', () => {
    const text = 'a=234567890124 b=2345 6789 0124 c=9123-4567-8905 d=3456 7890 1234';
    const matches = detectAadhaars(text, { strictAadhaar: false });
    expect(matches.map((m) => m.value)).toEqual([
      '234567890124',
      '2345 6789 0124',
      '9123-4567-8905',
      '3456 7890 1234',
    ]);
  });

  it('filters out Verhoeff-invalid numbers when strictAadhaar is true', () => {
    const text = 'valid=2345 6789 0124 invalid=3456 7890 1234';
    const matches = detectAadhaars(text, { strictAadhaar: true });
    expect(matches.map((m) => m.value)).toEqual(['2345 6789 0124']);
  });

  it('rejects leading 0/1 and longer numeric tokens by default, and supports optional 0/1 test mode & trailing period', () => {
    const text = '1452-4845-8656, 0234 5678 9012, 2345678901249, INV-998877665544';
    expect(detectAadhaars(text)).toEqual([]);
    expect(findSkippedAadhaarPrefixCandidates(text)).toEqual([
      '1452-4845-8656',
      '0234 5678 9012',
    ]);
    expect(
      detectAadhaars('1452-4845-8656 and 2345-6789-0124.', {
        allowInvalidAadhaarPrefix: true,
      }).map((m) => m.value)
    ).toEqual(['1452-4845-8656', '2345-6789-0124']);
  });
});

describe('detectCards', () => {
  it('matches Luhn-valid cards and rejects Luhn-invalid cards', () => {
    const text =
      'valid1=4111 1111 1111 1111 valid2=4111-1111-1111-1111 amex=3782 822463 10005 invalid=4111 1111 1111 1112';
    const matches = detectCards(text);
    expect(matches.map((m) => m.value)).toEqual([
      '4111 1111 1111 1111',
      '4111-1111-1111-1111',
      '3782 822463 10005',
    ]);
  });
});

describe('detectAll accuracy & overlap rules', () => {
  it('never flags failed-Luhn card or any sub-part of it as another type', () => {
    // 4111 2222 3333 4445 fails Luhn; its 12-digit prefix "4111 2222 3333" or
    // 10-digit suffix would otherwise look Aadhaar/phone-like without exclusion.
    const text = 'declined 4111 1111 1111 1112 and 4111 2222 3333 4445 and 9876543210123';
    expect(detectAll(text)).toEqual([]);
  });

  it('enforces priority: email > card > aadhaar > pan > ip > phone', () => {
    // Phone-like local part in email -> email wins over phone
    const emailWins = detectAll('9876543210@example.com');
    expect(emailWins).toEqual([
      { type: 'email', value: '9876543210@example.com', start: 0, end: 22 },
    ]);

    // +91 followed by 10-digit Indian mobile starting 6-9 -> phone (not blocked as card, <13 digits)
    const indianPhone = detectAll('+91 98765 43210');
    expect(indianPhone).toEqual([
      { type: 'phone', value: '+91 98765 43210', start: 0, end: 15 },
    ]);
  });

  it('detects every intended item in NOISY_SAMPLE_TEXT with zero false positives on near-misses', () => {
    const matches = detectAll(NOISY_SAMPLE_TEXT);
    const byType = (t: string) => matches.filter((m) => m.type === t).map((m) => m.value);

    expect(byType('email')).toEqual([
      'Alice.Sharma+billing@example.com',
      'alice.sharma+billing@example.com',
      'support.desk@mail.example.org',
      'aarav.mehta@example.net',
      'dr.meera@clinic.example.com',
    ]);

    expect(byType('ip')).toEqual([
      '192.0.2.15',
      '2001:db8:85a3::8a2e:370:7334',
      '198.51.100.42',
      '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      '203.0.113.7',
    ]);

    expect(byType('card')).toEqual([
      '4111 1111 1111 1111',
      '4111111111111111',
    ]);

    expect(byType('phone')).toEqual([
      '+91 98765-43210',
      '09876543210',
      '+1-202-555-0148',
      '98765 43210',
    ]);

    expect(byType('pan')).toEqual([
      'ABCPK1234F',
      'abcpk1234f',
      'AAACF9876L',
    ]);

    const aadhaars = byType('aadhaar');
    expect(aadhaars).toEqual([
      '2345 6789 0124',
      '234567890124',
      '9123-4567-8905',
    ]);
    for (const num of aadhaars) {
      expect(isValidVerhoeff(num)).toBe(true);
    }

    // Verify all near-misses remained untouched
    const values = matches.map((m) => m.value);
    expect(values).not.toContain('999.10.1.1');
    expect(values).not.toContain('4111 1111 1111 1112');
    expect(values).not.toContain('ABCDX1234F');
  });
});
