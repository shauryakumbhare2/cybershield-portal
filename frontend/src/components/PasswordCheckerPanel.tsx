import { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import {
  analyzePasswordStrength,
  generateLocalPassphrase,
  type StrengthScore,
} from '@backend/engine/passwordStrength';

interface PasswordCheckerPanelProps {
  password: string;
  onPasswordChange: (next: string) => void;
}

const SCORE_BAR_CLASS: Record<StrengthScore, string> = {
  0: 'w-1/5 bg-rose-500',
  1: 'w-2/5 bg-orange-500',
  2: 'w-3/5 bg-amber-500',
  3: 'w-4/5 bg-sky-500',
  4: 'w-full bg-emerald-500',
};

const SCORE_BADGE_CLASS: Record<StrengthScore, string> = {
  0: 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200',
  1: 'border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/60 dark:text-orange-200',
  2: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200',
  3: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-200',
  4: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
};

export function PasswordCheckerPanel({
  password,
  onPasswordChange,
}: PasswordCheckerPanelProps) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const analysis = useMemo(() => analyzePasswordStrength(password), [password]);

  const handleGenerate = () => {
    const generated = generateLocalPassphrase(4);
    onPasswordChange(generated);
    setVisible(true);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const criteriaList = [
    { key: 'minLength12', label: 'At least 12 characters', ok: analysis.checks.minLength12 },
    { key: 'hasUpper', label: 'Uppercase letters (A–Z)', ok: analysis.checks.hasUpper },
    { key: 'hasLower', label: 'Lowercase letters (a–z)', ok: analysis.checks.hasLower },
    { key: 'hasDigit', label: 'Numbers (0–9)', ok: analysis.checks.hasDigit },
    { key: 'hasSymbol', label: 'Symbols (!@#$-_)', ok: analysis.checks.hasSymbol },
    { key: 'noCommonPattern', label: 'No common words or runs', ok: analysis.checks.noCommonPattern },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <section
        aria-labelledby="pw-heading"
        className="rounded-xl border border-slate-200/90 bg-white/92 p-5 shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700/70 dark:bg-[#0B172A]/90 dark:shadow-black/30 lg:col-span-7"
      >
        <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-5 items-center rounded-md bg-blue-50 px-2 font-mono text-[10px] font-bold text-blue-800 ring-1 ring-blue-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-800">
              CLIENT-SIDE PASSWORD CHECKER
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              <Lock className="h-3 w-3" aria-hidden="true" />
              <span>ZERO NETWORK CALLS · NEVER SAVED</span>
            </span>
          </div>
          <h2
            id="pw-heading"
            className="mt-2 text-lg font-bold text-[#0B1F3A] dark:text-white"
          >
            Password Strength Checker &amp; Passphrase Generator
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Test how resilient your password is against offline brute-force and
            common pattern attacks. Everything runs strictly in browser memory.
          </p>
        </div>

        <div className="mt-4">
          <label
            htmlFor="pw-test-input"
            className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Password or Passphrase to Evaluate
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1">
              <input
                id="pw-test-input"
                type={visible ? 'text' : 'password'}
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder="Type a password or generate a strong passphrase…"
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 pr-10 font-mono text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#07111F] dark:text-white dark:focus:border-sky-400 dark:focus:bg-[#07111F]"
              />
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {visible ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F3A] px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#13325C] dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Generate Strong</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              disabled={!password}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Strength Meter */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Strength Rating:
              </span>
              <span
                className={`rounded border px-2 py-0.5 font-mono text-[11px] font-bold ${
                  SCORE_BADGE_CLASS[analysis.score]
                }`}
              >
                {password ? analysis.label : 'Waiting for input'}
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              {analysis.entropyBits} bits · Crack est: {analysis.estimatedCrackTime}
            </span>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                password ? SCORE_BAR_CLASS[analysis.score] : 'w-0'
              }`}
            />
          </div>
        </div>

        {/* Plain-Language Feedback */}
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Actionable Guidance
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600 dark:text-slate-400">
            {analysis.feedback.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      </section>

      <aside className="flex flex-col gap-4 lg:col-span-5">
        <section className="rounded-xl border border-slate-200/90 bg-white/92 p-5 shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700/70 dark:bg-[#0B172A]/90 dark:shadow-black/30">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            <h3 className="text-sm font-bold text-[#0B1F3A] dark:text-white">
              Security Criteria Check
            </h3>
          </div>
          <ul className="mt-3 space-y-2 text-xs">
            {criteriaList.map((item) => (
              <li
                key={item.key}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <span className="text-slate-700 dark:text-slate-300">
                  {item.label}
                </span>
                {item.ok ? (
                  <CheckCircle2
                    className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircle
                    className="h-4 w-4 text-slate-400 dark:text-slate-600"
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200/90 bg-white/92 p-5 text-xs shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700/70 dark:bg-[#0B172A]/90 dark:shadow-black/30">
          <h3 className="text-sm font-bold text-[#0B1F3A] dark:text-white">
            Authentication Best Practices
          </h3>
          <p className="mt-1.5 leading-relaxed text-slate-600 dark:text-slate-400">
            For student portals, small businesses, and personal accounts: use a
            unique passphrase per site, enable Multi-Factor Authentication
            (MFA), and never reuse passwords. Web services storing credentials
            should hash passwords with <strong>Argon2id</strong> or{' '}
            <strong>bcrypt</strong>, enforce rate limiting, and issue{' '}
            <code className="font-mono">HttpOnly; Secure; SameSite</code>{' '}
            session cookies.
          </p>
        </section>
      </aside>
    </div>
  );
}
