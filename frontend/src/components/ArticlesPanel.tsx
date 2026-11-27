import { useState } from 'react';
import { BookOpen, Clock } from 'lucide-react';

interface Article {
  id: string;
  tag: 'Data Privacy' | 'Phishing Defense' | 'Passwords & MFA' | 'Small Business';
  audience: string;
  readTime: string;
  title: string;
  summary: string;
  keyTakeaways: string[];
}

const ARTICLES: Article[] = [
  {
    id: 'art-1',
    tag: 'Data Privacy',
    audience: 'Students & Support Teams',
    readTime: '3 min read',
    title: 'Why You Should Sanitize Logs, Tickets & Resumes Before Sharing',
    summary:
      'Copying application logs into chat threads, bug trackers, or AI assistants often leaks customer emails, phone numbers, IP addresses, PAN/Aadhaar numbers, and payment digits. Running sanitization locally inside your browser prevents sensitive identifiers from ever crossing the network.',
    keyTakeaways: [
      'Use Consistent Pseudonymization (USER_01, IP_01) when debugging so related log lines stay traceable without exposing real identities.',
      'Never share unmasked CSV exports in public issue trackers or third-party cloud tools.',
      'Always verify the Side-by-Side Audit View because regex rules cannot catch names or street addresses.',
    ],
  },
  {
    id: 'art-2',
    tag: 'Phishing Defense',
    audience: 'Students & General Users',
    readTime: '3 min read',
    title: 'Spotting Lookalike Domains, Urgent Pretexts & SMS Scams',
    summary:
      'Attackers rarely break encryption—they use urgency ("account suspended in 2 hours") and slightly altered domain names (micros0ft vs microsoft) to trick people into entering credentials or OTPs.',
    keyTakeaways: [
      'Check the full domain before the first slash (/), not just the display name.',
      'Open banks, university portals, and tax sites from your own saved bookmark instead of email/SMS links.',
      'Treat unexpected CEO or finance wire requests as high-risk until confirmed over a known voice number.',
    ],
  },
  {
    id: 'art-3',
    tag: 'Passwords & MFA',
    audience: 'Everyone',
    readTime: '2 min read',
    title: 'Passphrases, MFA & How Services Should Protect Logins',
    summary:
      'Length beats complexity tricks. A four-word random passphrase stored in a password manager is far harder to crack than a short password with a single symbol. When paired with app-based Multi-Factor Authentication, stolen passwords alone cannot unlock your account.',
    keyTakeaways: [
      'Aim for 12+ characters (or 4+ random words) and never reuse passwords across sites.',
      'Enable authenticator-app MFA or passkeys on email, banking, and admin accounts.',
      'Services that store passwords must hash them with Argon2id or bcrypt and lock down cookies with HttpOnly, Secure, and SameSite.',
    ],
  },
  {
    id: 'art-4',
    tag: 'Small Business',
    audience: 'Small Businesses',
    readTime: '4 min read',
    title: 'Data Minimization, Retention Limits & Breach Readiness',
    summary:
      'The safest personal data is data you never collect or store. Small businesses reduce legal and breach exposure by collecting only essential fields, encrypting stored records, enforcing automatic deletion schedules, and keeping a simple incident response plan ready.',
    keyTakeaways: [
      'Publish a plain-language privacy notice explaining what you collect, why, and how users can request access or deletion.',
      'Avoid third-party tracking scripts on sensitive forms and enforce HTTPS + strict Content-Security-Policy headers.',
      'Maintain tested offline backups, audit logs, and dependency patching schedules.',
    ],
  },
];

const TAG_FILTERS = ['All', 'Data Privacy', 'Phishing Defense', 'Passwords & MFA', 'Small Business'] as const;

export function ArticlesPanel() {
  const [selectedTag, setSelectedTag] = useState<(typeof TAG_FILTERS)[number]>('All');

  const filtered =
    selectedTag === 'All'
      ? ARTICLES
      : ARTICLES.filter((a) => a.tag === selectedTag);

  return (
    <section className="rounded-xl border border-slate-200/90 bg-white/92 p-5 shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700/70 dark:bg-[#0B172A]/90 dark:shadow-black/30">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <span className="inline-flex h-5 items-center rounded-md bg-blue-50 px-2 font-mono text-[10px] font-bold text-blue-800 ring-1 ring-blue-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-800">
            PLAIN-LANGUAGE GUIDES · ARTICLES
          </span>
          <h2 className="mt-2 text-lg font-bold text-[#0B1F3A] dark:text-white">
            Cybersecurity &amp; Data Privacy Knowledge Base
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Practical, jargon-free guidance for students, small businesses, and
            everyday users—hosted locally with zero external trackers.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {TAG_FILTERS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                selectedTag === tag
                  ? 'border-[#0B1F3A] bg-[#0B1F3A] text-white dark:border-sky-500 dark:bg-sky-600'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((article) => (
          <article
            key={article.id}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-[#07111F]/80"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 font-mono font-bold text-blue-800 dark:bg-sky-950 dark:text-sky-300">
                  <BookOpen className="h-3 w-3" aria-hidden="true" />
                  {article.tag}
                </span>
                <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {article.readTime} · {article.audience}
                </span>
              </div>

              <h3 className="mt-2.5 text-sm font-bold text-[#0B1F3A] dark:text-white">
                {article.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {article.summary}
              </p>
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#0B172A]">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Key Takeaways
              </p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                {article.keyTakeaways.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
