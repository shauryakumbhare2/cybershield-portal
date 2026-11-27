import { detectAll } from './detectors';
import { analyzePasswordStrength } from './passwordStrength';
import type { PiiType, RedactionMode, SummaryStats } from './types';
import { isValidIPv4, isValidIPv6, isValidLuhn, isValidVerhoeff } from './validators';

export interface AssistantContext {
  hasDocument: boolean;
  summary: SummaryStats;
  mode: RedactionMode;
  strictAadhaar: boolean;
  enabledTypes: Record<PiiType, boolean>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const MODE_LABELS: Record<RedactionMode, string> = {
  full: 'Full Mask ([REDACTED])',
  partial: 'Partial Mask (e.g. j***@example.com, XXXX-1234)',
  pseudonym: 'Consistent Pseudonymization (USER_01, PHONE_01, etc.)',
};

/**
 * Deterministic, 100% offline client-side Security & Privacy Assistant.
 * Uses the local PII detection, Luhn, Verhoeff, IP, and password engines
 * to answer user queries without making any network requests.
 */
export function generateLocalAssistantReply(
  rawQuery: string,
  context: AssistantContext
): string {
  const query = rawQuery.trim();
  const lower = query.toLowerCase();

  if (!query) {
    return 'Please enter a cybersecurity, PII redaction, or data privacy question to discuss.';
  }

  // 1. Check if the user pasted a specific card/Aadhaar/IP candidate to diagnose
  const cardMatch = query.match(/\b\d[\d -]{11,22}\d\b/);
  if (
    cardMatch &&
    (lower.includes('why') ||
      lower.includes('card') ||
      lower.includes('luhn') ||
      lower.includes('aadhaar') ||
      lower.includes('verhoeff') ||
      lower.includes('flag') ||
      lower.includes('detect'))
  ) {
    const candidate = cardMatch[0];
    const digits = candidate.replace(/[\s-]/g, '');
    if (digits.length >= 13 && digits.length <= 19) {
      const luhnOk = isValidLuhn(digits);
      if (!luhnOk) {
        return `Diagnostic for "${candidate}" (${digits.length} digits): It FAILS the ISO/IEC 7812 Luhn checksum. Per the accuracy rules, any 13–19 digit card-shaped number failing Luhn is excluded from Credit Card detection AND blocked so no sub-part of it can be falsely flagged as Aadhaar or Phone.`;
      }
      return `Diagnostic for "${candidate}" (${digits.length} digits): It PASSES the Luhn checksum, so it is classified as a valid Credit Card (priority 2, above Aadhaar/PAN/IP/Phone).`;
    }
    if (digits.length === 12) {
      if (!/^[2-9]/.test(digits)) {
        return `Diagnostic for "${candidate}" (12 digits starting with "${digits[0]}"): Official UIDAI Aadhaar numbers always start with digits 2–9 (never 0 or 1), so it is skipped by default. Try a 2–9 prefix (e.g., 2452-4845-8656 or 2345-6789-0124), or enable "Allow 0/1 test prefixes" in the Policy panel.`;
      }
      const verhoeffOk = isValidVerhoeff(digits);
      return `Diagnostic for "${candidate}" (12 digits starting ${digits[0]}): Matches Aadhaar format. Verhoeff checksum result: ${
        verhoeffOk ? 'VALID' : 'INVALID'
      }. With "Strict Aadhaar (Verhoeff checksum)" ${
        context.strictAadhaar ? 'ON' : 'OFF (default)'
      }, it ${
        !context.strictAadhaar || verhoeffOk ? 'IS detected' : 'is NOT detected'
      } as Aadhaar.`;
    }
  }

  // 2. Check IPv4 / IPv6 near-miss diagnostics
  const ipCandidate = query.match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/);
  if (ipCandidate) {
    const ip = ipCandidate[0];
    const valid = isValidIPv4(ip);
    if (!valid) {
      return `Diagnostic for "${ip}": Not a valid IPv4 address. Every octet must be 0–255 without leading zeros (e.g., 999.10.1.1 fails because 999 > 255). Boundary guards also prevent matching a partial substring like 99.10.1.1 inside it.`;
    }
    return `Diagnostic for "${ip}": Valid IPv4 address (all 4 octets within 0–255).`;
  }

  if (lower.includes('ipv6') && query.includes(':')) {
    const tokens = query.split(/\s+/);
    const v6 = tokens.find((t) => t.includes(':') && isValidIPv6(t));
    if (v6) {
      return `Diagnostic: "${v6}" is a valid IPv6 address. In Partial Mask mode, the first two groups are preserved and remaining groups are masked with XXXX; in Pseudonym mode, compressed and expanded forms normalize to the same IP_xx token.`;
    }
  }

  // 3. Evaluate inline "scan:" or "check text:" queries directly using detectAll
  if (lower.startsWith('scan:') || lower.startsWith('check:')) {
    const payload = query.slice(query.indexOf(':') + 1).trim();
    const matches = detectAll(payload, {
      strictAadhaar: context.strictAadhaar,
      enabledTypes: context.enabledTypes,
    });
    if (matches.length === 0) {
      return `Local scan of your snippet found 0 PII matches under current detector settings (Strict Aadhaar: ${
        context.strictAadhaar ? 'ON' : 'OFF'
      }).`;
    }
    const summaryList = matches
      .map((m) => `${m.type.toUpperCase()} (${m.start}..${m.end})`)
      .join(', ');
    return `Local scan detected ${matches.length} item(s): ${summaryList}. All processing stayed inside browser memory.`;
  }

