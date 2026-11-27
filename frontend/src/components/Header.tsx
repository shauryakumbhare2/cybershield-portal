import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Bot,
  Camera,
  CheckSquare,
  ChevronDown,
  FileText,
  HelpCircle,
  Home,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-react';
import type { SessionUser } from '@backend/engine/localAuth';

export type PortalTab =
  | 'workbench'
  | 'camera'
  | 'password'
  | 'phishing'
  | 'checklist'
  | 'articles'
  | 'legal';

export type PageView = 'home' | 'login' | 'portal';

interface HeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  pageView: PageView;
  onNavigateView: (view: PageView) => void;
  activeTab: PortalTab;
  onSelectTab: (tab: PortalTab) => void;
  onLoadSampleAndGo: () => void;
  onJumpToChat: () => void;
  sessionUser: SessionUser | null;
  onSignOut: () => void;
}

const ROLE_LABELS: Record<SessionUser['role'], string> = {
  guest: 'Guest',
  student: 'Student',
  business: 'Small Business',
  auditor: 'Auditor',
};

export function Header({
  darkMode,
  onToggleTheme,
  pageView,
  onNavigateView,
  activeTab,
  onSelectTab,
  onLoadSampleAndGo,
  onJumpToChat,
  sessionUser,
  onSignOut,
}: HeaderProps) {
  const [openMenu, setOpenMenu] = useState<'tools' | 'resources' | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectAndClose = (tab: PortalTab) => {
    onNavigateView('portal');
    onSelectTab(tab);
    setOpenMenu(null);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#060B18]/90">
      <div
        ref={navRef}
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6"
      >
        {/* Left: Brand Mark + Local Badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onNavigateView('home');
              setOpenMenu(null);
              setMobileOpen(false);
            }}
            className="flex items-center gap-2 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
          >
            <svg
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 shrink-0 text-[#0B0F19] dark:text-indigo-300"
              aria-hidden="true"
            >
              <ellipse
                cx="18"
                cy="18"
                rx="13"
                ry="6"
                transform="rotate(42 18 18)"
                stroke="currentColor"
                strokeWidth="2.4"
              />
              <ellipse
                cx="18"
                cy="18"
                rx="13"
                ry="6"
                transform="rotate(-42 18 18)"
                stroke="currentColor"
                strokeWidth="2.4"
              />
              <circle cx="18" cy="18" r="2.8" fill="currentColor" />
            </svg>
            <span className="text-base font-extrabold tracking-tight text-[#0B0F19] dark:text-white">
              CyberShield
            </span>
          </button>

          <span
            className="hidden items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50/90 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 xl:inline-flex"
            title="Zero network calls · CSP connect-src 'none'"
          >
            <Lock className="h-3 w-3" aria-hidden="true" />
            <span>100% local processing</span>
          </span>
        </div>

        {/* Center Navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-1 md:flex"
        >
          <button
            type="button"
            onClick={() => {
              onNavigateView('home');
              setOpenMenu(null);
            }}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              pageView === 'home'
                ? 'text-indigo-700 dark:text-indigo-300'
                : 'text-slate-700 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-indigo-300'
            }`}
          >
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Home</span>
          </button>

          {pageView === 'portal' ? (
            <>
              <button
                type="button"
                onClick={() => selectAndClose('workbench')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'workbench'
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-700 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-indigo-300'
                }`}
              >
                Dashboard
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setOpenMenu((prev) => (prev === 'tools' ? null : 'tools'))
                  }
                  aria-expanded={openMenu === 'tools'}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:text-indigo-700 dark:text-slate-300 dark:hover:text-indigo-300"
                >
                  <span>Features</span>
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>

                {openMenu === 'tools' && (
                  <div className="absolute left-0 top-full mt-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-[#0D1426]">
                    <button
                      type="button"
                      onClick={() => selectAndClose('workbench')}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-indigo-950/50"
                    >
                      <SlidersHorizontal className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                      <span>PII Redactor Workbench</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => selectAndClose('camera')}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-indigo-950/50"
                    >
                      <Camera className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                      <span>Live Camera &amp; Mask Check</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => selectAndClose('password')}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-indigo-950/50"
                    >
                      <KeyRound className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                      <span>Password Strength Checker</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => selectAndClose('phishing')}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-indigo-950/50"
                    >
                      <HelpCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                      <span>Phishing Awareness Quiz</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => selectAndClose('checklist')}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-indigo-950/50"
                    >
                      <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                      <span>Privacy Hygiene Checklist</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => selectAndClose('articles')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'articles'
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-700 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-indigo-300'
                }`}
              >
                Articles
              </button>

              <button
                type="button"
                onClick={() => selectAndClose('legal')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'legal'
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-700 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-indigo-300'
                }`}
              >
                Security &amp; Legal
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpenMenu(null);
                  onJumpToChat();
                }}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
              >
                <Bot className="h-3.5 w-3.5" aria-hidden="true" />
                <span>AI Chat</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onNavigateView('login')}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                pageView === 'login'
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-700 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-indigo-300'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Login Page</span>
            </button>
          )}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {pageView === 'portal' && sessionUser && (
            <span className="hidden items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200 lg:inline-flex">
              <span>{ROLE_LABELS[sessionUser.role]}</span>
              {sessionUser.mfaVerified && (
                <span className="rounded bg-emerald-600 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
                  MFA
                </span>
              )}
            </span>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={
              darkMode ? 'Switch to light theme' : 'Switch to dark theme'
            }
            aria-pressed={darkMode}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {darkMode ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-slate-700" aria-hidden="true" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {pageView === 'portal' ? (
            <>
              <button
                type="button"
                onClick={onLoadSampleAndGo}
                className="hidden items-center gap-1.5 rounded-full bg-[#0B0F19] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-950 dark:bg-indigo-600 dark:hover:bg-indigo-500 sm:inline-flex"
              >
                <span>Try Sample</span>
              </button>
              <button
                type="button"
                onClick={onSignOut}
                title="Sign out and return to Home Page"
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onNavigateView('login')}
              className="hidden items-center gap-1.5 rounded-full bg-[#0B0F19] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-950 dark:bg-indigo-600 dark:hover:bg-indigo-500 sm:inline-flex"
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign In</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 p-2 text-slate-800 md:hidden dark:border-slate-700 dark:text-slate-100"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white/95 px-4 py-3 md:hidden dark:border-slate-800 dark:bg-[#060B18]">
          <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                onNavigateView('home');
                setMobileOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-left text-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <Home className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Home Page</span>
            </button>

            {pageView !== 'portal' ? (
              <button
                type="button"
                onClick={() => {
                  onNavigateView('login');
                  setMobileOpen(false);
                }}
                className="flex items-center gap-2 rounded-lg bg-[#0A1F44] px-3 py-2 text-left text-white"
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign In</span>
              </button>
            ) : (
              <>
                {(
                  [
                    { id: 'workbench', label: 'PII Redactor', icon: SlidersHorizontal },
                    { id: 'camera', label: 'Live Camera', icon: Camera },
                    { id: 'password', label: 'Password Checker', icon: KeyRound },
                    { id: 'phishing', label: 'Phishing Quiz', icon: HelpCircle },
                    { id: 'checklist', label: 'Privacy Checklist', icon: CheckSquare },
                    { id: 'articles', label: 'Articles', icon: FileText },
                    { id: 'legal', label: 'Security & Legal', icon: BookOpen },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectAndClose(id)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left ${
                      activeTab === id
                        ? 'bg-[#0A1F44] text-white'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onJumpToChat();
                  }}
                  className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-left text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                >
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>AI Assistant</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
