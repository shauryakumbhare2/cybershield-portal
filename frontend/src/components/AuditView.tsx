import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Columns2, Loader2, ShieldAlert, Sparkles } from 'lucide-react';
import type { RedactionSpan } from '@backend/engine/types';
import { PII_TYPE_META } from './piiMeta';

const ROW_HEIGHT_PX = 24;
const VIEWPORT_HEIGHT_PX = 432;
const VIRTUALIZE_THRESHOLD = 500;
const OVERSCAN_ROWS = 20;

interface LineSlice {
  text: string;
  start: number;
  end: number;
}

interface AuditViewProps {
  originalText: string;
  sanitizedText: string;
  spans: RedactionSpan[];
  isDetecting: boolean;
  onLoadSample?: () => void;
}

function splitLinesWithOffsets(text: string): LineSlice[] {
  if (!text) {
    return [];
  }

  const lines: LineSlice[] = [];
  let lineStart = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    if (ch === 13 /* \r */) {
      lines.push({ text: text.slice(lineStart, i), start: lineStart, end: i });
      if (text.charCodeAt(i + 1) === 10 /* \n */) {
        i++;
      }
      lineStart = i + 1;
    } else if (ch === 10 /* \n */) {
      lines.push({ text: text.slice(lineStart, i), start: lineStart, end: i });
      lineStart = i + 1;
    }
  }

  lines.push({
    text: text.slice(lineStart),
    start: lineStart,
    end: text.length,
  });

  return lines;
}

function bucketSpansByLine(
  lines: LineSlice[],
  spans: RedactionSpan[],
  kind: 'original' | 'sanitized'
): RedactionSpan[][] {
  const buckets: RedactionSpan[][] = lines.map(() => []);
  if (lines.length === 0 || spans.length === 0) {
    return buckets;
  }

  let lineIdx = 0;
  for (const span of spans) {
    const start = kind === 'original' ? span.originalStart : span.sanitizedStart;
    while (lineIdx < lines.length - 1 && start > lines[lineIdx].end) {
      lineIdx++;
    }
    if (start >= lines[lineIdx].start && start <= lines[lineIdx].end) {
      buckets[lineIdx].push(span);
    }
  }

  return buckets;
}

function renderHighlightedLine(
  line: LineSlice,
  lineSpans: RedactionSpan[],
  kind: 'original' | 'sanitized'
): ReactNode {
  if (lineSpans.length === 0) {
    return line.text || '\u00A0';
  }

  const nodes: ReactNode[] = [];
  let cursor = 0;

  lineSpans.forEach((span, idx) => {
    const relStart =
      (kind === 'original' ? span.originalStart : span.sanitizedStart) -
      line.start;
    const relEnd =
      (kind === 'original' ? span.originalEnd : span.sanitizedEnd) - line.start;

    if (relStart > cursor) {
      nodes.push(line.text.slice(cursor, relStart));
    }

    const meta = PII_TYPE_META[span.type];
    const segmentText = line.text.slice(relStart, relEnd);

    nodes.push(
      <mark
        key={`${span.originalStart}-${idx}`}
        data-pii-type={span.type}
        title={`${meta.label} (${meta.shortTag})`}
        aria-label={`${meta.label}: ${segmentText}`}
        className={`group relative inline-flex items-center rounded px-1 py-0 font-medium ${meta.highlightClass}`}
      >
        <span>{segmentText}</span>
        <span
          aria-hidden="true"
          className={`ml-1 inline-block select-none rounded border px-1 py-0 text-[9px] font-bold leading-3.5 tracking-wider ${meta.badgeClass}`}
        >
          {meta.shortTag}
        </span>
      </mark>
    );

    cursor = relEnd;
  });

  if (cursor < line.text.length) {
    nodes.push(line.text.slice(cursor));
  }

  return nodes;
}

