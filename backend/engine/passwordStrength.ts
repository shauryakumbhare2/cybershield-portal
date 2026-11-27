export type StrengthScore = 0 | 1 | 2 | 3 | 4;

export interface PasswordAnalysis {
  score: StrengthScore;
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  entropyBits: number;
  estimatedCrackTime: string;
  checks: {
    minLength12: boolean;
    hasLower: boolean;
    hasUpper: boolean;
    hasDigit: boolean;
    hasSymbol: boolean;
    noCommonPattern: boolean;
  };
  feedback: string[];
}

const COMMON_WEAK_TOKENS = [
  'password',
  'passw0rd',
  '123456',
  '12345678',
  'qwerty',
  'letmein',
  'welcome',
  'admin',
  'iloveyou',
  'dragon',
  'monkey',
  'football',
  'abc123',
  '000000',
  '111111',
];

const SEQUENCES = [
  'abcdefghijklmnopqrstuvwxyz',
  '0123456789',
  'qwertyuiopasdfghjklzxcvbnm',
];

function hasSequentialRun(lower: string): boolean {
  if (lower.length < 4) return false;
  for (let i = 0; i <= lower.length - 4; i++) {
    const chunk = lower.slice(i, i + 4);
    const reversed = chunk.split('').reverse().join('');
    for (const seq of SEQUENCES) {
      if (seq.includes(chunk) || seq.includes(reversed)) {
        return true;
      }
    }
  }
  return false;
}

function formatCrackTime(entropyBits: number): string {
  // Assume conservative offline brute-force rate of 10^10 guesses/sec
  if (entropyBits <= 0) return 'Instant';
  const guesses = Math.pow(2, Math.min(entropyBits, 128));
  const seconds = guesses / 1e10;

  if (seconds < 1) return 'Less than 1 second';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 86400 * 365) return `${Math.round(seconds / 86400)} days`;
  const years = seconds / (86400 * 365);
  if (years < 1000) return `${Math.round(years)} years`;
  if (years < 1e6) return `${Math.round(years / 1000)} thousand years`;
  if (years < 1e9) return `${Math.round(years / 1e6)} million years`;
  return 'Centuries+';
}

/**
 * Evaluates password strength locally in memory using character-pool entropy
 * and common weak-pattern penalties. Never sends data over the network.
 */
export function analyzePasswordStrength(password: string): PasswordAnalysis {
  if (!password) {
    return {
      score: 0,
      label: 'Very Weak',
      entropyBits: 0,
      estimatedCrackTime: 'Instant',
      checks: {
        minLength12: false,
        hasLower: false,
        hasUpper: false,
        hasDigit: false,
        hasSymbol: false,
        noCommonPattern: true,
      },
      feedback: ['Enter a password or generate a random passphrase to test its strength.'],
    };
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const minLength12 = password.length >= 12;

  const lower = password.toLowerCase();
  const hasCommonToken = COMMON_WEAK_TOKENS.some((tok) => lower.includes(tok));
  const hasRepeats = /(.)\1{2,}/.test(password);
  const hasSeq = hasSequentialRun(lower);
  const noCommonPattern = !hasCommonToken && !hasRepeats && !hasSeq;

  let poolSize = 0;
  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasDigit) poolSize += 10;
  if (hasSymbol) poolSize += 32;
  if (poolSize === 0) poolSize = 26;

  let entropyBits = password.length * Math.log2(poolSize);
  if (hasCommonToken) entropyBits -= 24;
  if (hasRepeats) entropyBits -= 10;
  if (hasSeq) entropyBits -= 12;
  entropyBits = Math.max(0, Math.round(entropyBits));

  let score: StrengthScore = 0;
  if (entropyBits >= 80 && minLength12 && noCommonPattern) {
    score = 4;
  } else if (entropyBits >= 62 && password.length >= 10) {
    score = 3;
  } else if (entropyBits >= 44 && password.length >= 8) {
    score = 2;
  } else if (entropyBits >= 28) {
    score = 1;
  } else {
    score = 0;
  }

  const LABELS: Record<StrengthScore, PasswordAnalysis['label']> = {
    0: 'Very Weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Strong',
    4: 'Very Strong',
  };

  const feedback: string[] = [];
  if (!minLength12) {
    feedback.push('Use at least 12 characters (longer passphrases resist brute force best).');
  }
  if (!hasUpper || !hasLower) {
    feedback.push('Mix uppercase and lowercase letters.');
  }
  if (!hasDigit) {
    feedback.push('Include numbers or use a 4+ word random passphrase.');
  }
  if (!hasSymbol) {
    feedback.push('Add symbols (such as !, #, -, or @) to expand the character pool.');
  }
  if (hasCommonToken) {
    feedback.push('Avoid dictionary passwords like "password", "admin", or "123456".');
  }
  if (hasRepeats || hasSeq) {
    feedback.push('Avoid repeated characters ("aaa") or keyboard/number sequences ("1234", "qwerty").');
  }
  if (feedback.length === 0) {
    feedback.push('Strong length and unpredictability. Store it in a trusted password manager and pair with MFA.');
  }

  return {
    score,
    label: LABELS[score],
    entropyBits,
    estimatedCrackTime: formatCrackTime(entropyBits),
    checks: {
      minLength12,
      hasLower,
      hasUpper,
      hasDigit,
      hasSymbol,
      noCommonPattern,
    },
    feedback,
  };
}

const PASSPHRASE_WORDS = [
  'amber', 'anchor', 'atlas', 'beacon', 'breeze', 'cedar', 'cipher', 'cobalt',
  'comet', 'coral', 'crest', 'delta', 'ember', 'falcon', 'flint', 'forest',
  'frost', 'granite', 'harbor', 'horizon', 'indigo', 'ivory', 'jasper', 'kernel',
  'lantern', 'lumen', 'meadow', 'meridian', 'nectar', 'nimbus', 'oasis', 'olive',
  'orbit', 'pebble', 'phoenix', 'prism', 'quartz', 'raven', 'ripple', 'saffron',
  'shield', 'signal', 'silver', 'solar', 'spruce', 'summit', 'timber', 'topaz',
  'valley', 'velvet', 'verge', 'voyage', 'walnut', 'willow', 'zenith', 'zephyr',
];

/**
 * Generates a high-entropy random passphrase using Web Crypto CSPRNG.
 */
export function generateLocalPassphrase(wordCount = 4): string {
  const buf = new Uint32Array(wordCount + 1);
  crypto.getRandomValues(buf);
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const word = PASSPHRASE_WORDS[buf[i] % PASSPHRASE_WORDS.length];
    words.push(i === 0 ? word[0].toUpperCase() + word.slice(1) : word);
  }
  const suffixNum = (buf[wordCount] % 90) + 10;
  return `${words.join('-')}-${suffixNum}!`;
}
