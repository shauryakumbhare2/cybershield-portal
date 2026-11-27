import { describe, expect, it } from 'vitest';
import {
  expandIPv6,
  isValidIPv4,
  isValidIPv6,
  isValidLuhn,
  isValidVerhoeff,
} from '../../backend/engine/validators';

describe('isValidLuhn', () => {
  it('accepts valid card numbers (13, 15, 16, 19 digits)', () => {
    expect(isValidLuhn('4111 1111 1111 1111')).toBe(true);
    expect(isValidLuhn('4111111111111111')).toBe(true);
    expect(isValidLuhn('3782-822463-10005')).toBe(true);
    expect(isValidLuhn('4111111111119')).toBe(true);
    expect(isValidLuhn('4111111111111111119')).toBe(false); // check invalid 19-digit
    expect(isValidLuhn('4111111111111111110')).toBe(true);
  });

  it('rejects invalid Luhn and invalid lengths', () => {
    expect(isValidLuhn('4111 1111 1111 1112')).toBe(false);
    expect(isValidLuhn('411111111111')).toBe(false); // 12 digits
    expect(isValidLuhn('41111111111111111111')).toBe(false); // 20 digits
    expect(isValidLuhn('4111-1111-1111-111A')).toBe(false);
  });
});

describe('isValidVerhoeff', () => {
  it('accepts valid 12-digit Verhoeff numbers', () => {
    expect(isValidVerhoeff('234567890124')).toBe(true);
    expect(isValidVerhoeff('2345 6789 0124')).toBe(true);
    expect(isValidVerhoeff('9123-4567-8905')).toBe(true);
  });

  it('detects single-digit and transposition errors', () => {
    expect(isValidVerhoeff('234567890125')).toBe(false);
    expect(isValidVerhoeff('234567890214')).toBe(false);
    expect(isValidVerhoeff('3456 7890 1234')).toBe(false);
    expect(isValidVerhoeff('')).toBe(false);
  });
});

describe('isValidIPv4', () => {
  it('accepts valid IPv4 addresses', () => {
    expect(isValidIPv4('0.0.0.0')).toBe(true);
    expect(isValidIPv4('192.0.2.15')).toBe(true);
    expect(isValidIPv4('255.255.255.255')).toBe(true);
  });

  it('rejects out-of-range octets, leading zeros, and wrong segment counts', () => {
    expect(isValidIPv4('999.10.1.1')).toBe(false);
    expect(isValidIPv4('256.0.0.1')).toBe(false);
    expect(isValidIPv4('192.168.01.1')).toBe(false);
    expect(isValidIPv4('1.2.3')).toBe(false);
    expect(isValidIPv4('1.2.3.4.5')).toBe(false);
  });
});

describe('isValidIPv6 & expandIPv6', () => {
  it('accepts full, compressed, loopback, and IPv4-mapped IPv6', () => {
    expect(isValidIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    expect(isValidIPv6('2001:db8:85a3::8a2e:370:7334')).toBe(true);
    expect(isValidIPv6('::1')).toBe(true);
    expect(isValidIPv6('fe80::')).toBe(true);
    expect(isValidIPv6('::ffff:192.0.2.128')).toBe(true);

    expect(expandIPv6('2001:db8::1')).toEqual([
      '2001',
      '0db8',
      '0000',
      '0000',
      '0000',
      '0000',
      '0000',
      '0001',
    ]);
  });

  it('rejects timestamps, MAC addresses, and malformed IPv6', () => {
    expect(isValidIPv6('10:25:47')).toBe(false);
    expect(isValidIPv6('00:1A:2B:3C:4D:5E')).toBe(false);
    expect(isValidIPv6('::')).toBe(false);
    expect(isValidIPv6('2001::db8::1')).toBe(false);
    expect(isValidIPv6('2001:db8:::1')).toBe(false);
    expect(isValidIPv6('2001:db8::gggg')).toBe(false);
  });
});
