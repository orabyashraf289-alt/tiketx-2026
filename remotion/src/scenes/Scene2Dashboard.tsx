import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from "remotion";

const StatCard = ({ label, value, color, delay, frame, fps }: { label: string; value: string; color: string; delay: number; frame: number; fps: number }) => {
  const s = spring({ frame: frame - delay, fps, config: { damping: 15 } });
  const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  return (
    <div
      style={{
        opacity,
        transform: `scale(${interpolate(s, [0, 1], [0.7, 1])}) translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
        background: "#1E293B",
        borderRadius: 16,
        padding: "28px 36px",
        border: `1px solid ${color}30`,
        minWidth: 200,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 42, fontWeight: 800, color, fontFamily: "sans-serif" }}>{value}</div>
      <div style={{ fontSize: 16, color: "#94A3B8", marginTop: 8, fontFamily: "sans-serif" }}>{label}</div>
    </div>
  );
};

export const Scene2Dashboard = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const headerY = interpolate(spring({ frame, fps, config: { damping: 20 } }), [0, 1], [-40, 0]);

  const mockBarHeights = [60, 85, 45, 95, 70, 55, 80];
  const chartOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ padding: 80, justifyContent: "center" }}>
      {/* Section label */}
      <div style={{ opacity: headerOpacity, transform: `translateY(${headerY}px)`, marginBottom: 16 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 20px",
            borderRadius: 50,
            background: "#6366F115",
            border: "1px solid #6366F130",
            fontSize: 16,
            color: "#818CF8",
            fontFamily: "sans-serif",
            fontWeight: 600,
          }}
        >
          📊 الخطوة الأولى
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
          fontSize: 52,
          fontWeight: 800,
          color: "#F8FAFC",
          fontFamily: "sans-serif",
          marginBottom: 50,
        }}
      >
        لوحة التحكم الرئيسية
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 24, marginBottom: 50, flexWrap: "wrap" }}>
        <StatCard label="تذاكر مفتوحة" value="127" color="#6366F1" delay={15} frame={frame} fps={fps} />
        <StatCard label="قيد المعالجة" value="43" color="#06B6D4" delay={22} frame={frame} fps={fps} />
        <StatCard label="تم الحل" value="892" color="#10B981" delay={29} frame={frame} fps={fps} />
        <StatCard label="معدل الرضا" value="94%" color="#F59E0B" delay={36} frame={frame} fps={fps} />
      </div>

      {/* Chart mock */}
      <div style={{ opacity: chartOpacity, display: "flex", alignItems: "flex-end", gap: 20, height: 200 }}>
        {mockBarHeights.map((h, i) => {
          const barProgress = interpolate(frame, [65 + i * 5, 90 + i * 5], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 60,
                  height: h * 2 * barProgress,
                  borderRadius: "8px 8px 4px 4px",
                  background: `linear-gradient(180deg, #6366F1, #06B6D4)`,
                  opacity: 0.8 + barProgress * 0.2,
                }}
              />
              <div style={{ fontSize: 12, color: "#64748B", fontFamily: "sans-serif" }}>
                {["سبت", "أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"][i]}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
