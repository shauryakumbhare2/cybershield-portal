import type {
  DetectionMatch,
  PiiType,
  RedactionMode,
  RedactionResult,
  RedactionSpan,
  SummaryStats,
} from './types';
import { expandIPv6, isValidIPv4 } from './validators';

const PSEUDONYM_PREFIX: Record<PiiType, string> = {
  email: 'USER',
  phone: 'PHONE',
  ip: 'IP',
  pan: 'PAN',
  aadhaar: 'AADHAAR',
  card: 'CARD',
};

/**
 * Normalizes detected values so equivalent representations map to the same
 * pseudonym and count as a single unique value in the summary.
 */
export function normalizePiiValue(type: PiiType, value: string): string {
  switch (type) {
    case 'email':
    case 'pan':
      return value.trim().toLowerCase();

    case 'aadhaar':
    case 'card':
      return value.replace(/[\s-]/g, '');

    case 'ip': {
      const trimmed = value.trim();
      if (isValidIPv4(trimmed)) {
        return trimmed;
      }
      const expanded = expandIPv6(trimmed);
      return expanded ? expanded.join(':') : trimmed.toLowerCase();
    }

    case 'phone': {
      const trimmed = value.trim();
      const digits = trimmed.replace(/\D/g, '');
      // Indian mobile canonicalization: +91XXXXXXXXXX, 0XXXXXXXXXX, and XXXXXXXXXX
      // (where X starts with 6-9) all map to the same 10-digit Indian mobile key.
      if (digits.length === 10 && /^[6-9]/.test(digits)) {
        return `in:${digits}`;
      }
      if (digits.length === 11 && /^0[6-9]/.test(digits)) {
        return `in:${digits.slice(1)}`;
      }
      if (
        trimmed.startsWith('+91') &&
        digits.length === 12 &&
        /^91[6-9]/.test(digits)
      ) {
        return `in:${digits.slice(2)}`;
      }
      return `intl:${digits}`;
    }
  }
}

function maskPartial(type: PiiType, value: string): string {
  switch (type) {
    case 'email': {
      const atIdx = value.indexOf('@');
      if (atIdx <= 0) {
        return '[REDACTED]';
      }
      const local = value.slice(0, atIdx);
      const domain = value.slice(atIdx + 1);
      return `${local[0]}***@${domain}`;
    }

    case 'phone': {
      const digits = value.replace(/\D/g, '');
      return `XXXXXX${digits.slice(-4)}`;
    }

    case 'ip': {
      if (isValidIPv4(value)) {
        const octets = value.split('.');
        return `${octets[0]}.${octets[1]}.XXX.XXX`;
      }
      const expanded = expandIPv6(value);
      if (expanded) {
        // Keep the first two groups from the original if present before "::",
        // otherwise use the first two expanded groups.
        const beforeDoubleColon = value.split('::')[0];
        const rawFirstGroups = beforeDoubleColon
          ? beforeDoubleColon.split(':').filter(Boolean)
          : [];
        const g1 = rawFirstGroups[0] ?? expanded[0];
        const g2 = rawFirstGroups[1] ?? expanded[1];
        return `${g1}:${g2}:XXXX:XXXX:XXXX:XXXX:XXXX:XXXX`;
      }
      return '[REDACTED]';
    }

    case 'pan': {
      return `XXXXXX${value.slice(-4)}`;
    }

    case 'aadhaar': {
      const digits = value.replace(/[\s-]/g, '');
      return `XXXX-XXXX-${digits.slice(-4)}`;
    }

    case 'card': {
      const digits = value.replace(/[\s-]/g, '');
      return `XXXX-XXXX-XXXX-${digits.slice(-4)}`;
    }
  }
}

function createEmptyCountRecord(): Record<PiiType, number> {
  return {
    email: 0,
    phone: 0,
    ip: 0,
    pan: 0,
    aadhaar: 0,
    card: 0,
  };
}

/**
 * Applies the selected redaction mode to sorted, non-overlapping detections.
 * Resets pseudonym counters on every call (per document).
 */
export function redactText(
  text: string,
  detections: DetectionMatch[],
  mode: RedactionMode
): RedactionResult {
  const sorted = [...detections].sort((a, b) => a.start - b.start);

  const pseudonymMaps: Record<PiiType, Map<string, string>> = {
    email: new Map(),
    phone: new Map(),
    ip: new Map(),
    pan: new Map(),
    aadhaar: new Map(),
    card: new Map(),
  };

  const countByType = createEmptyCountRecord();
  const uniqueSets: Record<PiiType, Set<string>> = {
    email: new Set(),
    phone: new Set(),
    ip: new Set(),
    pan: new Set(),
    aadhaar: new Set(),
    card: new Set(),
  };

  const parts: string[] = [];
  const spans: RedactionSpan[] = [];
  let cursor = 0;
  let sanitizedLength = 0;

  for (const match of sorted) {
    if (match.start < cursor) {
      // Defensive guard against overlapping inputs.
      continue;
    }

    const prefix = text.slice(cursor, match.start);
    parts.push(prefix);
    sanitizedLength += prefix.length;

    const normalizedKey = normalizePiiValue(match.type, match.value);
    countByType[match.type] += 1;
    uniqueSets[match.type].add(normalizedKey);

    let replacement: string;
    if (mode === 'full') {
      replacement = '[REDACTED]';
    } else if (mode === 'partial') {
      replacement = maskPartial(match.type, match.value);
    } else {
      const typeMap = pseudonymMaps[match.type];
      const existing = typeMap.get(normalizedKey);
      if (existing) {
        replacement = existing;
      } else {
        const index = String(typeMap.size + 1).padStart(2, '0');
        replacement = `${PSEUDONYM_PREFIX[match.type]}_${index}`;
        typeMap.set(normalizedKey, replacement);
      }
    }

    const sanitizedStart = sanitizedLength;
    parts.push(replacement);
    sanitizedLength += replacement.length;
    const sanitizedEnd = sanitizedLength;

    spans.push({
      type: match.type,
      originalValue: match.value,
      redactedValue: replacement,
      originalStart: match.start,
      originalEnd: match.end,
      sanitizedStart,
      sanitizedEnd,
      normalizedKey,
    });

    cursor = match.end;
  }

  const tail = text.slice(cursor);
  parts.push(tail);

  const uniqueByType = createEmptyCountRecord();
  let uniqueValues = 0;
  (Object.keys(uniqueSets) as PiiType[]).forEach((t) => {
    uniqueByType[t] = uniqueSets[t].size;
    uniqueValues += uniqueSets[t].size;
  });

  const summary: SummaryStats = {
    totalDetections: spans.length,
    uniqueValues,
    countByType,
    uniqueByType,
  };

  return {
    sanitizedText: parts.join(''),
    spans,
    summary,
  };
}
