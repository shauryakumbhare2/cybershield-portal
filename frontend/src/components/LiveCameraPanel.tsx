import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CameraOff,
  CheckCircle2,
  Download,
  FilePlus2,
  ScanFace,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  analyzeFaceFrame,
  type FaceBox,
  type FaceMaskAnalysis,
  type MaskStatus,
} from '@backend/engine/faceMaskDetector';

interface NativeFaceDetector {
  detect: (
    source: HTMLVideoElement | HTMLCanvasElement
  ) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
}

declare global {
  interface Window {
    FaceDetector?: new (options?: {
      fastMode?: boolean;
      maxDetectedFaces?: number;
    }) => NativeFaceDetector;
  }
}

export interface SubmittedFaceRecord {
  id: string;
  timestamp: string;
  maskStatus: MaskStatus;
  confidence: number;
  privacyMasked: boolean;
  method: FaceMaskAnalysis['method'];
  previewDataUrl: string;
}

interface LiveCameraPanelProps {
  onAppendAuditLogLine?: (line: string) => void;
}

const MASK_STATUS_META: Record<
  MaskStatus,
  { label: string; badgeClass: string; strokeColor: string }
> = {
  masked: {
    label: 'FULL MASK DETECTED',
    badgeClass:
      'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-200',
    strokeColor: '#10b981',
  },
  partial_mask: {
    label: 'PARTIAL MASK',
    badgeClass:
      'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/70 dark:text-amber-200',
    strokeColor: '#f59e0b',
  },
  unmasked: {
    label: 'NO MASK / FACE EXPOSED',
    badgeClass:
      'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-700 dark:bg-rose-950/70 dark:text-rose-200',
    strokeColor: '#f43f5e',
  },
  no_face: {
    label: 'NO FACE IN FRAME',
    badgeClass:
      'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
    strokeColor: '#94a3b8',
  },
};