  // 4. Current document scan summary query
  if (
    lower.includes('summary') ||
    lower.includes('scan') ||
    lower.includes('current') ||
    lower.includes('detected') ||
    lower.includes('how many')
  ) {
    if (!context.hasDocument) {
      return `No text or file is currently loaded in the PII Redactor. Click "Load Noisy Sample & Inspect" or paste text / upload a .txt or .csv file (up to 5 MB) to see live counts. Active mode: ${MODE_LABELS[context.mode]}.`;
    }
    const breakdown = (Object.keys(context.summary.countByType) as PiiType[])
      .map((t) => `${t}: ${context.summary.countByType[t]} (${context.summary.uniqueByType[t]} unique)`)
      .join(' | ');
    return `Current Document Summary — Total detections: ${context.summary.totalDetections}, Unique normalized values: ${context.summary.uniqueValues}. Active mode: ${MODE_LABELS[context.mode]}. Breakdown: ${breakdown}.`;
  }

  // 5. Redaction modes & consistent pseudonymization
  if (
    lower.includes('pseudonym') ||
    lower.includes('mode') ||
    lower.includes('partial') ||
    lower.includes('full mask') ||
    lower.includes('normaliz')
  ) {
    return `Three redaction modes update output instantaneously in memory:\n• Full Mask: replaces matches with [REDACTED].\n• Partial Mask: keeps minimal hints (j***@example.com, XXXXXX1234, 192.168.XXX.XXX, XXXXXX234F, XXXX-XXXX-1234).\n• Consistent Pseudonymization: maps normalized values to USER_01, PHONE_01, IP_01, PAN_01, AADHAAR_01, CARD_01 in order of first appearance (lowercasing emails/PAN, stripping separators, and unifying +91 / 0 / bare 10-digit Indian mobiles). Counters reset per document.`;
  }

  // 6. Overlap priority & detection rules
  if (
    lower.includes('priority') ||
    lower.includes('overlap') ||
    lower.includes('pan') ||
    lower.includes('aadhaar') ||
    lower.includes('verhoeff') ||
    lower.includes('luhn')
  ) {
    return `Detection Accuracy Rules:\n• Overlap priority: email > credit card > Aadhaar > PAN > IP > phone (no span is redacted twice).\n• Credit cards (13–19 digits) must pass Luhn; failed-Luhn numbers are blocked so sub-parts cannot match other types.\n• PAN requires 5 letters + 4 digits + 1 letter with the 4th letter in {A, B, C, F, G, H, J, L, P, T}.\n• Aadhaar accepts 12 digits starting 2–9 (plain or 4-4-4), with an optional Strict Verhoeff checksum toggle.`;
  }

  // 7. Password strength & MFA
  if (lower.includes('password') || lower.includes('passphrase') || lower.includes('mfa')) {
    const quoted = query.match(/["']([^"']{3,64})["']/);
    if (quoted) {
      const pwCheck = analyzePasswordStrength(quoted[1]);
      return `Local Password Check: Rating "${pwCheck.label}" (${pwCheck.entropyBits} bits, crack estimate: ${pwCheck.estimatedCrackTime}). Advice: ${pwCheck.feedback.join(' ')}`;
    }
    return `Password & Login Guidance: Use 12+ character random passphrases (try the Password Checker tab's CSPRNG generator), never reuse passwords across sites, and enable app-based MFA or passkeys. Backends that store logins should hash with Argon2id or bcrypt and use HttpOnly; Secure; SameSite cookies.`;
  }

  // 8. Phishing awareness
  if (lower.includes('phish') || lower.includes('scam') || lower.includes('link') || lower.includes('sms')) {
    return `Phishing Defense Tips: Check the exact domain before the first "/" for lookalikes (e.g., micros0ft vs microsoft), distrust artificial 2-hour urgency or fee links, and open banking, university, or payroll portals via your own saved bookmarks. Try the Phishing Quiz tab for 5 realistic practice scenarios.`;
  }

  // 9. Breach response & legal / privacy / CSP
  if (
    lower.includes('breach') ||
    lower.includes('incident') ||
    lower.includes('csp') ||
    lower.includes('privacy') ||
    lower.includes('local') ||
    lower.includes('network') ||
    lower.includes('legal') ||
    lower.includes('limitation')
  ) {
    return `Privacy, Security & Breach Readiness:\n• This portal runs 100% client-side with CSP connect-src 'none', zero trackers, and zero localStorage/cookies/IndexedDB.\n• Known limitation: pattern matching catches structured PII (Email, Phone, IP, PAN, Aadhaar, Card) and cannot detect unstructured names or street addresses—always inspect the Audit View before sharing.\n• 5-Step Breach Plan: (1) Contain & rotate credentials, (2) Assess scope, (3) Preserve logs, (4) Notify users/authorities, (5) Patch & harden.`;
  }

  // 10. Default helpful guide
  return `I'm your 100% offline Privacy & Cybersecurity Assistant (zero external APIs). You can ask me about:\n• Your current PII scan ("Explain my current scan summary")\n• Why an item was/wasn't flagged (e.g., "Why wasn't 4111 1111 1111 1112 flagged?" or "scan: test@example.com")\n• Redaction modes, Luhn/Verhoeff rules, password hygiene, phishing red flags, or breach response steps.`;
}
