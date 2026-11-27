import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  AlertCircle,
  FileText,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

interface InputPanelProps {
  text: string;
  fileName: string | null;
  fileSizeBytes: number | null;
  skippedAadhaarCandidates?: string[];
  onEnableInvalidAadhaarPrefix?: () => void;
  onTextChange: (nextText: string) => void;
  onFileLoaded: (content: string, name: string, sizeBytes: number) => void;
  onLoadSample: () => void;
  onClear: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function InputPanel({
  text,
  fileName,
  fileSizeBytes,
  skippedAadhaarCandidates = [],
  onEnableInvalidAadhaarPrefix,
  onTextChange,
  onFileLoaded,
  onLoadSample,
  onClear,
}: InputPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validateAndReadFile = (file: File) => {
    setErrorMsg(null);
    const lowerName = file.name.toLowerCase();
    const extMatch = lowerName.match(/\.([a-z0-9]+)$/);
    const ext = extMatch ? `.${extMatch[1]}` : '';

    if (ext !== '.txt' && ext !== '.csv') {
      setErrorMsg(
        `Unsupported file "${file.name}". Only .txt and .csv files up to 5 MB are allowed.`
      );
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setErrorMsg(
        `File "${file.name}" is ${formatBytes(file.size)}, which exceeds the 5 MB limit.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onFileLoaded(reader.result, file.name, file.size);
      } else {
        setErrorMsg('Unable to read file as UTF-8 text.');
      }
    };
    reader.onerror = () => {
      setErrorMsg(`Failed to read "${file.name}". Please try again.`);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndReadFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndReadFile(file);
    }
  };

  const lineCount = text ? text.split(/\r\n|\r|\n/).length : 0;

  return (
    <section
      aria-labelledby="input-heading"
      className="flex h-full flex-col rounded-xl border border-slate-200/90 bg-white/90 p-4 shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700/70 dark:bg-[#0B172A]/88 dark:shadow-black/30 sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-5 items-center rounded-md bg-blue-50 px-2 font-mono text-[10px] font-bold text-blue-800 ring-1 ring-blue-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-800">
            01 · INPUT
          </span>
          <h2
            id="input-heading"
            className="text-sm font-bold text-slate-900 dark:text-slate-100"
          >
            Paste Text or Upload File
          </h2>
          {fileName && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <FileText className="h-3 w-3" aria-hidden="true" />
              <span className="max-w-[140px] truncate">{fileName}</span>
              {fileSizeBytes !== null && (
                <span className="text-slate-400">· {formatBytes(fileSizeBytes)}</span>
              )}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv,text/plain,text/csv"
            onChange={handleFileChange}
            className="sr-only"
            id="pii-file-upload"
            aria-label="Upload .txt or .csv file"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Upload .txt / .csv</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              onLoadSample();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F3A] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#13325C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Load Noisy Sample</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              onClear();
            }}
            disabled={!text && !fileName}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mb-3 flex items-start justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-800/70 dark:bg-rose-950/60 dark:text-rose-200"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            aria-label="Dismiss error"
            className="rounded p-0.5 hover:bg-rose-100 dark:hover:bg-rose-900"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex-1 rounded-xl border transition ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/30 dark:border-sky-400 dark:bg-sky-950/30'
            : 'border-slate-200 bg-slate-50/80 dark:border-slate-700/80 dark:bg-[#07111F]'
        }`}
      >
        <label htmlFor="pii-text-input" className="sr-only">
          Paste logs, support tickets, resumes, clinical notes, or CSV text
        </label>
        <textarea
          id="pii-text-input"
          value={text}
          onChange={(e) => {
            setErrorMsg(null);
            onTextChange(e.target.value);
          }}
          rows={8}
          spellCheck={false}
          placeholder="Paste server logs, support tickets, resumes, clinical notes, or CSV text — or drag & drop a .txt / .csv file (max 5 MB)..."
          className="block h-full min-h-[190px] w-full resize-y rounded-xl bg-transparent p-3.5 font-mono text-xs leading-relaxed text-slate-800 placeholder:font-sans placeholder:text-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
        />

        {isDragging && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-blue-50/90 dark:bg-slate-900/90">
            <p className="text-sm font-semibold text-blue-700 dark:text-sky-300">
              Drop .txt or .csv file here (up to 5 MB)
            </p>
          </div>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span>Drag &amp; drop .txt or .csv up to 5 MB · Processed in memory</span>
        <span className="font-mono">
          {lineCount.toLocaleString()} lines · {text.length.toLocaleString()} chars
        </span>
      </div>

      {skippedAadhaarCandidates.length > 0 && (
        <div
          role="status"
          className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-800/70 dark:bg-amber-950/50 dark:text-amber-200"
        >
          <span>
            <strong className="font-semibold">Aadhaar rule note:</strong>{' '}
            <code className="font-mono font-bold">
              {skippedAadhaarCandidates[0]}
            </code>{' '}
            starts with <code>{skippedAadhaarCandidates[0][0]}</code>. Official
            UIDAI Aadhaar numbers start with digits <strong>2–9</strong> (e.g.{' '}
            <code className="font-mono">
              2{skippedAadhaarCandidates[0].slice(1)}
            </code>
            ).
          </span>
          {onEnableInvalidAadhaarPrefix && (
            <button
              type="button"
              onClick={onEnableInvalidAadhaarPrefix}
              className="rounded-md bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-amber-500"
            >
              Match 0/1 prefix anyway
            </button>
          )}
        </div>
      )}
    </section>
  );
}
