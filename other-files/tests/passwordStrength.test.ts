import { describe, expect, it } from 'vitest';
import {
  analyzePasswordStrength,
  generateLocalPassphrase,
} from '../../backend/engine/passwordStrength';

describe('analyzePasswordStrength', () => {
  it('flags empty or common weak passwords as Very Weak / Weak', () => {
    expect(analyzePasswordStrength('').score).toBe(0);
    const common = analyzePasswordStrength('password123');
    expect(common.score).toBeLessThanOrEqual(1);
    expect(common.checks.noCommonPattern).toBe(false);
  });

  it('penalizes sequential keyboard and repeated runs', () => {
    const seq = analyzePasswordStrength('Qwerty1234!');
    expect(seq.checks.noCommonPattern).toBe(false);

    const rep = analyzePasswordStrength('Aaaa1111!!!!');
    expect(rep.checks.noCommonPattern).toBe(false);
  });

  it('rates long unpredictable passphrases as Strong or Very Strong', () => {
    const res = analyzePasswordStrength('Cobalt-Lantern-Summit-Quartz-47!');
    expect(res.score).toBe(4);
    expect(res.label).toBe('Very Strong');
    expect(res.checks.minLength12).toBe(true);
    expect(res.checks.noCommonPattern).toBe(true);
  });

  it('generates valid strong passphrases locally', () => {
    const generated = generateLocalPassphrase(4);
    const analysis = analyzePasswordStrength(generated);
    expect(generated.split('-').length).toBe(5);
    expect(analysis.score).toBeGreaterThanOrEqual(3);
  });
});
