import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

interface PhishingScenario {
  id: string;
  audience: string;
  channel: string;
  sender: string;
  subject: string;
  body: string;
  linkPreview: string;
  isPhishing: boolean;
  explanation: string;
  redFlags: string[];
}

const SCENARIOS: PhishingScenario[] = [
  {
    id: 'phish-1',
    audience: 'Students',
    channel: 'Email',
    sender: 'financial-aid@uni-portal-verify.example.com',
    subject: 'URGENT: Scholarship Disbursement Suspended — Verify Bank Details in 2 Hours',
    body: 'Dear Student, Your semester scholarship grant is on hold due to mismatched KYC. Click below immediately to confirm your Aadhaar and bank card before 5:00 PM today or your award will be cancelled.',
    linkPreview: 'https://uni-portal-verify.example.com/kyc-login',
    isPhishing: true,
    explanation:
      'Phishing! Legitimate universities do not threaten 2-hour cancellation over email or ask for Aadhaar and bank card details on an external lookalike domain.',
    redFlags: [
      'Artificial 2-hour urgency and threat of financial loss',
      'External lookalike domain instead of the official university .edu/.ac domain',
      'Requests sensitive Aadhaar and card information via email link',
    ],
  },
  {
    id: 'phish-2',
    audience: 'Small Business',
    channel: 'Email',
    sender: 'billing@acmecorp.example.com',
    subject: 'Monthly Cloud Hosting Statement #INV-2026-441 Ready',
    body: 'Hello Finance Team, Your scheduled monthly invoice #INV-2026-441 is available inside your account dashboard. Sign in via your saved bookmark to review.',
    linkPreview: 'https://acmecorp.example.com/invoices/INV-2026-441',
    isPhishing: false,
    explanation:
      'Legitimate notification! The sender domain matches the link domain cleanly, there is no artificial panic, no attachments, and it advises signing in via your own saved bookmark.',
    redFlags: [
      'Domain consistency between sender and destination',
      'No credential or card request in the message',
      'Advises accessing via saved bookmark',
    ],
  },
  {
    id: 'phish-3',
    audience: 'Small Business',
    channel: 'Email',
    sender: 'ceo-office@micros0ft-support.example.org',
    subject: 'Confidential Payroll Update — Wire Transfer Needed Before Noon',
    body: 'Hi, I am stuck in a board meeting and cannot take calls. Please process an urgent vendor payment of 45,000 today and reply with the confirmation screenshot.',
    linkPreview: 'Reply-To: external-finance-desk@example.net',
    isPhishing: true,
    explanation:
      'Phishing (Business Email Compromise)! Look closely at the typosquatted sender ("micros0ft" with a zero), mismatched Reply-To address, and pressure to bypass normal approval.',
    redFlags: [
      'Character substitution ("0" for "o") in sender domain',
      'Mismatched external Reply-To address',
      'Classic CEO urgency pretext telling you not to call',
    ],
  },
  {
    id: 'phish-4',
    audience: 'General Users',
    channel: 'SMS',
    sender: '+91-98000-00001',
    subject: 'SMS Alert: Parcel Delivery Failed',
    body: 'IndiaPost/Courier: Your package could not be delivered due to incomplete address. Pay Rs 12 redelivery fee within 12 hrs at http://track-parcel-pay.example.net/fee',
    linkPreview: 'http://track-parcel-pay.example.net/fee',
    isPhishing: true,
    explanation:
      'Phishing (Smishing)! Small-fee courier SMS scams use unencrypted HTTP links and generic short domains to steal credit card details.',
    redFlags: [
      'Unencrypted HTTP link on an unofficial tracking domain',
      'Unsolicited small-fee payment demand to capture card numbers',
      'Sent from a regular mobile-style number with urgency',
    ],
  },
  {
    id: 'phish-5',
    audience: 'General Users',
    channel: 'Email',
    sender: 'security@payroll-cloud.example.com',
    subject: 'New Sign-In Detected on Your Account',
    body: 'We noticed a new sign-in from Firefox on Windows. If this was you, no action is needed. If not, open your security settings directly in the app to revoke sessions and rotate your password.',
    linkPreview: 'No clickable login link included',
    isPhishing: false,
    explanation:
      'Legitimate security alert! It informs you clearly, tells you no action is needed if expected, and directs you to open your app directly rather than clicking an urgent login link.',
    redFlags: [
      'No deceptive link or credential harvesting form',
      'Clear, calm language with direct in-app remediation advice',
    ],
  },
];

export function PhishingQuizPanel() {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  const answeredCount = Object.keys(answers).length;
  const correctCount = SCENARIOS.filter(
    (s) => answers[s.id] !== undefined && answers[s.id] === s.isPhishing
  ).length;

  const handleAnswer = (id: string, guessPhishing: boolean) => {
    setAnswers((prev) => ({ ...prev, [id]: guessPhishing }));
  };

  const handleReset = () => {
    setAnswers({});
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-xl border border-slate-200/90 bg-white/92 p-5 shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700/70 dark:bg-[#0B172A]/90 dark:shadow-black/30">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <span className="inline-flex h-5 items-center rounded-md bg-blue-50 px-2 font-mono text-[10px] font-bold text-blue-800 ring-1 ring-blue-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-800">
              AWARENESS TRAINING · PHISHING QUIZ
            </span>
            <h2 className="mt-2 text-lg font-bold text-[#0B1F3A] dark:text-white">
              Spot the Phish: Interactive Scenario Quiz
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Review each simulated message tailored for students, small
              businesses, and everyday users. Decide whether it is{' '}
              <strong>Phishing</strong> or <strong>Legitimate</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              Score:{' '}
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {correctCount}/{SCENARIOS.length}
              </span>{' '}
              <span className="text-slate-400">({answeredCount} answered)</span>
            </div>

            {answeredCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Retake Quiz</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {SCENARIOS.map((item, idx) => {
            const userGuess = answers[item.id];
            const isAnswered = userGuess !== undefined;
            const isCorrect = isAnswered && userGuess === item.isPhishing;

            return (
              <article
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-[#07111F]/80"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Scenario {idx + 1} · {item.audience} · {item.channel}
                    </span>
                    {isAnswered && (
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] font-bold ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <XCircle className="h-3 w-3" aria-hidden="true" />
                        )}
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-[#0B172A]">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate font-mono">{item.sender}</span>
                    </div>
                    <p className="mt-1 font-bold text-slate-900 dark:text-slate-100">
                      {item.subject}
                    </p>
                    <p className="mt-1.5 leading-relaxed text-slate-700 dark:text-slate-300">
                      {item.body}
                    </p>
                    <p className="mt-2 rounded bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                      Link / Header: {item.linkPreview}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAnswer(item.id, true)}
                      aria-pressed={userGuess === true}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition ${
                        userGuess === true
                          ? 'border-rose-600 bg-rose-600 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-rose-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-rose-950/40'
                      }`}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Phishing</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAnswer(item.id, false)}
                      aria-pressed={userGuess === false}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition ${
                        userGuess === false
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-950/40'
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Legitimate</span>
                    </button>
                  </div>

                  {isAnswered && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900/70">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.explanation}
                      </p>
                      <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[11px] text-slate-600 dark:text-slate-400">
                        {item.redFlags.map((flag) => (
                          <li key={flag}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
