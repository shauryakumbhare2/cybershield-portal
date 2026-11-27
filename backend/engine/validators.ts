/**
 * Luhn checksum validation for credit/debit card numbers (13-19 digits).
 */
export function isValidLuhn(input: string): boolean {
  const digits = input.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits.charCodeAt(i) - 48;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

const VERHOEFF_D: readonly (readonly number[])[] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P: readonly (readonly number[])[] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

/**
 * Verhoeff checksum validation used by Aadhaar numbers.
 */
export function isValidVerhoeff(input: string): boolean {
  const digits = input.replace(/[\s-]/g, '');
  if (!/^\d+$/.test(digits) || digits.length === 0) {
    return false;
  }

  let c = 0;
  for (let i = 0; i < digits.length; i++) {
    const digit = digits.charCodeAt(digits.length - 1 - i) - 48;
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digit]];
  }

  return c === 0;
}

/**
 * Strict IPv4 validation (each octet 0-255, no leading zeros).
 */
export function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) {
    return false;
  }

  for (const part of parts) {
    if (!/^(?:0|[1-9]\d{0,2})$/.test(part)) {
      return false;
    }
    const num = Number(part);
    if (num < 0 || num > 255) {
      return false;
    }
  }

  return true;
}

const HEX_GROUP_RE = /^[0-9a-fA-F]{1,4}$/;

/**
 * Expands a valid IPv6 address (including compressed `::` and IPv4-mapped forms)
 * into 8 lowercase 4-hex-digit groups, or returns null if invalid.
 */
export function expandIPv6(ip: string): string[] | null {
  if (!ip.includes(':') || ip.includes(':::')) {
    return null;
  }

  const doubleColonParts = ip.split('::');
  if (doubleColonParts.length > 2) {
    return null;
  }

  const parseSide = (side: string, allowIpv4Tail: boolean): string[] | null => {
    if (side === '') {
      return [];
    }
    const rawGroups = side.split(':');
    const out: string[] = [];

    for (let i = 0; i < rawGroups.length; i++) {
      const grp = rawGroups[i];
      if (grp.includes('.')) {
        if (!allowIpv4Tail || i !== rawGroups.length - 1 || !isValidIPv4(grp)) {
          return null;
        }
        const octets = grp.split('.').map(Number);
        const hi = ((octets[0] << 8) | octets[1]).toString(16).padStart(4, '0');
        const lo = ((octets[2] << 8) | octets[3]).toString(16).padStart(4, '0');
        out.push(hi, lo);
      } else if (HEX_GROUP_RE.test(grp)) {
        out.push(grp.toLowerCase().padStart(4, '0'));
      } else {
        return null;
      }
    }

    return out;
  };

  if (doubleColonParts.length === 2) {
    const left = parseSide(doubleColonParts[0], false);
    const right = parseSide(doubleColonParts[1], true);
    if (!left || !right) {
      return null;
    }
    const totalPresent = left.length + right.length;
    // Require at least one non-empty group so bare "::" in prose/code is not flagged.
    if (totalPresent < 1 || totalPresent >= 8) {
      return null;
    }
    const zeros = new Array<string>(8 - totalPresent).fill('0000');
    return [...left, ...zeros, ...right];
  }

  const full = parseSide(ip, true);
  if (!full || full.length !== 8) {
    return null;
  }
  return full;
}

/**
 * Validates an IPv6 address (full, compressed, or IPv4-mapped).
 */
export function isValidIPv6(ip: string): boolean {
  return expandIPv6(ip) !== null;
}
