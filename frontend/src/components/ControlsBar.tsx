import { RotateCcw } from 'lucide-react';
import { ALL_PII_TYPES, type PiiType, type RedactionMode } from '@backend/engine/types';
import { PII_TYPE_META, REDACTION_MODES } from './piiMeta';

const SHORT_RULE_LABEL: Record<PiiType, string> = {
  email: 'Subdomain + Plus',
  card: 'Luhn · 13–19d',
  aadhaar: '2–9 · 12d',
  pan: '5L+4D+1L',
  ip: 'IPv4 + IPv6',
  phone: '+91 / 0 / +Intl',
};

interface ControlsBarProps {
  mode: RedactionMode;
  onModeChange: (mode: RedactionMode) => void;
  enabledTypes: Record<PiiType, boolean>;
  onToggleType: (type: PiiType) => void;
  onEnableAllTypes: () => void;
  strictAadhaar: boolean;
  onToggleStrictAadhaar: () => void;
  allowInvalidAadhaarPrefix: boolean;
  onToggleAllowInvalidAadhaarPrefix: () => void;
  countByType: Record<PiiType, number>;
}

export function ControlsBar({
  mode,
  onModeChange,
  enabledTypes,
  onToggleType,
  onEnableAllTypes,
  strictAadhaar,
  onToggleStrictAadhaar,
  allowInvalidAadhaarPrefix,
  onToggleAllowInvalidAadhaarPrefix,
  countByType,
}: ControlsBarProps) {
  const activeCount = ALL_PII_TYPES.filter((t) => enabledTypes[t]).length;

  return (
    <section
      aria-labelledby="controls-heading"
      className="flex h-full flex-col justify-between rounded-xl border border-slate-200/90 bg-white/90 p-4 shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700/70 dark:bg-[#0B172A]/88 dark:shadow-black/30 sm:p-5"
    >
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 items-center rounded-md bg-blue-50 px-2 font-mono text-[10px] font-bold text-blue-800 ring-1 ring-blue-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-800">
              02 · POLICY
            </span>
            <h2
              id="controls-heading"
              className="text-sm font-bold text-slate-900 dark:text-slate-100"
            >
              Redaction &amp; Detectors
            </h2>
          </div>

          <span className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            {activeCount}/{ALL_PII_TYPES.length} active
          </span>
        </div>

        {/* Redaction Mode Segmented Selector */}
        <div className="mb-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Redaction Mode
          </p>
          <div
            role="radiogroup"
            aria-label="Redaction Mode"
            className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-[#07111F]"
          >
            {REDACTION_MODES.map((item) => {
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onModeChange(item.id)}
                  title={item.description}
                  className={`flex flex-col items-center rounded-lg px-2 py-2 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                    active
                      ? 'bg-[#0B1F3A] text-white shadow-xs dark:bg-emerald-600 dark:text-white'
                      : 'text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="text-[11px] font-bold leading-tight">
                    {item.id === 'pseudonym' ? 'Pseudonym' : item.label}
                  </span>
                  <span
                    className={`mt-0.5 max-w-full truncate font-mono text-[9px] ${
                      active
                        ? 'text-emerald-200 dark:text-emerald-100'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {item.id === 'full'
                      ? '[REDACTED]'
                      : item.id === 'partial'
                        ? 'j***@ / XXXX'
                        : 'USER_01'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active PII Detectors Grid */}
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active PII Detectors
            </p>
            {activeCount < ALL_PII_TYPES.length && (
              <button
                type="button"
                onClick={onEnableAllTypes}
                className="inline-flex items-center gap-1 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-2.5 w-2.5" aria-hidden="true" />
                <span>Reset all</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {ALL_PII_TYPES.map((type) => {
              const meta = PII_TYPE_META[type];
              const checked = enabledTypes[type];
              const hits = countByType[type];
              return (
                <button
                  key={type}
                  type="button"
                  role="switch"
                  aria-checked={checked}
                  onClick={() => onToggleType(type)}
                  title={meta.description}
                  className={`flex items-center justify-between gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                    checked
                      ? meta.badgeClass
                      : 'border-slate-200 bg-slate-50/70 text-slate-400 opacity-75 hover:opacity-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          checked ? meta.dotClass : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                        aria-hidden="true"
                      />
                      <span
                        className={`truncate text-[11px] font-semibold ${
                          checked ? '' : 'line-through'
                        }`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="truncate font-mono text-[9px] opacity-75">
                      {SHORT_RULE_LABEL[type]}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                      checked
                        ? 'bg-white/80 text-slate-900 dark:bg-slate-950/60 dark:text-slate-100'
                        : 'bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {checked ? hits : 'OFF'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Strict Aadhaar & Prefix Toggles */}
      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <label
          className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
            enabledTypes.aadhaar
              ? 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200'
              : 'cursor-not-allowed border-slate-200/60 bg-slate-50/40 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500'
          }`}
          title="When enabled, Aadhaar candidates must pass the 12-digit Verhoeff checksum"
        >
          <div>
            <span className="font-semibold">
              Strict Aadhaar (Verhoeff checksum)
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Off by default · Validates 12-digit Verhoeff check digit
            </p>
          </div>
          <input
            type="checkbox"
            checked={strictAadhaar}
            disabled={!enabledTypes.aadhaar}
            onChange={onToggleStrictAadhaar}
            className="h-4 w-4 rounded border-slate-300 accent-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          />
        </label>

        <label
          className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            enabledTypes.aadhaar
              ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300'
              : 'cursor-not-allowed border-slate-200/60 bg-slate-50/40 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500'
          }`}
          title="Official UIDAI Aadhaar numbers start with 2–9. Enable this only to match arbitrary 0/1-prefixed 12-digit test inputs."
        >
          <div>
            <span className="font-semibold">
              Allow 0/1 Aadhaar test prefixes
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Off by default · Official Aadhaar starts with 2–9
            </p>
          </div>
          <input
            type="checkbox"
            checked={allowInvalidAadhaarPrefix}
            disabled={!enabledTypes.aadhaar}
            onChange={onToggleAllowInvalidAadhaarPrefix}
            className="h-4 w-4 rounded border-slate-300 accent-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
          />
        </label>
      </div>
    </section>
  );
}
