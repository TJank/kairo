export default function KairoLogo({ size = 20 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 1.5;

  // Hour hand at 10 o'clock (~300°), minute hand at 2 o'clock (~60°)
  const hourAngle = (300 - 90) * (Math.PI / 180);
  const minuteAngle = (60 - 90) * (Math.PI / 180);
  const hourLen = r * 0.55;
  const minuteLen = r * 0.75;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx={cx} cy={cy} r={r} strokeWidth={1.5} />
      <line
        x1={cx}
        y1={cy}
        x2={cx + hourLen * Math.cos(hourAngle)}
        y2={cy + hourLen * Math.sin(hourAngle)}
        strokeWidth={1.5}
      />
      <line
        x1={cx}
        y1={cy}
        x2={cx + minuteLen * Math.cos(minuteAngle)}
        y2={cy + minuteLen * Math.sin(minuteAngle)}
        strokeWidth={1.5}
      />
      <circle cx={cx} cy={cy} r={1} fill="currentColor" strokeWidth={0} />
    </svg>
  );
}
