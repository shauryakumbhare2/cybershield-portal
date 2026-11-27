import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import {
  DEMO_ACCOUNT,
  isRateLimited,
  LOCKOUT_DURATION_MS,
  MAX_LOGIN_ATTEMPTS,
  verifyLocalCredentials,
  verifyLocalMfaCode,
  type SessionUser,
  type UserRole,
} from '@backend/engine/localAuth';

interface LoginPageProps {
  onBackHome: () => void;
  onLoginSuccess: (user: SessionUser) => void;
}

const ROLES: { id: Exclude<UserRole, 'guest'>; label: string; desc: string }[] = [
  {
    id: 'student',
    label: 'Student / General User',
    desc: 'Sanitize resumes, tickets & study cybersecurity',
  },
  {
    id: 'business',
    label: 'Small Business Admin',
    desc: 'Audit CSV exports, checklists & breach readiness',
  },
  {
    id: 'auditor',
    label: 'Security & Privacy Auditor',
    desc: 'Inspect compliance standards & OWASP posture',
  },
];

export function LoginPage({ onBackHome, onLoginSuccess }: LoginPageProps) {
  const [role, setRole] = useState<Exclude<UserRole, 'guest'>>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
  const [mfaCode, setMfaCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  const handleFillDemo = () => {
    setErrorMsg(null);
    setEmail(DEMO_ACCOUNT.email);
    setPassword(DEMO_ACCOUNT.passcode);
  };

  const handleCredentialsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const now = Date.now();
    if (isRateLimited(lockedUntil, now)) {
      const secs = Math.ceil(((lockedUntil ?? now) - now) / 1000);
      setErrorMsg(`Too many failed attempts. Try again in ${secs}s.`);
      return;
    }

    const res = await verifyLocalCredentials(email, password);
    if (!res.ok) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
        setLockedUntil(now + LOCKOUT_DURATION_MS);
        setAttempts(0);
        setErrorMsg(
          'Rate limit triggered after 5 failed attempts. Locked locally for 15 seconds.'
        );
      } else {
        setErrorMsg(res.error ?? 'Invalid credentials.');
      }
      return;
    }

    setAttempts(0);
    setLockedUntil(null);
    setStep('mfa');
  };

  const handleMfaSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!verifyLocalMfaCode(mfaCode)) {
      setErrorMsg(
        `Invalid 6-digit MFA code. Enter demo code ${DEMO_ACCOUNT.mfaCode} or continue as guest.`
      );
      return;
    }

    onLoginSuccess({
      email: email.trim().toLowerCase(),
      role,
      mfaVerified: true,
      signedInAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  };

  const handleGuestEnter = () => {
    onLoginSuccess({
      email: 'guest@local.session',
      role: 'guest',
      mfaVerified: false,
      signedInAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-8 sm:px-6">
      <div className="grid w-full grid-cols-1 overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 shadow-2xl shadow-indigo-950/15 backdrop-blur-md dark:border-slate-800 dark:bg-[#0B1120]/95 lg:grid-cols-12">
        {/* Left Navy Security Sidebar */}
        <div className="flex flex-col justify-between bg-[#0A1F44] p-6 text-white lg:col-span-5 sm:p-8">
          <div>
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Back to Home Page</span>
            </button>

            <div className="mt-6 flex items-center gap-2.5">
              <ShieldCheck className="h-6 w-6 text-emerald-400" aria-hidden="true" />
              <span className="text-sm font-extrabold tracking-wide">
                CYBERSHIELD PORTAL
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
              Local Access &amp; Role Verification
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              Sign in with the offline demo account (Web Crypto SHA-256 +
              2-step MFA + rate limiting) or enter directly as a Guest with zero
              registration.
            </p>

            <div className="mt-6 space-y-2.5 rounded-xl border border-white/15 bg-white/5 p-3.5 text-[11px]">
              <p className="font-mono font-bold uppercase tracking-wider text-sky-300">
                Offline Demo Credentials
              </p>
              <div className="font-mono text-slate-200">
                Email: <span className="text-white">{DEMO_ACCOUNT.email}</span>
                <br />
                Passcode:{' '}
                <span className="text-white">{DEMO_ACCOUNT.passcode}</span>
                <br />
                MFA Code:{' '}
                <span className="text-emerald-300">{DEMO_ACCOUNT.mfaCode}</span>
              </div>
            </div>
          </div>

          <p className="mt-6 border-t border-white/10 pt-4 text-[11px] leading-relaxed text-slate-300">
            Zero-egress policy: Credentials are checked strictly in volatile
            browser RAM (no cookies, no localStorage,{' '}
            <code className="font-mono text-sky-300">
              connect-src &apos;none&apos;
            </code>
            ).
          </p>
        </div>

        {/* Right Form Panel */}
        <div className="p-6 lg:col-span-7 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold text-[#0B0F19] dark:text-white">
              {step === 'credentials'
                ? 'Sign In to Main Webpage'
                : 'Step 2: Multi-Factor Verification'}
            </h2>

            {step === 'credentials' && (
              <button
                type="button"
                onClick={handleFillDemo}
                className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-800 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200"
              >
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                <span>Fill Demo Credentials</span>
              </button>
            )}
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="mt-5 space-y-4">
              {/* Role-Based Access Selection */}
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Portal Role (RBAC Preview)
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {ROLES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRole(item.id)}
                      aria-pressed={role === item.id}
                      className={`rounded-xl border p-2.5 text-left transition ${
                        role === item.id
                          ? 'border-[#0A1F44] bg-[#0A1F44] text-white dark:border-indigo-500 dark:bg-indigo-600'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-[11px] font-bold">{item.label}</div>
                      <div className="mt-0.5 text-[10px] opacity-80">
                        {item.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                  placeholder="demo@cybershield.local"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#07111F] dark:text-white dark:focus:border-indigo-400 dark:focus:bg-[#07111F]"
                />
              </div>

              <div>
                <label
                  htmlFor="login-pass"
                  className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Passcode
                </label>
                <div className="relative">
                  <input
                    id="login-pass"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="off"
                    placeholder="Enter passcode"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 pr-10 font-mono text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#07111F] dark:text-white dark:focus:border-indigo-400 dark:focus:bg-[#07111F]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:text-slate-400"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B0F19] px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-950 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span>Verify &amp; Continue to MFA</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} className="mt-5 space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                Credentials verified for <strong>{email}</strong>. Enter the
                6-digit MFA code (demo:{' '}
                <code className="font-mono font-bold">
                  {DEMO_ACCOUNT.mfaCode}
                </code>
                ).
              </div>

              <div>
                <label
                  htmlFor="login-mfa"
                  className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  6-Digit MFA Verification Code
                </label>
                <div className="flex gap-2">
                  <input
                    id="login-mfa"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="482910"
                    className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 font-mono text-sm tracking-widest text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#07111F] dark:text-white dark:focus:bg-[#07111F]"
                  />
                  <button
                    type="button"
                    onClick={() => setMfaCode(DEMO_ACCOUNT.mfaCode)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Auto-fill
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setErrorMsg(null);
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500"
                >
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  <span>Enter Main Webpage</span>
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={handleGuestEnter}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>Enter Main Webpage as Guest (No Sign-In Needed)</span>
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <Lock className="h-3 w-3" aria-hidden="true" />
              <span>
                Production backends should hash passwords with Argon2id/bcrypt and
                use HttpOnly; Secure cookies.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
