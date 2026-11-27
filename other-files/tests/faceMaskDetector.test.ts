import { describe, expect, it } from 'vitest';
import { analyzeFaceFrame, type PixelBufferLike } from '../../backend/engine/faceMaskDetector';

function createFrame(
  width: number,
  height: number,
  fillFn: (x: number, y: number) => [number, number, number]
): PixelBufferLike {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = fillFn(x, y);
      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  return { width, height, data };
}

describe('analyzeFaceFrame', () => {
  it('returns no_face on a blank background frame', () => {
    const frame = createFrame(120, 90, () => [20, 30, 45]);
    const res = analyzeFaceFrame(frame);
    expect(res.faceDetected).toBe(false);
    expect(res.maskStatus).toBe('no_face');
  });

  it('detects an unmasked face when both upper and lower face zones show skin', () => {
    const frame = createFrame(120, 90, (x, y) => {
      if (x >= 40 && x <= 80 && y >= 15 && y <= 75) {
        return [212, 162, 134]; // natural skin tone RGB
      }
      return [25, 35, 50];
    });

    const res = analyzeFaceFrame(frame, [{ x: 40, y: 15, width: 40, height: 60 }]);
    expect(res.faceDetected).toBe(true);
    expect(res.maskStatus).toBe('unmasked');
    expect(res.upperSkinRatio).toBeGreaterThan(0.8);
    expect(res.lowerSkinRatio).toBeGreaterThan(0.8);
  });

  it('detects a full mask when lower face is occluded by non-skin mask fabric', () => {
    const frame = createFrame(120, 90, (x, y) => {
      if (x >= 40 && x <= 80 && y >= 15 && y <= 44) {
        return [212, 162, 134]; // upper face skin
      }
      if (x >= 40 && x <= 80 && y > 44 && y <= 75) {
        return [60, 145, 205]; // surgical blue mask
      }
      return [25, 35, 50];
    });

    const res = analyzeFaceFrame(frame);
    expect(res.faceDetected).toBe(true);
    expect(res.maskStatus).toBe('masked');
    expect(res.upperSkinRatio).toBeGreaterThan(0.6);
    expect(res.lowerSkinRatio).toBeLessThan(0.2);
  });
});
