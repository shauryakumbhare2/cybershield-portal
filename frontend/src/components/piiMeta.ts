import type { PiiType, RedactionMode } from '@backend/engine/types';

export interface PiiTypeMeta {
  type: PiiType;
  label: string;
  shortTag: string;
  description: string;
  badgeClass: string;
  highlightClass: string;
  dotClass: string;
}

export const PII_TYPE_META: Record<PiiType, PiiTypeMeta> = {
  email: {
    type: 'email',
    label: 'Email',
    shortTag: 'EMAIL',
    description: 'Standard addresses, subdomains & plus-addressing',
    badgeClass:
      'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/70 dark:text-sky-200 dark:border-sky-700',
    highlightClass:
      'bg-sky-100/90 text-sky-950 ring-1 ring-sky-300 dark:bg-sky-900/50 dark:text-sky-100 dark:ring-sky-600/70',
    dotClass: 'bg-sky-500',
  },
  card: {
    type: 'card',
    label: 'Credit Card',
    shortTag: 'CARD',
    description: '13–19 digits passing Luhn checksum',
    badgeClass:
      'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/70 dark:text-cyan-200 dark:border-cyan-700',
    highlightClass:
      'bg-cyan-100/90 text-cyan-950 ring-1 ring-cyan-300 dark:bg-cyan-900/50 dark:text-cyan-100 dark:ring-cyan-600/70',
    dotClass: 'bg-cyan-500',
  },
  aadhaar: {
    type: 'aadhaar',
    label: 'Aadhaar',
    shortTag: 'AADHAAR',
    description: '12 digits starting 2–9 (plain or 4-4-4)',
    badgeClass:
      'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-700',
    highlightClass:
      'bg-rose-100/90 text-rose-950 ring-1 ring-rose-300 dark:bg-rose-900/50 dark:text-rose-100 dark:ring-rose-600/70',
    dotClass: 'bg-rose-500',
  },
  pan: {
    type: 'pan',
    label: 'PAN',
    shortTag: 'PAN',
    description: '5 letters + 4 digits + 1 letter (4th in A,B,C,F,G,H,J,L,P,T)',
    badgeClass:
      'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700',
    highlightClass:
      'bg-amber-100/90 text-amber-950 ring-1 ring-amber-300 dark:bg-amber-900/50 dark:text-amber-100 dark:ring-amber-600/70',
    dotClass: 'bg-amber-500',
  },
  ip: {
    type: 'ip',
    label: 'IP Address',
    shortTag: 'IP',
    description: 'IPv4 (0–255) & IPv6 including compressed forms',
    badgeClass:
      'bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-950/70 dark:text-violet-200 dark:border-violet-700',
    highlightClass:
      'bg-violet-100/90 text-violet-950 ring-1 ring-violet-300 dark:bg-violet-900/50 dark:text-violet-100 dark:ring-violet-600/70',
    dotClass: 'bg-violet-500',
  },
  phone: {
    type: 'phone',
    label: 'Phone',
    shortTag: 'PHONE',
    description: 'Indian mobiles (+91 / 0 / 6–9) & international + codes',
    badgeClass:
      'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-700',
    highlightClass:
      'bg-emerald-100/90 text-emerald-950 ring-1 ring-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-100 dark:ring-emerald-600/70',
    dotClass: 'bg-emerald-500',
  },
};

export const REDACTION_MODES: {
  id: RedactionMode;
  label: string;
  example: string;
  description: string;
}[] = [
  {
    id: 'full',
    label: 'Full Mask',
    example: '[REDACTED]',
    description: 'Replaces every matched span with [REDACTED]',
  },
  {
    id: 'partial',
    label: 'Partial Mask',
    example: 'j***@example.com · XXXX-1234',
    description: 'Preserves minimal non-sensitive suffix/domain hints',
  },
  {
    id: 'pseudonym',
    label: 'Consistent Pseudonym',
    example: 'USER_01 · PHONE_01',
    description: 'Maps normalized repeated values to stable tokens',
  },
];
