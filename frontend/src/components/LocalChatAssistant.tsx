import { useRef, useState, type FormEvent } from 'react';
import { Bot, Lock, Send, Sparkles, Trash2, User } from 'lucide-react';
import {
  generateLocalAssistantReply,
  type AssistantContext,
  type ChatMessage,
} from '@backend/engine/localChatAssistant';

interface LocalChatAssistantProps {
  context: AssistantContext;
}

const SUGGESTED_QUERIES = [
  'Explain my current scan summary',
  'Why was 4111 1111 1111 1112 not flagged?',
  'scan: Contact alice@example.com or +91 98765-43210',
  'How does Consistent Pseudonymization work?',
  'What should a small business do after a data breach?',
];

export function LocalChatAssistant({ context }: LocalChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: 'Hello! I am your 100% offline Privacy & Cybersecurity Assistant. Ask me about your current PII scan, why a number passed or failed Luhn/Verhoeff, redaction modes, password strength, phishing red flags, or breach response steps—or type "scan: <your snippet>" to test a line locally.',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);
  const [input, setInput] = useState('');
  const threadRef = useRef<HTMLDivElement | null>(null);

  const sendQuery = (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    const now = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'user',
      text: trimmed,
      timestamp: now,
    };

    const replyText = generateLocalAssistantReply(trimmed, context);
    const botMsg: ChatMessage = {
      id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'assistant',
      text: replyText,
      timestamp: now,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput('');

    requestAnimationFrame(() => {
      if (threadRef.current) {
        threadRef.current.scrollTop = threadRef.current.scrollHeight;
      }
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendQuery(input);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        text: 'Conversation cleared from volatile memory. Ask any PII redaction, password, phishing, or privacy question below.',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
  };

  return (
    <section
      id="local-ai-chat"
      aria-labelledby="chat-assistant-heading"
      className="mx-auto w-full max-w-7xl px-3 pb-10 sm:px-6"
    >
      <div className="overflow-hidden rounded-2xl border border-indigo-200/80 bg-white/92 shadow-xl shadow-indigo-950/10 backdrop-blur-md dark:border-indigo-900/60 dark:bg-[#0B1120]/92 dark:shadow-black/40">
        {/* Chat Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-[#0A1F44] via-[#1E1B4B] to-[#312E81] px-5 py-3.5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <Bot className="h-5 w-5 text-indigo-200" aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="chat-assistant-heading" className="text-sm font-bold">
                  Local Security &amp; Privacy AI Assistant
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                  <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                  <span>100% OFFLINE · ZERO API</span>
                </span>
              </div>
              <p className="text-[11px] text-indigo-100/80">
                Discuss your scan results, test snippets locally, or ask about
                cybersecurity &amp; compliance—powered strictly by on-device rules
                (no external LLM calls).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearChat}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Clear Chat</span>
          </button>
        </div>

        {/* Suggested Starter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200/80 bg-slate-50/90 px-4 py-2.5 dark:border-slate-800 dark:bg-[#080D1A] sm:px-5">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <Sparkles className="h-3 w-3 text-indigo-500" aria-hidden="true" />
            <span>Quick prompts:</span>
          </span>
          {SUGGESTED_QUERIES.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendQuery(prompt)}
              className="rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-medium text-indigo-900 transition hover:border-indigo-400 hover:bg-indigo-50 dark:border-indigo-800/70 dark:bg-slate-900 dark:text-indigo-200 dark:hover:bg-indigo-950/60"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Thread (Text-Only React Nodes) */}
        <div
          ref={threadRef}
          role="log"
          aria-live="polite"
          aria-label="Local AI chat conversation"
          className="h-72 space-y-3 overflow-y-auto px-4 py-4 sm:px-5"
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${
                  isUser ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    isUser
                      ? 'bg-[#0A1F44] text-white dark:bg-indigo-600'
                      : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                  }`}
                >
                  {isUser ? (
                    <User className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Bot className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </div>

                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[#0A1F44] text-white dark:bg-indigo-600'
                      : 'border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span
                    className={`mt-1 block font-mono text-[9px] ${
                      isUser ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 dark:border-slate-800 dark:bg-[#0B1120] sm:px-5"
        >
          <label htmlFor="local-chat-input" className="sr-only">
            Ask a cybersecurity, PII, or privacy query
          </label>
          <input
            id="local-chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Ask about your scan, Luhn/Verhoeff, phishing, passwords, or type "scan: <text>"…'
            className="flex-1 rounded-xl border border-slate-600 bg-[#0F172A] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-400 focus:border-indigo-400 focus:bg-[#0F172A] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B0F19] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-900 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </section>
  );
}
