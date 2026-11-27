export type UserRole = 'guest' | 'student' | 'business' | 'auditor';

export interface SessionUser {
  email: string;
  role: UserRole;
  mfaVerified: boolean;
  signedInAt: string;
}

export const DEMO_ACCOUNT = {
  email: 'demo@cybershield.local',
  passcode: 'CyberShield#2026',
  mfaCode: '482910',
} as const;

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15_000;

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Pre-computed salted demo hash helper in memory (no hardcoded secrets for real auth;
// strictly for offline client-side demo gate under connect-src 'none').
const DEMO_SALT = 'cybershield-local-ram-salt';

export async function verifyLocalCredentials(
  email: string,
  passcode: string
): Promise<{ ok: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { ok: false, error: 'Enter a valid email address.' };
  }
  if (passcode.length < 8) {
    return {
      ok: false,
      error: 'Passcode must be at least 8 characters.',
    };
  }

  const [expectedHash, providedHash] = await Promise.all([
    sha256Hex(`${DEMO_SALT}:${DEMO_ACCOUNT.email}:${DEMO_ACCOUNT.passcode}`),
    sha256Hex(`${DEMO_SALT}:${normalizedEmail}:${passcode}`),
  ]);

  if (expectedHash !== providedHash) {
    return {
      ok: false,
      error:
        'Invalid demo credentials. Click "Fill Demo Credentials" or use Guest Access.',
    };
  }

  return { ok: true };
}

export function verifyLocalMfaCode(code: string): boolean {
  return code.trim() === DEMO_ACCOUNT.mfaCode;
}

export function isRateLimited(lockedUntilMs: number | null, nowMs = Date.now()): boolean {
  return lockedUntilMs !== null && nowMs < lockedUntilMs;
}
