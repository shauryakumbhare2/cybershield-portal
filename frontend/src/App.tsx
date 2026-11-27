import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Bot,
  Camera,
  CheckSquare,
  FileText,
  HelpCircle,
  KeyRound,
  Lock,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { ArticlesPanel } from './components/ArticlesPanel';
import { AuditView } from './components/AuditView';
import { ControlsBar } from './components/ControlsBar';
import { FluidAuroraBackdrop } from './components/FluidAuroraBackdrop';
import { Footer } from './components/Footer';
import { GovernanceLegalView } from './components/GovernanceLegalView';
import { Header, type PageView, type PortalTab } from './components/Header';
import { HomePage } from './components/HomePage';
import { InputPanel } from './components/InputPanel';
import { LiveCameraPanel } from './components/LiveCameraPanel';
import { LocalChatAssistant } from './components/LocalChatAssistant';
import { LoginPage } from './components/LoginPage';
import { PasswordCheckerPanel } from './components/PasswordCheckerPanel';
import { PhishingQuizPanel } from './components/PhishingQuizPanel';
import { PrivacyChecklistPanel } from './components/PrivacyChecklistPanel';
import { TelemetryExportBar } from './components/TelemetryExportBar';
import {
  findSkippedAadhaarPrefixCandidates,
  NOISY_SAMPLE_TEXT,
  redactText,
  type SessionUser,
} from '@backend/engine';
import type { PiiType, RedactionMode } from '@backend/engine/types';
import { useDetectionWorker } from '@backend/worker/useDetectionWorker';
import cyberLogo from './assets/cyber-logo.png';

const DEFAULT_ENABLED_TYPES: Record<PiiType, boolean> = {
  email: true,
  card: true,
  aadhaar: true,
  pan: true,
  ip: true,
  phone: true,
};

const SIDEBAR_ITEMS: {
  id: PortalTab;
  label: string;
  icon: typeof SlidersHorizontal;
}[] = [
  { id: 'workbench', label: 'PII Dashboard', icon: SlidersHorizontal },
  { id: 'camera', label: 'Live Camera', icon: Camera },
  { id: 'password', label: 'Password Check', icon: KeyRound },
  { id: 'phishing', label: 'Phishing Quiz', icon: HelpCircle },
  { id: 'checklist', label: 'Checklist', icon: CheckSquare },
  { id: 'articles', label: 'Articles', icon: FileText },
  { id: 'legal', label: 'Audit & Legal', icon: BookOpen },
];