export function AuditView({
  originalText,
  sanitizedText,
  spans,
  isDetecting,
  onLoadSample,
}: AuditViewProps) {
  const [paneView, setPaneView] = useState<'split' | 'original' | 'sanitized'>('split');
  const originalScrollRef = useRef<HTMLDivElement | null>(null);
  const sanitizedScrollRef = useRef<HTMLDivElement | null>(null);
  const syncingSourceRef = useRef<'original' | 'sanitized' | null>(null);
  const topSpacerOrigRef = useRef<HTMLDivElement | null>(null);
  const bottomSpacerOrigRef = useRef<HTMLDivElement | null>(null);
  const topSpacerSanRef = useRef<HTMLDivElement | null>(null);
  const bottomSpacerSanRef = useRef<HTMLDivElement | null>(null);

  const [scrollTop, setScrollTop] = useState(0);

  const originalLines = useMemo(
    () => splitLinesWithOffsets(originalText),
    [originalText]
  );
  const sanitizedLines = useMemo(
    () => splitLinesWithOffsets(sanitizedText),
    [sanitizedText]
  );

  const originalBuckets = useMemo(
    () => bucketSpansByLine(originalLines, spans, 'original'),
    [originalLines, spans]
  );
  const sanitizedBuckets = useMemo(
    () => bucketSpansByLine(sanitizedLines, spans, 'sanitized'),
    [sanitizedLines, spans]
  );

  const isVirtualized = originalLines.length > VIRTUALIZE_THRESHOLD;
  const startRow = isVirtualized
    ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT_PX) - OVERSCAN_ROWS)
    : 0;
  const endRow = isVirtualized
    ? Math.min(
        originalLines.length,
        Math.ceil((scrollTop + VIEWPORT_HEIGHT_PX) / ROW_HEIGHT_PX) +
          OVERSCAN_ROWS
      )
    : originalLines.length;

  useLayoutEffect(() => {
    const topPx = isVirtualized ? `${startRow * ROW_HEIGHT_PX}px` : '0px';
    const bottomPx = isVirtualized
      ? `${Math.max(0, originalLines.length - endRow) * ROW_HEIGHT_PX}px`
      : '0px';

    if (topSpacerOrigRef.current) topSpacerOrigRef.current.style.height = topPx;
    if (bottomSpacerOrigRef.current)
      bottomSpacerOrigRef.current.style.height = bottomPx;
    if (topSpacerSanRef.current) topSpacerSanRef.current.style.height = topPx;
    if (bottomSpacerSanRef.current)
      bottomSpacerSanRef.current.style.height = bottomPx;
  }, [isVirtualized, startRow, endRow, originalLines.length]);

  const handleSyncScroll = useCallback((source: 'original' | 'sanitized') => {
    if (syncingSourceRef.current && syncingSourceRef.current !== source) {
      return;
    }

    const fromEl =
      source === 'original'
        ? originalScrollRef.current
        : sanitizedScrollRef.current;
    const toEl =
      source === 'original'
        ? sanitizedScrollRef.current
        : originalScrollRef.current;

    if (!fromEl || !toEl) {
      return;
    }

    syncingSourceRef.current = source;
    toEl.scrollTop = fromEl.scrollTop;
    toEl.scrollLeft = fromEl.scrollLeft;

    if (isVirtualized) {
      setScrollTop(fromEl.scrollTop);
    }

    requestAnimationFrame(() => {
      syncingSourceRef.current = null;
    });
  }, [isVirtualized]);

  if (!originalText) {
    return (
      <section
        aria-label="Audit View Empty State"
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300/90 bg-white/85 px-6 py-12 text-center shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700/80 dark:bg-[#0B172A]/85 dark:shadow-black/30"
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-[#0B1F3A] dark:bg-slate-800 dark:text-sky-300">
          <ShieldAlert className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Ready for Client-Side PII Audit
        </h3>
        <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
          Paste logs, tickets, resumes, clinical notes, or drop a{' '}
          <code>.txt</code>/<code>.csv</code> file above to inspect original vs.
          sanitized output side-by-side.
        </p>
        {onLoadSample && (
          <button
            type="button"
            onClick={onLoadSample}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F3A] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#13325C] dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Load Noisy Sample to Preview</span>
          </button>
        )}
      </section>
    );
  }

  const visibleOrigLines = originalLines.slice(startRow, endRow);
  const visibleSanLines = sanitizedLines.slice(startRow, endRow);

  return (
    <section
      aria-labelledby="audit-heading"
      className="rounded-xl border border-slate-200/90 bg-white/92 shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700/70 dark:bg-[#0B172A]/90 dark:shadow-black/30"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 items-center rounded-md bg-blue-50 px-2 font-mono text-[10px] font-bold text-blue-800 ring-1 ring-blue-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-800">
              04 · AUDIT VIEW
            </span>
            <h2
              id="audit-heading"
              className="text-sm font-bold text-slate-900 dark:text-slate-100"
            >
              Side-by-Side Compliance Audit
            </h2>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Synchronized line-by-line diff · Hover any highlighted span to view
            its PII type
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDetecting && (
            <div
              role="status"
              aria-live="polite"
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              <span>Detecting PII…</span>
            </div>
          )}

          <div
            role="group"
            aria-label="Audit panel layout"
            className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-semibold dark:border-slate-700 dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={() => setPaneView('split')}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition ${
                paneView === 'split'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Columns2 className="h-3 w-3" aria-hidden="true" />
              <span>Split</span>
            </button>
            <button
              type="button"
              onClick={() => setPaneView('original')}
              className={`rounded-md px-2.5 py-1 transition ${
                paneView === 'original'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Original
            </button>
            <button
              type="button"
              onClick={() => setPaneView('sanitized')}
              className={`rounded-md px-2.5 py-1 transition ${
                paneView === 'sanitized'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Sanitized
            </button>
          </div>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 divide-y divide-slate-200 dark:divide-slate-800 ${
          paneView === 'split' ? 'lg:grid-cols-2 lg:divide-x lg:divide-y-0' : ''
        }`}
      >
        {/* Original Panel */}
        <div
          className={`flex min-w-0 flex-col ${
            paneView === 'sanitized' ? 'hidden' : ''
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
            <span>Original Input</span>
            <span className="font-mono text-[11px] font-normal text-slate-400">
              {originalLines.length.toLocaleString()} lines
            </span>
          </div>

          <div
            ref={originalScrollRef}
            onScroll={() => handleSyncScroll('original')}
            tabIndex={0}
            aria-label="Original text panel"
            className="h-[432px] overflow-auto bg-white font-mono text-xs text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 dark:bg-slate-900 dark:text-slate-200"
          >
            <div className="min-w-max">
              {isVirtualized && <div ref={topSpacerOrigRef} aria-hidden="true" />}
              {visibleOrigLines.map((line, offset) => {
                const lineIdx = startRow + offset;
                return (
                  <div
                    key={lineIdx}
                    className="flex h-6 items-center leading-6 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <span
                      aria-hidden="true"
                      className="sticky left-0 z-10 w-12 shrink-0 select-none border-r border-slate-100 bg-slate-50/95 pr-2.5 text-right text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-500"
                    >
                      {lineIdx + 1}
                    </span>
                    <span className="whitespace-pre px-3">
                      {renderHighlightedLine(
                        line,
                        originalBuckets[lineIdx] ?? [],
                        'original'
                      )}
                    </span>
                  </div>
                );
              })}
              {isVirtualized && (
                <div ref={bottomSpacerOrigRef} aria-hidden="true" />
              )}
            </div>
          </div>
        </div>

        {/* Sanitized Panel */}
        <div
          className={`flex min-w-0 flex-col ${
            paneView === 'original' ? 'hidden' : ''
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
            <span>Sanitized Output</span>
            <span className="font-mono text-[11px] font-normal text-slate-400">
              {spans.length} redacted
            </span>
          </div>

          <div
            ref={sanitizedScrollRef}
            onScroll={() => handleSyncScroll('sanitized')}
            tabIndex={0}
            aria-label="Sanitized text panel"
            className="h-[432px] overflow-auto bg-white font-mono text-xs text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 dark:bg-slate-900 dark:text-slate-200"
          >
            <div className="min-w-max">
              {isVirtualized && <div ref={topSpacerSanRef} aria-hidden="true" />}
              {visibleSanLines.map((line, offset) => {
                const lineIdx = startRow + offset;
                return (
                  <div
                    key={lineIdx}
                    className="flex h-6 items-center leading-6 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <span
                      aria-hidden="true"
                      className="sticky left-0 z-10 w-12 shrink-0 select-none border-r border-slate-100 bg-slate-50/95 pr-2.5 text-right text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-500"
                    >
                      {lineIdx + 1}
                    </span>
                    <span className="whitespace-pre px-3">
                      {renderHighlightedLine(
                        line,
                        sanitizedBuckets[lineIdx] ?? [],
                        'sanitized'
                      )}
                    </span>
                  </div>
                );
              })}
              {isVirtualized && (
                <div ref={bottomSpacerSanRef} aria-hidden="true" />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
