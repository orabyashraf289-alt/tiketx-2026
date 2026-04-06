import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

const DARK = "#0a1225";

interface PremiumOutroProps {
  title: string;
  features: string[];
  accentColor: string;
}

export const PremiumOutro: React.FC<PremiumOutroProps> = ({ title, features, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame: frame - 5, fps, config: { damping: 12, stiffness: 100 } });
  const titleOpacity = interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Rings
  const ringReveal = (i: number) => interpolate(frame, [i * 5, 15 + i * 5], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: DARK, justifyContent: "center", alignItems: "center", direction: "rtl" }}>
      {/* Radial glow */}
      <div style={{
        position: "absolute", width: 1000, height: 1000, borderRadius: "50%",
        background: `radial-gradient(circle, ${accentColor}0a 0%, transparent 60%)`,
      }} />

      {/* Rings */}
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          position: "absolute",
          width: 250 + i * 160, height: 250 + i * 160,
          borderRadius: "50%",
          border: `1px solid #ffffff${Math.round(ringReveal(i) * 8).toString(16).padStart(2, "0")}`,
          transform: `rotate(${frame * 0.05 * (i % 2 === 0 ? 1 : -1)}deg)`,
        }} />
      ))}

      {/* Checkmark */}
      <div style={{
        transform: `scale(${titleScale})`,
        width: 80, height: 80, borderRadius: "50%",
        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}88)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 30,
        boxShadow: `0 10px 40px ${accentColor}44`,
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      {/* Title */}
      <div style={{
        opacity: titleOpacity,
        transform: `scale(${titleScale})`,
        fontSize: 48, fontWeight: 800, color: "#fff",
        fontFamily: "sans-serif", textAlign: "center", marginBottom: 30,
      }}>
        {title}
      </div>

      {/* Feature pills */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {features.map((f, i) => {
          const pillOpacity = interpolate(frame, [35 + i * 8, 50 + i * 8], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          const pillY = interpolate(spring({ frame: frame - 35 - i * 8, fps, config: { damping: 15 } }), [0, 1], [20, 0]);
          return (
            <div key={i} style={{
              opacity: pillOpacity, transform: `translateY(${pillY}px)`,
              padding: "10px 24px", borderRadius: 50,
              background: `#111b33`,
              border: `1px solid ${accentColor}25`,
              fontSize: 16, color: "#c8d6e5", fontFamily: "sans-serif", fontWeight: 600,
            }}>
              {f}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
