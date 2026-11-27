import { AlertTriangle, ShieldCheck } from 'lucide-react';
import type { PortalTab } from './Header';

interface FooterProps {
  onNavigate?: (tab: PortalTab) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="mt-4 border-t border-slate-200/80 bg-[#0A1F44] text-slate-200 dark:border-slate-800 dark:bg-[#050A14]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2">
              <ShieldCheck
                className="h-4 w-4 text-emerald-400"
                aria-hidden="true"
              />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Civic Cyber &amp; Data Privacy Portal
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              Built for students, small businesses, and general users. All PII
              sanitization, password checks, quizzes, and checklists execute
              locally in volatile browser memory with{' '}
              <code className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[11px] text-sky-300">
                connect-src &apos;none&apos;
              </code>
              .
            </p>
            {onNavigate && (
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-semibold text-sky-300">
                <button
                  type="button"
                  onClick={() => onNavigate('legal')}
                  className="hover:underline"
                >
                  Privacy Notice &amp; Data Rights
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('articles')}
                  className="hover:underline"
                >
                  Awareness Articles
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('checklist')}
                  className="hover:underline"
                >
                  Privacy Checklist
                </button>
              </div>
            )}
          </div>

          <div className="md:col-span-7">
            <div className="rounded-xl border border-amber-400/30 bg-amber-950/30 p-3.5 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-300"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-semibold text-amber-200">
                    Privacy &amp; Compliance Advisory (Known Limitations)
                  </p>
                  <p className="mt-1 leading-relaxed text-slate-300">
                    Pattern matching and checksums detect structured identifiers
                    (Email, Phone, IPv4/IPv6, PAN, Aadhaar, Credit Card) and
                    cannot catch unstructured PII such as person names or street
                    addresses. Always inspect the Side-by-Side Audit View before
                    sharing sanitized records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-700/70 pt-4 text-[11px] text-slate-400">
          <span>
            Standards: WCAG 2.2 AA · OWASP Top 10 · ISO/IEC 7812 (Luhn) ·
            Verhoeff · RFC 4291
          </span>
          <span className="font-mono">
            Storage: None (RAM only) · Trackers: None · Network: Blocked
          </span>
        </div>
      </div>
    </footer>
  );
}
