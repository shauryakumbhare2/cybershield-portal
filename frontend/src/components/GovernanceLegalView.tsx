import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  Lock,
  ServerCog,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { StandardsView } from './StandardsView';

type LegalSubTab = 'standards' | 'security' | 'privacy' | 'maintenance';

interface GovernanceLegalViewProps {
  onPurgeAllSessionData: () => void;
}

export function GovernanceLegalView({
  onPurgeAllSessionData,
}: GovernanceLegalViewProps) {
  const [subTab, setSubTab] = useState<LegalSubTab>('standards');
  const [purged, setPurged] = useState(false);

  const handlePurge = () => {
    onPurgeAllSessionData();
    setPurged(true);
    setTimeout(() => setPurged(false), 3000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sub-navigation bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white/92 px-4 py-3 shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700/70 dark:bg-[#0B172A]/90 dark:shadow-black/30">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'standards' as const, label: 'Detection Standards' },
            { id: 'security' as const, label: 'Security, Auth & Testing' },
            { id: 'privacy' as const, label: 'Privacy Notice & Consent' },
            { id: 'maintenance' as const, label: 'Breach Plan & Maintenance' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                subTab === tab.id
                  ? 'bg-[#0B1F3A] text-white dark:bg-sky-600'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handlePurge}
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
        >
          {purged ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              <span>All Session Memory Cleared</span>
            </>
          ) : (
            <>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Delete / Purge Session Data</span>
            </>
          )}
        </button>
      </div>

      {subTab === 'standards' && <StandardsView />}

      {subTab === 'security' && (
        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-slate-200/90 bg-white/92 p-5 shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700/70 dark:bg-[#0B172A]/90 dark:shadow-black/30 sm:p-6">
            <div className="border-b border-slate-200 pb-3 dark:border-slate-800">
              <span className="rounded bg-[#0B1F3A] px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-white dark:bg-sky-950 dark:text-sky-300">
                SECURITY &amp; TESTING GOVERNANCE
              </span>
              <h2 className="mt-2 text-lg font-bold text-[#0B1F3A] dark:text-white">
                Web Security Headers, Authentication Policy &amp; OWASP Testing
              </h2>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center gap-2 font-bold text-[#0B1F3A] dark:text-white">
                  <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>HTTPS, CSP &amp; Security Headers</span>
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-4 leading-relaxed text-slate-600 dark:text-slate-400">
                  <li>
                    Serve over <strong>HTTPS</strong> with HSTS enabled on static hosts.
                  </li>
                  <li>
                    Enforces <code className="font-mono">Content-Security-Policy</code> with{' '}
                    <code className="font-mono">connect-src &apos;none&apos;</code>,{' '}
                    <code className="font-mono">object-src &apos;none&apos;</code>, and{' '}
                    <code className="font-mono">form-action &apos;none&apos;</code>.
                  </li>
                  <li>
                    Recommended host headers: <code className="font-mono">X-Content-Type-Options: nosniff</code>,{' '}
                    <code className="font-mono">Referrer-Policy: no-referrer</code>,{' '}
                    <code className="font-mono">X-Frame-Options: DENY</code>.
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center gap-2 font-bold text-[#0B1F3A] dark:text-white">
                  <ShieldCheck className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                  <span>Input Validation, Escaping &amp; Rate Limiting</span>
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-4 leading-relaxed text-slate-600 dark:text-slate-400">
                  <li>
                    Uploads strictly validate <code className="font-mono">.txt</code> /{' '}
                    <code className="font-mono">.csv</code> extensions and enforce a 5 MB cap.
                  </li>
                  <li>
                    All user text is escaped by rendering strictly as React text nodes (never{' '}
                    <code className="font-mono">innerHTML</code> or <code className="font-mono">dangerouslySetInnerHTML</code>).
                  </li>
                  <li>
                    Zero backend endpoints exist to brute-force; edge CDN/WAF rate limiting is recommended for public deployments.
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center gap-2 font-bold text-[#0B1F3A] dark:text-white">
                  <ServerCog className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                  <span>Authentication Policy (Not Needed Here)</span>
                </div>
                <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-400">
                  Following data minimization, this portal requires <strong>no login or user accounts</strong>. If an organization forks or extends this platform with authenticated accounts, require{' '}
                  <strong>Argon2id or bcrypt</strong> password hashing, <strong>multi-factor authentication (MFA)</strong>,{' '}
                  <code className="font-mono">HttpOnly; Secure; SameSite=Strict</code> cookies, and <strong>role-based access control (RBAC)</strong>.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center gap-2 font-bold text-[#0B1F3A] dark:text-white">
                  <ClipboardCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>Testing &amp; Verification Standards</span>
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-4 leading-relaxed text-slate-600 dark:text-slate-400">
                  <li>
                    <strong>Unit Testing:</strong> Vitest suite validates all detectors, Luhn, Verhoeff, overlap priority, password analyzer, and face-mask heuristics.
                  </li>
                  <li>
                    <strong>Security &amp; Dependency Audits:</strong> Run <code className="font-mono">npm audit</code>, OWASP Top 10 code review, and OWASP ZAP baseline scan on hosted preview.
                  </li>
                  <li>
                    <strong>Usability &amp; Speed:</strong> Audited against WCAG 2.2 AA (keyboard focus, contrast, landmarks) and Lighthouse Performance/Accessibility.
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      )}

      {subTab === 'privacy' && (
        <section className="rounded-xl border border-slate-200/90 bg-white/92 p-5 shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700/70 dark:bg-[#0B172A]/90 dark:shadow-black/30 sm:p-6">
          <div className="border-b border-slate-200 pb-3 dark:border-slate-800">
            <span className="rounded bg-emerald-700 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-white">
              LEGAL COMPLIANCE · PRIVACY NOTICE
            </span>
            <h2 className="mt-2 text-lg font-bold text-[#0B1F3A] dark:text-white">
              Plain-Language Privacy Notice, Consent &amp; Data Rights
            </h2>
          </div>

          <div className="mt-4 space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <h3 className="font-bold text-[#0B1F3A] dark:text-white">
                1. What Data We Collect (Data Minimization)
              </h3>
              <p className="mt-1">
                <strong>None.</strong> This portal collects zero personal data,
                zero analytics, and zero third-party trackers. Any text,
                passwords, CSV files, or camera frames you inspect remain
                strictly inside your browser&apos;s volatile memory.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <h3 className="font-bold text-[#0B1F3A] dark:text-white">
                2. Clear Consent &amp; Hardware Permissions
              </h3>
              <p className="mt-1">
                Optional camera access in the Live Camera &amp; Mask Check tool
                is never activated automatically—it starts only after you click{' '}
                <strong>Start Live Camera</strong> and grant your browser&apos;s
                permission prompt. You can stop the stream at any time.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <h3 className="font-bold text-[#0B1F3A] dark:text-white">
                3. Retention, Deletion &amp; Access Rights
              </h3>
              <p className="mt-1">
                Because nothing is written to servers,{' '}
                <code className="font-mono">localStorage</code>, cookies, or{' '}
                <code className="font-mono">IndexedDB</code>, closing or
                refreshing the tab deletes all session data immediately. You can
                also click <strong>Delete / Purge Session Data</strong> above at
                any time to wipe all in-memory inputs across every tool.
              </p>
            </div>
          </div>
        </section>
      )}

      {subTab === 'maintenance' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200/90 bg-white/92 p-5 shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700/70 dark:bg-[#0B172A]/90 dark:shadow-black/30">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
              <FileWarning className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <h2 className="text-sm font-bold text-[#0B1F3A] dark:text-white">
                5-Step Data Breach Response Plan
              </h2>
            </div>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              <li>
                <strong>Contain:</strong> Isolate affected accounts or hosts,
                revoke compromised API keys/sessions, and rotate credentials.
              </li>
              <li>
                <strong>Assess Scope:</strong> Identify what records were
                exposed, timestamps, and whether sensitive PII (PAN, Aadhaar,
                financial, health) was involved.
              </li>
              <li>
                <strong>Preserve Evidence:</strong> Snapshot sanitized audit
                logs and system metrics before wiping or rebuilding hosts.
              </li>
              <li>
                <strong>Notify:</strong> Inform affected individuals and
                applicable regulators/CERT authorities within legal timelines
                using clear, plain language.
              </li>
              <li>
                <strong>Remediate &amp; Harden:</strong> Patch root causes,
                enforce MFA, tighten CSP/security headers, and update retention
                rules.
              </li>
            </ol>
          </section>

          <section className="rounded-xl border border-slate-200/90 bg-white/92 p-5 shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700/70 dark:bg-[#0B172A]/90 dark:shadow-black/30">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
              <AlertTriangle className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
              <h2 className="text-sm font-bold text-[#0B1F3A] dark:text-white">
                Operations &amp; Maintenance Cadence
              </h2>
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              <li>
                <strong>Backups:</strong> Maintain version-controlled static
                builds and offline 3-2-1 backups for organizational data.
              </li>
              <li>
                <strong>Logs &amp; Monitoring:</strong> Monitor static host
                availability and CSP violation reports (never log raw user PII).
              </li>
              <li>
                <strong>Patching:</strong> Run{' '}
                <code className="font-mono">npm audit</code> and apply security
                patches for React, Vite, Tailwind, and TypeScript regularly.
              </li>
              <li>
                <strong>Content Updates:</strong> Review phishing quiz
                scenarios, privacy checklists, and detection rules quarterly.
              </li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
