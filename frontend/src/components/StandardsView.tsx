import { ALL_PII_TYPES } from '@backend/engine/types';
import { PII_TYPE_META } from './piiMeta';

const DETECTION_SPECS = [
  {
    type: 'email' as const,
    priority: '1 (Highest)',
    standard: 'RFC 5322-aligned local & domain labels',
    rule: 'Matches standard addresses, multi-level subdomains, and plus-addressing (e.g., alice+tag@sub.example.com). Rejects consecutive dots, invalid hyphens, and missing TLDs.',
    partialExample: 'j***@example.com',
    pseudonymExample: 'USER_01',
  },
  {
    type: 'card' as const,
    priority: '2',
    standard: 'ISO/IEC 7812 (Luhn Mod-10)',
    rule: 'Matches 13–19 digits (plain, spaced, or hyphenated) that pass Luhn. Numbers failing Luhn are blocked so no sub-span can match Aadhaar or phone.',
    partialExample: 'XXXX-XXXX-XXXX-1234',
    pseudonymExample: 'CARD_01',
  },
  {
    type: 'aadhaar' as const,
    priority: '3',
    standard: '12-Digit UID + Optional Verhoeff',
    rule: 'Matches 12 digits starting with 2–9 (plain or 4-4-4 with spaces/hyphens). Enable Strict Aadhaar to enforce the Verhoeff checksum.',
    partialExample: 'XXXX-XXXX-1234',
    pseudonymExample: 'AADHAAR_01',
  },
  {
    type: 'pan' as const,
    priority: '4',
    standard: '10-Char Alphanumeric PAN',
    rule: 'Matches 5 letters, 4 digits, 1 letter (case-insensitive); 4th character must be one of A, B, C, F, G, H, J, L, P, T.',
    partialExample: 'XXXXXX234F',
    pseudonymExample: 'PAN_01',
  },
  {
    type: 'ip' as const,
    priority: '5',
    standard: 'IPv4 (0–255) & RFC 4291 IPv6',
    rule: 'Strict octet validation for IPv4 (no leading zeros, rejects >255) and full, compressed (::), loopback (::1), and IPv4-mapped IPv6.',
    partialExample: '192.168.XXX.XXX / 2001:db8:XXXX:...',
    pseudonymExample: 'IP_01',
  },
  {
    type: 'phone' as const,
    priority: '6',
    standard: 'Indian Mobile & E.164 International',
    rule: 'Matches Indian mobiles (optional +91 or 0, starting 6–9, plain/spaced/hyphenated) and international + country code numbers (7–15 digits).',
    partialExample: 'XXXXXX1234',
    pseudonymExample: 'PHONE_01',
  },
];

export function StandardsView() {
  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-xl border border-slate-200/90 bg-white/92 p-5 shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700/70 dark:bg-[#0B172A]/90 dark:shadow-black/30 sm:p-6">
        <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
          <span className="rounded bg-[#0B1F3A] px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-white dark:bg-sky-950 dark:text-sky-300">
            SPECIFICATION · STD-PII-01
          </span>
          <h2 className="mt-2 text-lg font-bold text-[#0B1F3A] dark:text-white">
            PII Classification, Priority &amp; Masking Standards
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            All detectors execute as pure, deterministic TypeScript functions
            inside an isolated Web Worker. Overlaps are resolved strictly by
            priority order (
            <code className="font-mono">
              {ALL_PII_TYPES.join(' > ')}
            </code>
            ), ensuring no span is ever redacted twice.
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <th className="px-3 py-2.5">Class</th>
                <th className="px-3 py-2.5">Priority</th>
                <th className="px-3 py-2.5">Standard / Checksum</th>
                <th className="px-3 py-2.5">Detection &amp; Boundary Rule</th>
                <th className="px-3 py-2.5">Partial Mask</th>
                <th className="px-3 py-2.5">Pseudonym</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {DETECTION_SPECS.map((spec) => {
                const meta = PII_TYPE_META[spec.type];
                return (
                  <tr
                    key={spec.type}
                    className="align-top hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold ${meta.badgeClass}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`}
                          aria-hidden="true"
                        />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {spec.priority}
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {spec.standard}
                    </td>
                    <td className="px-3 py-3 leading-relaxed text-slate-600 dark:text-slate-400">
                      {spec.rule}
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {spec.partialExample}
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] font-semibold text-slate-900 dark:text-slate-100">
                      {spec.pseudonymExample}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200/90 bg-white/92 p-5 shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700/70 dark:bg-[#0B172A]/90 dark:shadow-black/30 sm:p-6">
        <h3 className="text-sm font-bold text-[#0B1F3A] dark:text-white">
          Normalization Rules for Consistent Pseudonymization
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Case-Insensitive Identifiers
            </p>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Emails and PAN identifiers are trimmed and lowercased so{' '}
              <code className="font-mono">Alice@Example.com</code> and{' '}
              <code className="font-mono">alice@example.com</code> share{' '}
              <code className="font-mono">USER_01</code>.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Indian Telecom Canonicalization
            </p>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Separators are stripped and <code className="font-mono">+91</code>{' '}
              / <code className="font-mono">0</code> prefixes are normalized to
              the same 10-digit Indian mobile entity.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Per-Document Reset &amp; Ordering
            </p>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Placeholders increment in order of first appearance (
              <code className="font-mono">_01</code>,{' '}
              <code className="font-mono">_02</code>, …) and reset cleanly for
              every document.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
