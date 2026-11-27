import {
  ArrowRight,
  Bot,
  Camera,
  CheckSquare,
  FileText,
  HelpCircle,
  KeyRound,
  Lock,
  LogIn,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import cyberLogo from '../assets/cyber-logo.png';
import type { PortalTab } from './Header';

interface HomePageProps {
  onGoToLogin: () => void;
  onEnterAsGuest: (initialTab?: PortalTab) => void;
}

const FEATURES: {
  tab: PortalTab;
  title: string;
  desc: string;
  icon: typeof SlidersHorizontal;
}[] = [
  {
    tab: 'workbench',
    title: 'PII Redactor Workbench',
    desc: 'Detect & mask Emails, Phones, IPv4/IPv6, PAN, Aadhaar (optional Verhoeff), and Luhn-verified Cards in a Web Worker.',
    icon: SlidersHorizontal,
  },
  {
    tab: 'camera',
    title: 'Live Camera & Full Mask',
    desc: 'Capture webcam frames locally, classify mask coverage, and apply [FACE REDACTED] privacy masks with zero uploads.',
    icon: Camera,
  },
  {
    tab: 'password',
    title: 'Password Strength Checker',
    desc: 'Check entropy, crack-time estimates, and common weak patterns, or generate random passphrases via Web Crypto.',
    icon: KeyRound,
  },
  {
    tab: 'phishing',
    title: 'Phishing Awareness Quiz',
    desc: 'Practice spotting lookalike domains, CEO wire scams, and SMS smishing across student & small-business scenarios.',
    icon: HelpCircle,
  },
  {
    tab: 'checklist',
    title: 'Privacy Hygiene Checklist',
    desc: '12-point personal & small-business readiness audit with instant scoring and local .txt export.',
    icon: CheckSquare,
  },
  {
    tab: 'articles',
    title: 'Guides & Local AI Chat',
    desc: 'Plain-language cybersecurity articles plus an offline AI assistant to discuss scans and compliance questions.',
    icon: Bot,
  },
];

export function HomePage({ onGoToLogin, onEnterAsGuest }: HomePageProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      {/* Hero Banner with Large Clearly Visible Padlock Artwork */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-200/80 bg-white/85 px-6 py-10 shadow-xl shadow-indigo-950/10 backdrop-blur-md dark:border-slate-800 dark:bg-[#070E1F]/90 sm:px-10 sm:py-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-full overflow-hidden lg:w-[72%]"
        >
          <img
            src={cyberLogo}
            alt=""
            className="hero-logo-fade h-full w-full object-cover object-center opacity-30 sm:opacity-45 lg:opacity-90 dark:opacity-50 lg:dark:opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent lg:from-white/95 lg:via-white/55 lg:to-transparent dark:from-[#070E1F] dark:via-[#070E1F]/80 dark:to-transparent lg:dark:from-[#070E1F]/95 lg:dark:via-[#070E1F]/55 lg:dark:to-transparent" />
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50/95 px-3 py-1 text-[11px] font-bold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
            <Lock className="h-3 w-3" aria-hidden="true" />
            <span>100% Client-Side · CSP connect-src &apos;none&apos; · Zero Retention</span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0B0F19] dark:text-white sm:text-5xl sm:leading-[1.08]">
            Cybersecurity &amp;
            <br />
            Data Privacy Portal
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200 sm:text-base">
            Built for students, small businesses, and general users. Sanitize
            sensitive logs and CSV files, test passwords, spot phishing scams,
            and review compliance—entirely inside your browser.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onGoToLogin}
              className="inline-flex items-center gap-2 rounded-full bg-[#0B0F19] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-950 dark:bg-indigo-600 dark:hover:bg-indigo-500"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span>Sign In to Portal</span>
            </button>

            <button
              type="button"
              onClick={() => onEnterAsGuest('workbench')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/95 px-5 py-3 text-sm font-bold text-slate-900 shadow-xs transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100"
            >
              <span>Enter Main Webpage (Guest)</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Audience & Security Trust Highlights */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-[#0B1120]/90">
          <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          <h2 className="mt-2.5 text-sm font-bold text-[#0B0F19] dark:text-white">
            For Students, SMBs &amp; Citizens
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Plain-language privacy tools, interactive phishing awareness, and
            actionable readiness checklists accessible on mobile and desktop
            (WCAG 2.2 aligned).
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-[#0B1120]/90">
          <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <h2 className="mt-2.5 text-sm font-bold text-[#0B0F19] dark:text-white">
            Zero Network Egress Guarantee
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Production builds enforce{' '}
            <code className="font-mono">connect-src &apos;none&apos;</code>.
            User text, uploaded files, passwords, and camera captures never
            leave your device.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-[#0B1120]/90">
          <FileText className="h-5 w-5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
          <h2 className="mt-2.5 text-sm font-bold text-[#0B0F19] dark:text-white">
            Compliance &amp; Transparency
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Includes a clear Privacy Notice, zero third-party trackers, one-click
            session purge, and a 5-step data breach response plan.
          </p>
        </div>
      </section>

      {/* Core Portal Tools Preview Grid */}
      <section aria-labelledby="home-features-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2
              id="home-features-heading"
              className="text-lg font-extrabold text-[#0B0F19] dark:text-white"
            >
              Everything Inside the Main Portal
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Sign in or click any tool below to launch directly into the main
              CyberShield workspace.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ tab, title, desc, icon: Icon }) => (
            <button
              key={tab}
              type="button"
              onClick={() => onEnterAsGuest(tab)}
              className="group flex flex-col items-start rounded-2xl border border-slate-200/90 bg-white/90 p-5 text-left shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-[#0B1120]/90 dark:hover:border-indigo-500"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A1F44] text-sky-300 transition group-hover:bg-indigo-600 group-hover:text-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-[#0B0F19] dark:text-white">
                {title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {desc}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <span>Open tool</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
