import type { DetectionMatch, DetectionOptions, PiiType } from './types';
import { isValidIPv4, isValidIPv6, isValidLuhn, isValidVerhoeff } from './validators';

const PRIORITY: Record<PiiType, number> = {
  email: 6,
  card: 5,
  aadhaar: 4,
  pan: 3,
  ip: 2,
  phone: 1,
};

const EMAIL_RE =
  /(?<![A-Za-z0-9._%+\-@])[A-Za-z0-9_%+\-]+(?:\.[A-Za-z0-9_%+\-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9\-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}(?![A-Za-z0-9_%+\-@]|\.[A-Za-z0-9_\-])/g;

const PAN_RE =
  /(?<![A-Za-z0-9_])[A-Za-z]{3}[ABCFGHLJPTabcfghljpt][A-Za-z]\d{4}[A-Za-z](?![A-Za-z0-9_])/g;

const AADHAAR_RE =
  /(?<![A-Za-z0-9_+.\-])(?:[2-9]\d{11}|(?<!\d )[2-9]\d{3} \d{4} \d{4}(?! \d)|[2-9]\d{3}-\d{4}-\d{4})(?![A-Za-z0-9_+\-]|\.[A-Za-z0-9_])/g;

const AADHAAR_ANY_PREFIX_RE =
  /(?<![A-Za-z0-9_+.\-])(?:\d{12}|(?<!\d )\d{4} \d{4} \d{4}(?! \d)|\d{4}-\d{4}-\d{4})(?![A-Za-z0-9_+\-]|\.[A-Za-z0-9_])/g;

const CARD_CANDIDATE_RE =
  /(?<![A-Za-z0-9_+.\-@])(?:\d{13,19}|\d{2,}(?: \d{2,})+|\d{2,}(?:-\d{2,})+)(?![A-Za-z0-9_+\-@]|[ \-]\d|\.\d)/g;

const IPV4_CANDIDATE_RE =
  /(?<![A-Za-z0-9_.])(?:\d{1,3}\.){3}\d{1,3}(?![A-Za-z0-9_]|\.[A-Za-z0-9_])/g;

const IPV6_CANDIDATE_RE =
  /(?<![A-Za-z0-9_:])[0-9A-Fa-f:]*:[0-9A-Fa-f:]+(?:\.\d{1,3}){0,3}(?![A-Za-z0-9_:]|\.[A-Za-z0-9_])/g;

const INDIAN_MOBILE_RE =
  /(?<![A-Za-z0-9_+.\-]|\d[ \-])(?:(?:\+91|0)[ \-]?)?[6-9](?:[ \-]?\d){9}(?![A-Za-z0-9_+\-]|[ \-]\d|\.\d)/g;

const INTL_PHONE_RE =
  /(?<![A-Za-z0-9_+.\-])\+[1-9]\d{0,2}(?:[ \-]?\(\d{1,4}\)|[ \-]?\d+){1,6}(?![A-Za-z0-9_+\-]|[ \-]\d|\.\d)/g;

interface Span {
  start: number;
  end: number;
}

function overlaps(a: Span, b: Span): boolean {
  return a.start < b.end && a.end > b.start;
}

function collectRegexMatches(
  text: string,
  regex: RegExp,
  type: PiiType,
  predicate?: (value: string) => boolean
): DetectionMatch[] {
  regex.lastIndex = 0;
  const results: DetectionMatch[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const value = match[0];
    if (!predicate || predicate(value)) {
      results.push({
        type,
        value,
        start: match.index,
        end: match.index + value.length,
      });
    }
  }

  return results;
}

function partitionCardCandidates(text: string): {
  validCards: DetectionMatch[];
  invalidLuhnSpans: Span[];
} {
  CARD_CANDIDATE_RE.lastIndex = 0;
  const validCards: DetectionMatch[] = [];
  const invalidLuhnSpans: Span[] = [];
  let match: RegExpExecArray | null;

  while ((match = CARD_CANDIDATE_RE.exec(text)) !== null) {
    const value = match[0];
    const digits = value.replace(/[\s-]/g, '');
    if (digits.length < 13 || digits.length > 19) {
      continue;
    }

    const start = match.index;
    const end = start + value.length;

    if (isValidLuhn(digits)) {
      validCards.push({ type: 'card', value, start, end });
    } else {
      invalidLuhnSpans.push({ start, end });
    }
  }

  return { validCards, invalidLuhnSpans };
}

export function detectEmails(text: string): DetectionMatch[] {
  return collectRegexMatches(text, EMAIL_RE, 'email');
}

export function detectPANs(text: string): DetectionMatch[] {
  return collectRegexMatches(text, PAN_RE, 'pan');
}

export function detectAadhaars(
  text: string,
  options?: { strictAadhaar?: boolean; allowInvalidAadhaarPrefix?: boolean }
): DetectionMatch[] {
  const strict = Boolean(options?.strictAadhaar);
  const regex = options?.allowInvalidAadhaarPrefix
    ? AADHAAR_ANY_PREFIX_RE
    : AADHAAR_RE;
  return collectRegexMatches(text, regex, 'aadhaar', (value) =>
    strict ? isValidVerhoeff(value) : true
  );
}

/**
 * Finds 12-digit Aadhaar-shaped sequences starting with 0 or 1 so the UI can
 * explain why official UIDAI rules (2-9 first digit) skipped them.
 */
export function findSkippedAadhaarPrefixCandidates(text: string): string[] {
  if (!text) return [];
  AADHAAR_ANY_PREFIX_RE.lastIndex = 0;
  const skipped: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = AADHAAR_ANY_PREFIX_RE.exec(text)) !== null) {
    const val = match[0];
    if (val[0] === '0' || val[0] === '1') {
      skipped.push(val);
    }
  }
  return Array.from(new Set(skipped));
}

