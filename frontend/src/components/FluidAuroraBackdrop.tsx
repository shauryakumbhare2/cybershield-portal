import cyberLogo from '../assets/cyber-logo.png';

export function FluidAuroraBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Sweeping SVG Fluid Ribbon Waves matching Indigo/Violet/Blush aesthetic */}
      <svg
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="h-full w-full opacity-80 dark:opacity-55"
      >
        <defs>
          <linearGradient id="aurora-wave-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" stopOpacity="0.28" />
            <stop offset="48%" stopColor="#6366F1" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#F472B6" stopOpacity="0.20" />
          </linearGradient>
          <linearGradient id="aurora-wave-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.20" />
            <stop offset="55%" stopColor="#A78BFA" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#F9A8D4" stopOpacity="0.24" />
          </linearGradient>
        </defs>
        <path
          d="M-80 280C180 120 420 440 720 260C1020 80 1210 350 1520 190L1520 560C1240 710 960 440 670 610C380 780 140 530 -80 650Z"
          fill="url(#aurora-wave-1)"
        />
        <path
          d="M-60 480C220 340 510 620 820 420C1130 220 1300 480 1540 340L1540 920L-60 920Z"
          fill="url(#aurora-wave-2)"
        />
      </svg>

      {/* Subtle full-page lower-right ambient watermark */}
      <img
        src={cyberLogo}
        alt=""
        className="cyber-bg-watermark absolute -bottom-16 -right-16 w-[620px] max-w-none object-cover opacity-15 lg:w-[820px] dark:opacity-25"
      />
    </div>
  );
}
