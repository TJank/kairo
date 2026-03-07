import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const cx = 16;
  const cy = 16;
  const r = 13;

  const hourAngle = (300 - 90) * (Math.PI / 180);
  const minuteAngle = (60 - 90) * (Math.PI / 180);
  const hourLen = r * 0.55;
  const minuteLen = r * 0.75;

  const hx2 = cx + hourLen * Math.cos(hourAngle);
  const hy2 = cy + hourLen * Math.sin(hourAngle);
  const mx2 = cx + minuteLen * Math.cos(minuteAngle);
  const my2 = cy + minuteLen * Math.sin(minuteAngle);

  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#09090b",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="white" strokeLinecap="round">
          <circle cx={cx} cy={cy} r={r} strokeWidth="2" />
          <line x1={cx} y1={cy} x2={hx2} y2={hy2} strokeWidth="2" />
          <line x1={cx} y1={cy} x2={mx2} y2={my2} strokeWidth="2" />
          <circle cx={cx} cy={cy} r="1.5" fill="white" strokeWidth="0" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
