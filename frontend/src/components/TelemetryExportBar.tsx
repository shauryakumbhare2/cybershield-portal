import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import type { SummaryStats } from '@backend/engine/types';

interface TelemetryExportBarProps {
  summary: SummaryStats;
  durationMs: number | null;
  hasText: boolean;
  isDetecting: boolean;
  sanitizedText: string;
  fileName: string | null;
}

function getSanitizedDownloadMeta(fileName: string | null): {
  downloadName: string;
  mimeType: string;
} {
  if (!fileName) {
    return {
      downloadName: 'document_sanitized.txt',
      mimeType: 'text/plain;charset=utf-8',
    };
  }

  const lower = fileName.toLowerCase();
  if (lower.endsWith('.csv')) {
    const base = fileName.slice(0, -4) || 'document';
    return {
      downloadName: `${base}_sanitized.csv`,
      mimeType: 'text/csv;charset=utf-8',
    };
  }

  if (lower.endsWith('.txt')) {
    const base = fileName.slice(0, -4) || 'document';
    return {
      downloadName: `${base}_sanitized.txt`,
      mimeType: 'text/plain;charset=utf-8',
    };
  }

  return {
    downloadName: `${fileName}_sanitized.txt`,
    mimeType: 'text/plain;charset=utf-8',
  };
}

export function TelemetryExportBar({
  summary,
  durationMs,
  hasText,
  isDetecting,
  sanitizedText,
  fileName,
}: TelemetryExportBarProps) {
  const [copied, setCopied] = useState(false);
  const disabled = !hasText || isDetecting;
  const { downloadName, mimeType } = getSanitizedDownloadMeta(fileName);

  const handleDownload = () => {
    if (disabled) return;
    const blob = new Blob([sanitizedText], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = downloadName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (disabled) return;
    try {
      await navigator.clipboard.writeText(sanitizedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = sanitizedText;
      textarea.setAttribute('readonly', '');
      textarea.className = 'sr-only';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section
      aria-label="Detection Summary and Export Actions"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white/90 px-4 py-3 shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700/70 dark:bg-[#0B172A]/88 dark:shadow-black/30 sm:px-5"
    >
      {/* Left: Summary Metrics */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex h-5 items-center rounded-md bg-blue-50 px-2 font-mono text-[10px] font-bold text-blue-800 ring-1 ring-blue-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-800">
          03 · SUMMARY &amp; EXPORT
        </span>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#0B1F3A] px-2.5 py-1 font-medium text-white dark:bg-slate-100 dark:text-slate-900">
            <span>Detections:</span>
            <span className="font-mono font-bold">
              {summary.totalDetections}
            </span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <span>Unique Values:</span>
            <span className="font-mono font-bold">{summary.uniqueValues}</span>
          </span>

          {hasText && (
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              {isDetecting
                ? 'Worker scanning…'
                : durationMs !== null
                  ? `${durationMs} ms`
                  : ''}
            </span>
          )}
        </div>
      </div>

      {/* Right: One-Click Export */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Copy to clipboard</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Download {downloadName}</span>
        </button>
      </div>
    </section>
  );
}