export function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [pageView, setPageView] = useState<PageView>('home');
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [activeTab, setActiveTab] = useState<PortalTab>('workbench');
  const [text, setText] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSizeBytes, setFileSizeBytes] = useState<number | null>(null);
  const [mode, setMode] = useState<RedactionMode>('full');
  const [strictAadhaar, setStrictAadhaar] = useState<boolean>(false);
  const [allowInvalidAadhaarPrefix, setAllowInvalidAadhaarPrefix] =
    useState<boolean>(false);
  const [enabledTypes, setEnabledTypes] = useState<Record<PiiType, boolean>>(
    DEFAULT_ENABLED_TYPES
  );
  const [testPassword, setTestPassword] = useState<string>('');
  const [checklistIds, setChecklistIds] = useState<Record<string, boolean>>({});
  const showcaseRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const { detections, isDetecting, durationMs } = useDetectionWorker(
    text,
    strictAadhaar,
    enabledTypes,
    allowInvalidAadhaarPrefix
  );

  const skippedAadhaarCandidates = useMemo(() => {
    if (
      allowInvalidAadhaarPrefix ||
      !enabledTypes.aadhaar ||
      !text ||
      text.length > 50_000
    ) {
      return [];
    }
    return findSkippedAadhaarPrefixCandidates(text);
  }, [text, allowInvalidAadhaarPrefix, enabledTypes.aadhaar]);

  const redactionResult = useMemo(
    () => redactText(text, detections, mode),
    [text, detections, mode]
  );

  const handleTextChange = (nextText: string) => {
    setText(nextText);
    if (!nextText) {
      setFileName(null);
      setFileSizeBytes(null);
    }
  };

  const handleFileLoaded = (content: string, name: string, sizeBytes: number) => {
    setText(content);
    setFileName(name);
    setFileSizeBytes(sizeBytes);
  };

  const handleLoadSample = () => {
    setText(NOISY_SAMPLE_TEXT);
    setFileName('noisy_sample.txt');
    setFileSizeBytes(new Blob([NOISY_SAMPLE_TEXT]).size);
  };

  const handleLoadSampleAndScroll = () => {
    setPageView('portal');
    setActiveTab('workbench');
    handleLoadSample();
    requestAnimationFrame(() => {
      showcaseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleJumpToChat = () => {
    setPageView('portal');
    requestAnimationFrame(() => {
      document
        .getElementById('local-ai-chat')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleClear = () => {
    setText('');
    setFileName(null);
    setFileSizeBytes(null);
  };

  const handleToggleType = (type: PiiType) => {
    setEnabledTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleAppendAuditLogLine = (line: string) => {
    setText((prev) => (prev ? `${prev}\n${line}` : line));
  };

  const handlePurgeAllSessionData = () => {
    setText('');
    setFileName(null);
    setFileSizeBytes(null);
    setTestPassword('');
    setChecklistIds({});
  };

  const handleLoginSuccess = (user: SessionUser) => {
    setSessionUser(user);
    setPageView('portal');
  };

  const handleEnterAsGuest = (initialTab: PortalTab = 'workbench') => {
    setSessionUser({
      email: 'guest@local.session',
      role: 'guest',
      mfaVerified: false,
      signedInAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
    setActiveTab(initialTab);
    setPageView('portal');
  };

  const handleSignOut = () => {
    setSessionUser(null);
    setPageView('home');
  };

  return (
    <div className="aurora-wave-canvas relative flex min-h-screen flex-col text-slate-900 transition-colors dark:text-slate-100">
      <FluidAuroraBackdrop />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[#0B0F19] focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-white"
      >
        Skip to main content
      </a>

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode((prev) => !prev)}
          pageView={pageView}
          onNavigateView={setPageView}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onLoadSampleAndGo={handleLoadSampleAndScroll}
          onJumpToChat={handleJumpToChat}
          sessionUser={sessionUser}
          onSignOut={handleSignOut}
        />

        <main id="main-content" className="flex flex-1 flex-col">
          {pageView === 'home' && (
            <HomePage
              onGoToLogin={() => setPageView('login')}
              onEnterAsGuest={handleEnterAsGuest}
            />
          )}

          {pageView === 'login' && (
            <LoginPage
              onBackHome={() => setPageView('home')}
              onLoginSuccess={handleLoginSuccess}
            />
          )}

          {pageView === 'portal' && (
            <>
              {/* Hero Stage with Large Clearly Visible Background Cybersecurity Artwork */}
              <section className="mx-auto w-full max-w-7xl px-3 pb-6 pt-5 sm:px-6 sm:pt-7">
                <div className="relative overflow-hidden rounded-3xl border border-indigo-200/70 bg-white/80 px-6 py-8 shadow-lg shadow-indigo-950/10 backdrop-blur-md dark:border-slate-800 dark:bg-[#070E1F]/90 sm:px-10 sm:py-11">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-0 w-full overflow-hidden lg:w-[74%]"
                  >
                    <img
                      src={cyberLogo}
                      alt=""
                      className="hero-logo-fade h-full w-full object-cover object-center opacity-30 sm:opacity-45 lg:opacity-90 dark:opacity-50 lg:dark:opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent lg:from-white/95 lg:via-white/55 lg:to-transparent dark:from-[#070E1F] dark:via-[#070E1F]/80 dark:to-transparent lg:dark:from-[#070E1F]/95 lg:dark:via-[#070E1F]/55 lg:dark:to-transparent" />
                  </div>

                  <div className="relative z-10 max-w-xl">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-800 dark:text-sky-300">
                      PROTECT PRIVACY, SHARE SAFELY
                      {sessionUser ? ` · SESSION: ${sessionUser.email}` : ''}
                    </p>
                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B0F19] dark:text-white sm:text-5xl">
                      Dashboard
                      <br />
                      Cyber Security
                    </h1>
                    <p className="mt-3 max-w-lg text-xs leading-relaxed text-slate-800 dark:text-slate-200 sm:text-sm">
                      Sanitize emails, phones, IPs, PAN, Aadhaar &amp; cards in
                      a local Web Worker, verify camera full-mask privacy, check
                      passwords, practice phishing defense, and chat with our
                      offline AI assistant.
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleLoadSampleAndScroll}
                        className="rounded-full bg-[#0B0F19] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-indigo-950 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                      >
                        Load Official Sample
                      </button>
                      <button
                        type="button"
                        onClick={handleJumpToChat}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white/95 px-4 py-2.5 text-xs font-bold text-slate-900 shadow-xs transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100"
                      >
                        <Bot className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                        <span>Ask Local AI Assistant</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Safari-Style Browser Window with Deep-Navy Left Sidebar */}
              <section
                ref={showcaseRef}
                className="mx-auto w-full max-w-7xl px-3 pb-6 sm:px-6"
              >
                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-2xl shadow-indigo-950/15 backdrop-blur-md dark:border-slate-800 dark:bg-[#0B1120]/95 dark:shadow-black/50">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-100/90 px-4 py-2 dark:border-slate-800 dark:bg-[#080D1A]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400" aria-hidden="true" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden="true" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
                    </div>

                    <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-4 py-0.5 font-mono text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      <Lock className="h-2.5 w-2.5 text-emerald-600" aria-hidden="true" />
                      <span>
                        local://cybershield.client-only · connect-src &apos;none&apos;
                      </span>
                    </div>

                    <span className="hidden font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 sm:inline">
                      100% LOCAL
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    <aside
                      aria-label="Dashboard modules"
                      className="flex flex-col justify-between bg-[#0A1F44] p-3 text-slate-200 lg:col-span-2"
                    >
                      <div>
                        <div className="mb-4 flex items-center gap-2 border-b border-white/10 px-2 pb-3">
                          <ShieldCheck
                            className="h-5 w-5 text-sky-300"
                            aria-hidden="true"
                          />
                          <span className="text-xs font-extrabold tracking-wide text-white">
                            CYBERSHIELD
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1">
                          {SIDEBAR_ITEMS.map(({ id, label, icon: Icon }) => {
                            const active = activeTab === id;
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => setActiveTab(id)}
                                aria-current={active ? 'page' : undefined}
                                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition ${
                                  active
                                    ? 'bg-white/15 text-white shadow-xs ring-1 ring-white/15'
                                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                <span className="truncate">{label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-4 hidden space-y-1.5 border-t border-white/10 pt-3 lg:block">
                        <button
                          type="button"
                          onClick={handleJumpToChat}
                          className="flex w-full items-center gap-2 rounded-lg bg-indigo-500/25 px-2.5 py-2 text-left text-xs font-semibold text-indigo-100 ring-1 ring-indigo-400/30 transition hover:bg-indigo-500/40"
                        >
                          <Bot className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>Local AI Chat</span>
                        </button>
                        <button
                          type="button"
                          onClick={handlePurgeAllSessionData}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-rose-200 transition hover:bg-rose-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>Purge RAM</span>
                        </button>
                      </div>
                    </aside>

                    <div className="flex flex-col gap-4 bg-[#F6F8FC]/95 p-4 dark:bg-[#0B1222]/95 sm:p-5 lg:col-span-10">
                      {activeTab === 'workbench' && (
                        <>
                          <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
                            <div className="xl:col-span-7">
                              <InputPanel
                                text={text}
                                fileName={fileName}
                                fileSizeBytes={fileSizeBytes}
                                skippedAadhaarCandidates={
                                  skippedAadhaarCandidates
                                }
                                onEnableInvalidAadhaarPrefix={() =>
                                  setAllowInvalidAadhaarPrefix(true)
                                }
                                onTextChange={handleTextChange}
                                onFileLoaded={handleFileLoaded}
                                onLoadSample={handleLoadSample}
                                onClear={handleClear}
                              />
                            </div>

                            <div className="xl:col-span-5">
                              <ControlsBar
                                mode={mode}
                                onModeChange={setMode}
                                enabledTypes={enabledTypes}
                                onToggleType={handleToggleType}
                                onEnableAllTypes={() =>
                                  setEnabledTypes(DEFAULT_ENABLED_TYPES)
                                }
                                strictAadhaar={strictAadhaar}
                                onToggleStrictAadhaar={() =>
                                  setStrictAadhaar((prev) => !prev)
                                }
                                allowInvalidAadhaarPrefix={
                                  allowInvalidAadhaarPrefix
                                }
                                onToggleAllowInvalidAadhaarPrefix={() =>
                                  setAllowInvalidAadhaarPrefix((prev) => !prev)
                                }
                                countByType={redactionResult.summary.countByType}
                              />
                            </div>
                          </div>

                          <TelemetryExportBar
                            summary={redactionResult.summary}
                            durationMs={durationMs}
                            hasText={Boolean(text)}
                            isDetecting={isDetecting}
                            sanitizedText={redactionResult.sanitizedText}
                            fileName={fileName}
                          />

                          <AuditView
                            originalText={text}
                            sanitizedText={redactionResult.sanitizedText}
                            spans={redactionResult.spans}
                            isDetecting={isDetecting}
                            onLoadSample={handleLoadSample}
                          />
                        </>
                      )}

                      {activeTab === 'camera' && (
                        <LiveCameraPanel
                          onAppendAuditLogLine={handleAppendAuditLogLine}
                        />
                      )}
                      {activeTab === 'password' && (
                        <PasswordCheckerPanel
                          password={testPassword}
                          onPasswordChange={setTestPassword}
                        />
                      )}
                      {activeTab === 'phishing' && <PhishingQuizPanel />}
                      {activeTab === 'checklist' && (
                        <PrivacyChecklistPanel
                          checkedIds={checklistIds}
                          onToggleItem={(id) =>
                            setChecklistIds((prev) => ({
                              ...prev,
                              [id]: !prev[id],
                            }))
                          }
                          onResetChecklist={() => setChecklistIds({})}
                        />
                      )}
                      {activeTab === 'articles' && <ArticlesPanel />}
                      {activeTab === 'legal' && (
                        <GovernanceLegalView
                          onPurgeAllSessionData={handlePurgeAllSessionData}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Local AI Chat Assistant placed at the bottom of the main webpage */}
              <LocalChatAssistant
                context={{
                  hasDocument: Boolean(text),
                  summary: redactionResult.summary,
                  mode,
                  strictAadhaar,
                  enabledTypes,
                }}
              />
            </>
          )}
        </main>

        <Footer
          onNavigate={(tab) => {
            setPageView('portal');
            setActiveTab(tab);
          }}
        />
      </div>
    </div>
  );
}

export default App;
