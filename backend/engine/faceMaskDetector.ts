export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type MaskStatus = 'no_face' | 'masked' | 'partial_mask' | 'unmasked';

export interface FaceMaskAnalysis {
  faceDetected: boolean;
  box: FaceBox | null;
  maskStatus: MaskStatus;
  confidence: number;
  upperSkinRatio: number;
  lowerSkinRatio: number;
  method: 'native-face-detector' | 'local-chroma-heuristic';
}

export interface PixelBufferLike {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

function rgbToYCbCr(r: number, g: number, b: number): [number, number, number] {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return [y, cb, cr];
}

function isSkinPixel(r: number, g: number, b: number): boolean {
  const [y, cb, cr] = rgbToYCbCr(r, g, b);
  return y > 55 && cb >= 77 && cb <= 129 && cr >= 132 && cr <= 176;
}

interface ZoneStats {
  skinRatio: number;
  meanCb: number;
  meanCr: number;
  count: number;
}

function measureZone(
  frame: PixelBufferLike,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): ZoneStats {
  const minX = Math.max(0, Math.floor(x0));
  const minY = Math.max(0, Math.floor(y0));
  const maxX = Math.min(frame.width, Math.ceil(x1));
  const maxY = Math.min(frame.height, Math.ceil(y1));

  let skinCount = 0;
  let total = 0;
  let sumCb = 0;
  let sumCr = 0;

  for (let py = minY; py < maxY; py++) {
    for (let px = minX; px < maxX; px++) {
      const idx = (py * frame.width + px) * 4;
      const r = frame.data[idx];
      const g = frame.data[idx + 1];
      const b = frame.data[idx + 2];
      const [, cb, cr] = rgbToYCbCr(r, g, b);
      sumCb += cb;
      sumCr += cr;
      if (isSkinPixel(r, g, b)) {
        skinCount++;
      }
      total++;
    }
  }

  if (total === 0) {
    return { skinRatio: 0, meanCb: 128, meanCr: 128, count: 0 };
  }

  return {
    skinRatio: skinCount / total,
    meanCb: sumCb / total,
    meanCr: sumCr / total,
    count: total,
  };
}

/**
 * Fallback heuristic face locator using YCbCr skin-chroma density in the
 * central portrait region, projecting downwards if a mask occludes the lower face.
 */
function locateFaceByChroma(frame: PixelBufferLike): FaceBox | null {
  const { width, height, data } = frame;
  if (width < 16 || height < 16) {
    return null;
  }

  const searchX0 = Math.floor(width * 0.12);
  const searchX1 = Math.ceil(width * 0.88);
  const searchY0 = Math.floor(height * 0.06);
  const searchY1 = Math.ceil(height * 0.85);

  let sumX = 0;
  let sumY = 0;
  let skinCount = 0;
  let minSkinX = searchX1;
  let maxSkinX = searchX0;
  let minSkinY = searchY1;
  let maxSkinY = searchY0;

  for (let py = searchY0; py < searchY1; py++) {
    for (let px = searchX0; px < searchX1; px++) {
      const idx = (py * width + px) * 4;
      if (isSkinPixel(data[idx], data[idx + 1], data[idx + 2])) {
        skinCount++;
        sumX += px;
        sumY += py;
        if (px < minSkinX) minSkinX = px;
        if (px > maxSkinX) maxSkinX = px;
        if (py < minSkinY) minSkinY = py;
        if (py > maxSkinY) maxSkinY = py;
      }
    }
  }

  const searchArea = (searchX1 - searchX0) * (searchY1 - searchY0);
  if (skinCount < searchArea * 0.035) {
    return null;
  }

  const rawWidth = Math.max(width * 0.24, (maxSkinX - minSkinX) * 1.1);
  const clampedWidth = Math.min(width * 0.72, rawWidth);
  const rawHeight = maxSkinY - minSkinY;
  // When a full mask covers the lower half of the face, the skin cluster
  // mostly spans the forehead/eye band, so project anatomical face height (~1.3x width).
  const projectedHeight = Math.min(
    height * 0.86,
    Math.max(rawHeight * 1.08, clampedWidth * 1.28)
  );

  const centerX = sumX / skinCount;
  const x = Math.max(0, Math.min(width - clampedWidth, centerX - clampedWidth / 2));
  const y = Math.max(0, Math.min(height - projectedHeight, minSkinY - projectedHeight * 0.04));

  // Verify the upper band actually contains meaningful skin density.
  const upperCheck = measureZone(
    frame,
    x + clampedWidth * 0.15,
    y + projectedHeight * 0.08,
    x + clampedWidth * 0.85,
    y + projectedHeight * 0.45
  );
  if (upperCheck.skinRatio < 0.18 && sumY / skinCount < 0) {
    return null;
  }
  if (upperCheck.skinRatio < 0.18) {
    return null;
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(clampedWidth),
    height: Math.round(projectedHeight),
  };
}

/**
 * Analyzes an RGBA image frame for a face and classifies full-mask occlusion
 * completely client-side with zero network calls.
 */
export function analyzeFaceFrame(
  frame: PixelBufferLike,
  nativeFaces?: FaceBox[]
): FaceMaskAnalysis {
  const hasNative = Array.isArray(nativeFaces) && nativeFaces.length > 0;
  const box = hasNative
    ? nativeFaces.reduce((largest, cur) =>
        cur.width * cur.height > largest.width * largest.height ? cur : largest
      )
    : locateFaceByChroma(frame);

  if (!box || box.width <= 0 || box.height <= 0) {
    return {
      faceDetected: false,
      box: null,
      maskStatus: 'no_face',
      confidence: 0,
      upperSkinRatio: 0,
      lowerSkinRatio: 0,
      method: hasNative ? 'native-face-detector' : 'local-chroma-heuristic',
    };
  }

  const upper = measureZone(
    frame,
    box.x + box.width * 0.16,
    box.y + box.height * 0.08,
    box.x + box.width * 0.84,
    box.y + box.height * 0.46
  );

  const lower = measureZone(
    frame,
    box.x + box.width * 0.18,
    box.y + box.height * 0.52,
    box.x + box.width * 0.82,
    box.y + box.height * 0.94
  );

  const chromaDiff = Math.hypot(
    upper.meanCb - lower.meanCb,
    upper.meanCr - lower.meanCr
  );
  const skinDrop = upper.skinRatio - lower.skinRatio;

  let maskStatus: MaskStatus;
  let confidence: number;

  if (lower.skinRatio < 0.22 && (skinDrop > 0.22 || chromaDiff > 12)) {
    maskStatus = 'masked';
    confidence = Math.min(
      98,
      Math.round(70 + (0.25 - Math.min(0.25, lower.skinRatio)) * 80 + Math.min(18, chromaDiff * 0.5))
    );
  } else if (lower.skinRatio < 0.42 && skinDrop > 0.12) {
    maskStatus = 'partial_mask';
    confidence = Math.min(90, Math.round(62 + skinDrop * 60));
  } else {
    maskStatus = 'unmasked';
    confidence = Math.min(97, Math.round(65 + lower.skinRatio * 32));
  }

  return {
    faceDetected: true,
    box,
    maskStatus,
    confidence,
    upperSkinRatio: Number(upper.skinRatio.toFixed(2)),
    lowerSkinRatio: Number(lower.skinRatio.toFixed(2)),
    method: hasNative ? 'native-face-detector' : 'local-chroma-heuristic',
  };
}