export function LiveCameraPanel({ onAppendAuditLogLine }: LiveCameraPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeDetectorRef = useRef<NativeFaceDetector | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [liveAnalysis, setLiveAnalysis] = useState<FaceMaskAnalysis | null>(null);
  const [applyPrivacyRedaction, setApplyPrivacyRedaction] = useState(true);

  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);
  const [capturedAnalysis, setCapturedAnalysis] =
    useState<FaceMaskAnalysis | null>(null);
  const [submissions, setSubmissions] = useState<SubmittedFaceRecord[]>([]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setLiveAnalysis(null);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.FaceDetector) {
      try {
        nativeDetectorRef.current = new window.FaceDetector({
          fastMode: true,
          maxDetectedFaces: 1,
        });
      } catch {
        nativeDetectorRef.current = null;
      }
    }
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Live camera API (navigator.mediaDevices.getUserMedia) is unavailable in this browser context.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Camera permission denied or device unavailable.';
      setCameraError(`Unable to access camera: ${msg}`);
      stopCamera();
    }
  };

  const runFrameAnalysis = useCallback(async (): Promise<FaceMaskAnalysis | null> => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      return null;
    }

    if (!analysisCanvasRef.current) {
      analysisCanvasRef.current = document.createElement('canvas');
    }
    const analysisCanvas = analysisCanvasRef.current;
    const sampleW = 160;
    const sampleH = Math.max(90, Math.round((video.videoHeight / video.videoWidth) * sampleW));
    analysisCanvas.width = sampleW;
    analysisCanvas.height = sampleH;

    const aCtx = analysisCanvas.getContext('2d', { willReadFrequently: true });
    if (!aCtx) return null;
    aCtx.drawImage(video, 0, 0, sampleW, sampleH);
    const frameData = aCtx.getImageData(0, 0, sampleW, sampleH);

    let nativeBoxes: FaceBox[] | undefined;
    if (nativeDetectorRef.current) {
      try {
        const faces = await nativeDetectorRef.current.detect(analysisCanvas);
        if (faces.length > 0) {
          nativeBoxes = faces.map((f) => ({
            x: f.boundingBox.x,
            y: f.boundingBox.y,
            width: f.boundingBox.width,
            height: f.boundingBox.height,
          }));
        }
      } catch {
        nativeBoxes = undefined;
      }
    }

    const result = analyzeFaceFrame(frameData, nativeBoxes);

    // Draw live overlay on video-sized canvas
    const overlay = overlayCanvasRef.current;
    if (overlay) {
      overlay.width = video.videoWidth;
      overlay.height = video.videoHeight;
      const oCtx = overlay.getContext('2d');
      if (oCtx) {
        oCtx.clearRect(0, 0, overlay.width, overlay.height);
        if (result.faceDetected && result.box) {
          const scaleX = overlay.width / sampleW;
          const scaleY = overlay.height / sampleH;
          const bx = result.box.x * scaleX;
          const by = result.box.y * scaleY;
          const bw = result.box.width * scaleX;
          const bh = result.box.height * scaleY;
          const meta = MASK_STATUS_META[result.maskStatus];

          oCtx.strokeStyle = meta.strokeColor;
          oCtx.lineWidth = 3;
          oCtx.strokeRect(bx, by, bw, bh);

          // Upper / lower zone divider line
          oCtx.setLineDash([5, 4]);
          oCtx.beginPath();
          oCtx.moveTo(bx, by + bh * 0.49);
          oCtx.lineTo(bx + bw, by + bh * 0.49);
          oCtx.stroke();
          oCtx.setLineDash([]);

          // Label pill
          const label = `${meta.label} (${result.confidence}%)`;
          oCtx.font = 'bold 12px ui-monospace, monospace';
          const textWidth = oCtx.measureText(label).width;
          oCtx.fillStyle = meta.strokeColor;
          oCtx.fillRect(bx, Math.max(0, by - 24), textWidth + 14, 22);
          oCtx.fillStyle = '#071426';
          oCtx.fillText(label, bx + 7, Math.max(15, by - 9));
        }
      }
    }

    setLiveAnalysis(result);
    return result;
  }, []);

  useEffect(() => {
    if (!cameraActive) return;
    let cancelled = false;
    const timer = window.setInterval(() => {
      if (!cancelled) {
        void runFrameAnalysis();
      }
    }, 180);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [cameraActive, runFrameAnalysis]);

  const handleFetchFaceLive = async () => {
    const video = videoRef.current;
    if (!video || !cameraActive) return;

    const analysis = (await runFrameAnalysis()) ?? liveAnalysis;
    if (!analysis) return;

    if (!captureCanvasRef.current) {
      captureCanvasRef.current = document.createElement('canvas');
    }
    const cCanvas = captureCanvasRef.current;
    cCanvas.width = video.videoWidth;
    cCanvas.height = video.videoHeight;
    const ctx = cCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, cCanvas.width, cCanvas.height);

    if (analysis.faceDetected && analysis.box) {
      const sampleW = 160;
      const sampleH = Math.max(90, Math.round((video.videoHeight / video.videoWidth) * sampleW));
      const scaleX = cCanvas.width / sampleW;
      const scaleY = cCanvas.height / sampleH;
      const bx = analysis.box.x * scaleX;
      const by = analysis.box.y * scaleY;
      const bw = analysis.box.width * scaleX;
      const bh = analysis.box.height * scaleY;

      if (applyPrivacyRedaction) {
        // Full-mask face PII redaction overlay directly on captured snapshot
        ctx.fillStyle = '#0B1F3A';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 14px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('[FACE REDACTED]', bx + bw / 2, by + bh / 2);
        ctx.textAlign = 'start';
      } else {
        ctx.strokeStyle = MASK_STATUS_META[analysis.maskStatus].strokeColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(bx, by, bw, bh);
      }
    }

    setCapturedPreviewUrl(cCanvas.toDataURL('image/png'));
    setCapturedAnalysis(analysis);
  };

  const handleSubmitFaceRecord = () => {
    if (!capturedPreviewUrl || !capturedAnalysis || !capturedAnalysis.faceDetected) {
      return;
    }

    const record: SubmittedFaceRecord = {
      id: `FACE-${String(submissions.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      maskStatus: capturedAnalysis.maskStatus,
      confidence: capturedAnalysis.confidence,
      privacyMasked: applyPrivacyRedaction,
      method: capturedAnalysis.method,
      previewDataUrl: capturedPreviewUrl,
    };

    setSubmissions((prev) => [record, ...prev]);

    if (onAppendAuditLogLine) {
      onAppendAuditLogLine(
        `[${record.timestamp}] LIVE_FACE_SUBMIT id=${record.id} mask_status=${record.maskStatus} confidence=${record.confidence}% face_redacted=${record.privacyMasked}`
      );
    }
  };

  const statusMeta = liveAnalysis
    ? MASK_STATUS_META[liveAnalysis.maskStatus]
    : MASK_STATUS_META.no_face;

  return (
    <div className="flex flex-col gap-5">
      <section
        aria-labelledby="live-camera-heading"
        className="rounded-xl border border-slate-200/90 bg-white/92 p-5 shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700/70 dark:bg-[#0B172A]/90 dark:shadow-black/30"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#0B1F3A] px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-white dark:bg-sky-950 dark:text-sky-300">
                LIVE BIOMETRIC CHECK
              </span>
              <span className="rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                100% LOCAL CANVAS · ZERO UPLOAD
              </span>
            </div>
            <h2
              id="live-camera-heading"
              className="mt-2 text-lg font-bold text-[#0B1F3A] dark:text-white"
            >
              Live Camera Full Mask Detection &amp; Face Capture
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Activates your camera strictly inside the browser, evaluates full
              face-mask coverage locally, optionally applies a{' '}
              <code className="font-mono">[FACE REDACTED]</code> privacy mask,
              and submits the verified record to your local audit ledger.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!cameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#13325C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1F3A] dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
                <span>Start Live Camera</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-800 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
              >
                <CameraOff className="h-4 w-4" aria-hidden="true" />
                <span>Stop Camera</span>
              </button>
            )}
          </div>
        </div>

        {cameraError && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{cameraError}</span>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Live Webcam Feed */}
          <div className="lg:col-span-7">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Live Camera Stream
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[11px] font-bold ${statusMeta.badgeClass}`}
              >
                <ScanFace className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {cameraActive
                    ? `${statusMeta.label}${liveAnalysis?.faceDetected ? ` · ${liveAnalysis.confidence}%` : ''}`
                    : 'CAMERA IDLE'}
                </span>
              </span>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-300 bg-slate-950 dark:border-slate-700">
              <video
                ref={videoRef}
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              <canvas
                ref={overlayCanvasRef}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-slate-300">
                  <Camera className="mb-2 h-9 w-9 text-slate-500" aria-hidden="true" />
                  <p className="text-xs font-semibold text-slate-200">
                    Camera feed is off
                  </p>
                  <p className="mt-1 max-w-xs text-[11px] text-slate-400">
                    Click <strong>Start Live Camera</strong> to detect your face
                    and full-mask status locally. No video frames leave this tab.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={applyPrivacyRedaction}
                  onChange={(e) => setApplyPrivacyRedaction(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                />
                <span>
                  Apply Full-Mask Redaction (<code className="font-mono">[FACE REDACTED]</code>) on capture
                </span>
              </label>

              <button
                type="button"
                onClick={handleFetchFaceLive}
                disabled={!cameraActive}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ScanFace className="h-4 w-4" aria-hidden="true" />
                <span>Fetch Face Live</span>
              </button>
            </div>
          </div>

          {/* Captured Preview & Submit */}
          <div className="lg:col-span-5">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Captured Face &amp; Submission Preview
              </span>
              {capturedAnalysis && (
                <span className="font-mono text-[11px] text-slate-500">
                  {capturedAnalysis.method === 'native-face-detector'
                    ? 'Native FaceDetector'
                    : 'Local YCbCr Analyzer'}
                </span>
              )}
            </div>

            <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70">
              {capturedPreviewUrl ? (
                <img
                  src={capturedPreviewUrl}
                  alt="Captured live face verification preview"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="px-4 text-center text-xs text-slate-500 dark:text-slate-400">
                  Capture a frame with <strong>Fetch Face Live</strong> to
                  inspect mask status before local submission.
                </div>
              )}
            </div>

            {capturedAnalysis && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Detection Result
                  </span>
                  <span
                    className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold ${
                      MASK_STATUS_META[capturedAnalysis.maskStatus].badgeClass
                    }`}
                  >
                    {MASK_STATUS_META[capturedAnalysis.maskStatus].label}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  <div>Conf: {capturedAnalysis.confidence}%</div>
                  <div>Upper: {Math.round(capturedAnalysis.upperSkinRatio * 100)}%</div>
                  <div>Lower: {Math.round(capturedAnalysis.lowerSkinRatio * 100)}%</div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmitFaceRecord}
              disabled={!capturedPreviewUrl || !capturedAnalysis?.faceDetected}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B1F3A] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#13325C] disabled:cursor-not-allowed disabled:opacity-45 dark:bg-sky-600 dark:hover:bg-sky-500"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>Submit Face Capture to Local Audit Log</span>
            </button>
            {capturedPreviewUrl && !capturedAnalysis?.faceDetected && (
              <p className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400">
                No face was detected in the captured frame. Center your face in
                well-lit frame and click Fetch Face Live again.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Local Volatile Submission Ledger */}
      <section className="rounded-xl border border-slate-200/90 bg-white/92 p-5 shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700/70 dark:bg-[#0B172A]/90 dark:shadow-black/30">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck
              className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <h3 className="text-sm font-bold text-[#0B1F3A] dark:text-white">
              Local Verification Submissions ({submissions.length})
            </h3>
          </div>
          {submissions.length > 0 && (
            <button
              type="button"
              onClick={() => setSubmissions([])}
              className="inline-flex items-center gap-1 rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
              <span>Clear Submissions</span>
            </button>
          )}
        </div>

        {submissions.length === 0 ? (
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            No live face captures submitted yet. Captured records stay strictly
            in volatile browser RAM and are never uploaded.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {submissions.map((item) => {
              const meta = MASK_STATUS_META[item.maskStatus];
              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <img
                    src={item.previewDataUrl}
                    alt={`Submitted face record ${item.id}`}
                    className="aspect-video w-full bg-slate-950 object-contain"
                  />
                  <div className="p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-[#0B1F3A] dark:text-white">
                        {item.id}
                      </span>
                      <span
                        className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-slate-500">
                      {item.timestamp} · {item.confidence}% ·{' '}
                      {item.privacyMasked ? 'Face Redacted' : 'Unredacted'}
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <a
                        href={item.previewDataUrl}
                        download={`${item.id.toLowerCase()}_sanitized.png`}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <Download className="h-3 w-3" aria-hidden="true" />
                        <span>Download PNG</span>
                      </a>
                      {onAppendAuditLogLine && (
                        <button
                          type="button"
                          onClick={() =>
                            onAppendAuditLogLine(
                              `[${item.timestamp}] LIVE_FACE_SUBMIT id=${item.id} mask_status=${item.maskStatus} confidence=${item.confidence}%`
                            )
                          }
                          className="inline-flex items-center gap-1 rounded bg-[#0B1F3A] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#13325C] dark:bg-emerald-600"
                        >
                          <FilePlus2 className="h-3 w-3" aria-hidden="true" />
                          <span>Log</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
