import { useState } from 'react';
import { CheckSquare, Download, RotateCcw } from 'lucide-react';

export interface ChecklistItem {
  id: string;
  category: 'Accounts' | 'Devices & Browser' | 'Data Privacy' | 'Backups & Response';
  audience: 'all' | 'business';
  title: string;
  detail: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'chk-mfa',
    category: 'Accounts',
    audience: 'all',
    title: 'Enable Multi-Factor Authentication (MFA) on email, banking, and cloud accounts',
    detail: 'Prefer authenticator apps or hardware security keys over SMS OTP where supported.',
  },
  {
    id: 'chk-pw',
    category: 'Accounts',
    audience: 'all',
    title: 'Use unique 12+ character passphrases stored in a password manager',
    detail: 'Never reuse credentials across college portals, personal email, and shopping sites.',
  },
  {
    id: 'chk-rbac',
    category: 'Accounts',
    audience: 'business',
    title: 'Apply role-based access control (RBAC) and least privilege for staff accounts',
    detail: 'Separate admin accounts from daily work accounts and revoke access immediately when staff leave.',
  },
  {
    id: 'chk-patch',
    category: 'Devices & Browser',
    audience: 'all',
    title: 'Turn on automatic OS, browser, and dependency security updates',
    detail: 'Patching known vulnerabilities blocks the vast majority of commodity malware.',
  },
  {
    id: 'chk-https',
    category: 'Devices & Browser',
    audience: 'all',
    title: 'Verify HTTPS and inspect domain spelling before logging in',
    detail: 'Bookmark critical banking, university, and tax portals instead of clicking email links.',
  },
  {
    id: 'chk-encrypt',
    category: 'Devices & Browser',
    audience: 'all',
    title: 'Enable full-disk encryption (BitLocker / FileVault) and screen auto-lock',
    detail: 'Protects locally stored documents and customer exports if a laptop is lost or stolen.',
  },
  {
    id: 'chk-sanitize',
    category: 'Data Privacy',
    audience: 'all',
    title: 'Sanitize logs, support tickets, and CSVs locally before sharing',
    detail: 'Mask or pseudonymize emails, phone numbers, IPs, PAN, Aadhaar, and card numbers client-side.',
  },
  {
    id: 'chk-minimize',
    category: 'Data Privacy',
    audience: 'business',
    title: 'Collect only necessary fields and set explicit data deletion periods',
    detail: 'Do not retain raw ID scans or support attachments past their operational need.',
  },
  {
    id: 'chk-trackers',
    category: 'Data Privacy',
    audience: 'business',
    title: 'Audit third-party scripts and remove unnecessary trackers',
    detail: 'Use strict Content-Security-Policy headers and publish a clear plain-language privacy notice.',
  },
  {
    id: 'chk-backup',
    category: 'Backups & Response',
    audience: 'all',
    title: 'Maintain offline / immutable 3-2-1 backups and test restores',
    detail: 'Keep 3 copies on 2 media types with 1 offline/offsite copy protected against ransomware.',
  },
  {
    id: 'chk-logs',
    category: 'Backups & Response',
    audience: 'business',
    title: 'Monitor audit logs for failed logins, rate-limit spikes, and anomalies',
    detail: 'Ensure logs themselves do not store plaintext passwords, tokens, or raw payment cards.',
  },
  {
    id: 'chk-breach',
    category: 'Backups & Response',
    audience: 'business',
    title: 'Document a 5-step incident & breach response plan with emergency contacts',
    detail: 'Know how to isolate affected systems, preserve logs, notify users, and report incidents.',
  },
];

interface PrivacyChecklistPanelProps {
  checkedIds: Record<string, boolean>;
  onToggleItem: (id: string) => void;
  onResetChecklist: () => void;
}

export function PrivacyChecklistPanel({
  checkedIds,
  onToggleItem,
  onResetChecklist,
}: PrivacyChecklistPanelProps) {
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'business'>('all');

  const visibleItems =
    audienceFilter === 'all'
      ? CHECKLIST_ITEMS
      : CHECKLIST_ITEMS.filter((item) => item.audience === 'business' || item.audience === 'all');

  const completedCount = visibleItems.filter((item) => checkedIds[item.id]).length;
  const percent = Math.round((completedCount / visibleItems.length) * 100);

  const handleDownloadSummary = () => {
    const lines = [
      'CYBERSECURITY & DATA PRIVACY READINESS CHECKLIST',
      `Generated locally: ${new Date().toISOString()}`,
      `Completed: ${completedCount}/${visibleItems.length} (${percent}%)`,
      '',
      ...visibleItems.map(
        (item) =>
          `[${checkedIds[item.id] ? 'DONE' : 'TODO'}] (${item.category}) ${item.title}\n    ${item.detail}`
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'privacy_readiness_checklist.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-xl border border-slate-200/90 bg-white/92 p-5 shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700/70 dark:bg-[#0B172A]/90 dark:shadow-black/30">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <span className="inline-flex h-5 items-center rounded-md bg-blue-50 px-2 font-mono text-[10px] font-bold text-blue-800 ring-1 ring-blue-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-800">
            SELF-ASSESSMENT · PRIVACY CHECKLIST
          </span>
          <h2 className="mt-2 text-lg font-bold text-[#0B1F3A] dark:text-white">
            Personal &amp; Small-Business Privacy Hygiene Checklist
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Actionable steps for students, individuals, and small businesses.
            Checked state stays in browser RAM only.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setAudienceFilter('all')}
              className={`rounded-md px-2.5 py-1 transition ${
                audienceFilter === 'all'
                  ? 'bg-[#0B1F3A] text-white dark:bg-sky-600'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All Controls
            </button>
            <button
              type="button"
              onClick={() => setAudienceFilter('business')}
              className={`rounded-md px-2.5 py-1 transition ${
                audienceFilter === 'business'
                  ? 'bg-[#0B1F3A] text-white dark:bg-sky-600'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Small Business Focus
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadSummary}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Export (.txt)</span>
          </button>

          {completedCount > 0 && (
            <button
              type="button"
              onClick={onResetChecklist}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Strip */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
          <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>
            Readiness Score: {completedCount} of {visibleItems.length} complete ({percent}%)
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-500">
          Session-only · Zero cookies
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {visibleItems.map((item) => {
          const checked = Boolean(checkedIds[item.id]);
          return (
            <label
              key={item.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                checked
                  ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30'
                  : 'border-slate-200 bg-white/80 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#07111F]/70 dark:hover:bg-slate-900/80'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleItem(item.id)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-emerald-600"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {item.category}
                  </span>
                  {item.audience === 'business' && (
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-blue-700 dark:bg-sky-950 dark:text-sky-300">
                      Small Business
                    </span>
                  )}
                </div>
                <p
                  className={`mt-1 text-xs font-semibold ${
                    checked
                      ? 'text-emerald-950 line-through dark:text-emerald-200'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {item.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  {item.detail}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}