export function detectCards(text: string): DetectionMatch[] {
  return partitionCardCandidates(text).validCards;
}

export function detectIPs(text: string): DetectionMatch[] {
  const ipv4 = collectRegexMatches(text, IPV4_CANDIDATE_RE, 'ip', isValidIPv4);
  const ipv6 = collectRegexMatches(text, IPV6_CANDIDATE_RE, 'ip', isValidIPv6);

  // Merge IPv4 and IPv6 preferring longer match (e.g., IPv4-mapped IPv6 over embedded IPv4).
  const combined = [...ipv6, ...ipv4].sort((a, b) => {
    const lenDiff = b.end - b.start - (a.end - a.start);
    return lenDiff !== 0 ? lenDiff : a.start - b.start;
  });

  const accepted: DetectionMatch[] = [];
  for (const item of combined) {
    if (!accepted.some((existing) => overlaps(existing, item))) {
      accepted.push(item);
    }
  }

  return accepted.sort((a, b) => a.start - b.start);
}

export function detectPhones(text: string): DetectionMatch[] {
  const indian = collectRegexMatches(text, INDIAN_MOBILE_RE, 'phone');
  const intl = collectRegexMatches(text, INTL_PHONE_RE, 'phone', (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) {
      return false;
    }
    const openParens = (value.match(/\(/g) ?? []).length;
    const closeParens = (value.match(/\)/g) ?? []).length;
    return openParens === closeParens;
  });

  const combined = [...indian, ...intl].sort((a, b) => {
    const lenDiff = b.end - b.start - (a.end - a.start);
    return lenDiff !== 0 ? lenDiff : a.start - b.start;
  });

  const accepted: DetectionMatch[] = [];
  for (const item of combined) {
    if (!accepted.some((existing) => overlaps(existing, item))) {
      accepted.push(item);
    }
  }

  return accepted.sort((a, b) => a.start - b.start);
}

/**
 * Runs all enabled PII detectors, enforces failed-Luhn exclusion,
 * and resolves overlaps by priority: email > card > aadhaar > pan > ip > phone.
 */
export function detectAll(
  text: string,
  options: DetectionOptions = {}
): DetectionMatch[] {
  if (!text) {
    return [];
  }

  const isEnabled = (type: PiiType): boolean =>
    options.enabledTypes?.[type] !== false;

  const { validCards, invalidLuhnSpans } = partitionCardCandidates(text);

  const candidates: DetectionMatch[] = [];

  if (isEnabled('email')) {
    candidates.push(...detectEmails(text));
  }
  if (isEnabled('card')) {
    candidates.push(...validCards);
  }
  if (isEnabled('aadhaar')) {
    candidates.push(
      ...detectAadhaars(text, {
        strictAadhaar: options.strictAadhaar,
        allowInvalidAadhaarPrefix: options.allowInvalidAadhaarPrefix,
      })
    );
  }
  if (isEnabled('pan')) {
    candidates.push(...detectPANs(text));
  }
  if (isEnabled('ip')) {
    candidates.push(...detectIPs(text));
  }
  if (isEnabled('phone')) {
    candidates.push(...detectPhones(text));
  }

  // Failed-Luhn card candidates must never be flagged as a card or any other type.
  const filtered = candidates.filter((match) => {
    if (match.type === 'email') {
      return true;
    }
    return !invalidLuhnSpans.some((blocked) => overlaps(match, blocked));
  });

  filtered.sort((a, b) => {
    const prioDiff = PRIORITY[b.type] - PRIORITY[a.type];
    if (prioDiff !== 0) {
      return prioDiff;
    }
    const lenDiff = b.end - b.start - (a.end - a.start);
    if (lenDiff !== 0) {
      return lenDiff;
    }
    return a.start - b.start;
  });

  const accepted: DetectionMatch[] = [];
  for (const candidate of filtered) {
    if (!accepted.some((existing) => overlaps(existing, candidate))) {
      accepted.push(candidate);
    }
  }

  return accepted.sort((a, b) => a.start - b.start);
}
