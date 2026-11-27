import { describe, expect, it } from 'vitest';
import {
  DEMO_ACCOUNT,
  isRateLimited,
  verifyLocalCredentials,
  verifyLocalMfaCode,
} from '../../backend/engine/localAuth';

describe('localAuth', () => {
  it('accepts valid demo credentials and rejects wrong password or malformed email', async () => {
    const okRes = await verifyLocalCredentials(
      DEMO_ACCOUNT.email,
      DEMO_ACCOUNT.passcode
    );
    expect(okRes.ok).toBe(true);

    const badPass = await verifyLocalCredentials(
      DEMO_ACCOUNT.email,
      'WrongPass123!'
    );
    expect(badPass.ok).toBe(false);

    const badEmail = await verifyLocalCredentials('not-an-email', 'CyberShield#2026');
    expect(badEmail.ok).toBe(false);
  });

  it('verifies 6-digit MFA code and rate-limit lockout window', () => {
    expect(verifyLocalMfaCode(DEMO_ACCOUNT.mfaCode)).toBe(true);
    expect(verifyLocalMfaCode('000000')).toBe(false);

    const now = 1_000_000;
    expect(isRateLimited(now + 5000, now)).toBe(true);
    expect(isRateLimited(now - 100, now)).toBe(false);
    expect(isRateLimited(null, now)).toBe(false);
  });
});
