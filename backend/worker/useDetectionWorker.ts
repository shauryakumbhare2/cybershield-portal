import { useEffect, useRef, useState } from 'react';
import type { DetectionMatch, DetectionOptions, PiiType } from '../engine/types';
import type { WorkerRequest, WorkerResponse } from './detection.worker';

interface WorkerState {
  sourceText: string;
  detections: DetectionMatch[];
  durationMs: number | null;
}

export function useDetectionWorker(
  text: string,
  strictAadhaar: boolean,
  enabledTypes: Record<PiiType, boolean>,
  allowInvalidAadhaarPrefix = false
) {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const pendingTextByIdRef = useRef<Map<number, string>>(new Map());

  const [state, setState] = useState<WorkerState>({
    sourceText: '',
    detections: [],
    durationMs: null,
  });

  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    const worker = new Worker(
      new URL('./detection.worker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { requestId, detections, durationMs } = event.data;
      const sourceText = pendingTextByIdRef.current.get(requestId) ?? '';
      pendingTextByIdRef.current.delete(requestId);

      // Ignore stale worker results if a newer request has been dispatched.
      if (requestId !== requestIdRef.current) {
        return;
      }

      setState({
        sourceText,
        detections,
        durationMs,
      });
      setIsDetecting(false);
    };

    worker.onerror = () => {
      setIsDetecting(false);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
      pendingTextByIdRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const nextId = ++requestIdRef.current;

    if (!text) {
      pendingTextByIdRef.current.clear();
      setState({
        sourceText: '',
        detections: [],
        durationMs: null,
      });
      setIsDetecting(false);
      return;
    }

    const worker = workerRef.current;
    if (!worker) {
      return;
    }

    pendingTextByIdRef.current.set(nextId, text);
    setIsDetecting(true);

    const options: DetectionOptions = {
      strictAadhaar,
      allowInvalidAadhaarPrefix,
      enabledTypes,
    };

    const payload: WorkerRequest = {
      requestId: nextId,
      text,
      options,
    };

    worker.postMessage(payload);
  }, [text, strictAadhaar, allowInvalidAadhaarPrefix, enabledTypes]);

  const isSynced = state.sourceText === text;

  return {
    detections: isSynced ? state.detections : [],
    durationMs: isSynced ? state.durationMs : null,
    isDetecting: isDetecting || (Boolean(text) && !isSynced),
  };
}
