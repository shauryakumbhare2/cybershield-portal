export type PiiType = 'email' | 'phone' | 'ip' | 'pan' | 'aadhaar' | 'card';

export const ALL_PII_TYPES: readonly PiiType[] = [
  'email',
  'card',
  'aadhaar',
  'pan',
  'ip',
  'phone',
] as const;

export interface DetectionMatch {
  type: PiiType;
  value: string;
  start: number;
  end: number;
}

export interface DetectionOptions {
  strictAadhaar?: boolean;
  allowInvalidAadhaarPrefix?: boolean;
  enabledTypes?: Partial<Record<PiiType, boolean>>;
}

export type RedactionMode = 'full' | 'partial' | 'pseudonym';

export interface RedactionSpan {
  type: PiiType;
  originalValue: string;
  redactedValue: string;
  originalStart: number;
  originalEnd: number;
  sanitizedStart: number;
  sanitizedEnd: number;
  normalizedKey: string;
}

export interface SummaryStats {
  totalDetections: number;
  uniqueValues: number;
  countByType: Record<PiiType, number>;
  uniqueByType: Record<PiiType, number>;
}

export interface RedactionResult {
  sanitizedText: string;
  spans: RedactionSpan[];
  summary: SummaryStats;
}
