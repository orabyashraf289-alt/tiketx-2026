import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

const DARK = "#0a1225";

interface ContentItem {
  icon: string;
  title: string;
  desc: string;
}

interface PremiumContentProps {
  sectionTitle: string;
  sectionIcon: string;
  items: ContentItem[];
  accentColor: string;
}

export const PremiumContent: React.FC<PremiumContentProps> = ({ sectionTitle, sectionIcon, items, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: DARK, padding: "60px 100px", justifyContent: "center", direction: "rtl" }}>
      {/* Subtle grid */}
      <AbsoluteFill style={{ opacity: 0.02 }}>
        <svg width="1920" height="1080">
          {Array.from({ length: 24 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 80} y1={0} x2={i * 80} y2={1080} stroke="white" strokeWidth={1} />
          ))}
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 80} x2={1920} y2={i * 80} stroke="white" strokeWidth={1} />
          ))}
        </svg>
      </AbsoluteFill>

      {/* Section header */}
      <div style={{ opacity: headerOpacity, marginBottom: 50, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
          border: `1px solid ${accentColor}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24,
        }}>
          {sectionIcon}
        </div>
        <span style={{ fontSize: 42, fontWeight: 800, color: "#fff", fontFamily: "sans-serif" }}>
          {sectionTitle}
        </span>
      </div>

      {/* Cards grid */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        {items.map((item, i) => {
          const delay = 10 + i * 12;
          const s = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 120 } });
          const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          const x = interpolate(s, [0, 1], [60, 0]);

          return (
            <div key={i} style={{
              opacity, transform: `translateX(${x}px)`,
              width: items.length <= 3 ? "100%" : "calc(50% - 10px)",
              background: `linear-gradient(135deg, #111b33, #0d1526)`,
              borderRadius: 20, padding: "24px 28px",
              border: `1px solid #1e2d4a`,
              display: "flex", alignItems: "center", gap: 20,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: `${accentColor}15`,
                border: `1px solid ${accentColor}25`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: "sans-serif", marginBottom: 4 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 15, color: "#7b8da8", fontFamily: "sans-serif" }}>
                  {item.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
