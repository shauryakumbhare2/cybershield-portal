import { detectAll } from '../engine/detectors';
import type { DetectionMatch, DetectionOptions } from '../engine/types';

export interface WorkerRequest {
  requestId: number;
  text: string;
  options: DetectionOptions;
}

export interface WorkerResponse {
  requestId: number;
  detections: DetectionMatch[];
  durationMs: number;
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { requestId, text, options } = event.data;
  const start = performance.now();
  const detections = detectAll(text, options);
  const durationMs = Math.max(0.1, Number((performance.now() - start).toFixed(2)));

  const response: WorkerResponse = {
    requestId,
    detections,
    durationMs,
  };

  self.postMessage(response);
};
