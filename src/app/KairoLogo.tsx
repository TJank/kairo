// Three logo variants — swap the default export to switch which appears in the navbar + favicon.

export function HourglassLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Outer hourglass outline */}
      <path d="M3 2.5 L17 2.5 L10 10 L17 17.5 L3 17.5 L10 10 Z" />
      {/* Sand accumulated in bottom — subtle fill */}
      <path
        d="M10 10 L16.5 17.5 L3.5 17.5 Z"
        fill="currentColor"
        fillOpacity="0.28"
        stroke="none"
      />
      {/* Pinch-point dot */}
      <circle cx="10" cy="10" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function KLetterLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Vertical bar */}
      <line x1="4.5" y1="3" x2="4.5" y2="17" />
      {/* Upper diagonal — attaches slightly above center */}
      <line x1="4.5" y1="9" x2="15.5" y2="3" />
      {/* Lower diagonal — attaches slightly below center, wider spread */}
      <line x1="4.5" y1="11" x2="15.5" y2="17" />
    </svg>
  );
}

export function CompassLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Outer ring */}
      <circle cx="10" cy="10" r="8.5" />
      {/* North needle — filled (the "true north" half) */}
      <path
        d="M10 3 L13.5 10 L6.5 10 Z"
        fill="currentColor"
        stroke="none"
      />
      {/* South needle — outlined only */}
      <path d="M10 17 L13.5 10 L6.5 10 Z" />
      {/* Center pivot */}
      <circle cx="10" cy="10" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ← Change this export to switch the active logo everywhere:
// HourglassLogo | KLetterLogo | CompassLogo
export default HourglassLogo;
