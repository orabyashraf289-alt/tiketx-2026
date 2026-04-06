import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export const Scene5Outro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame: frame - 5, fps, config: { damping: 10, stiffness: 120 } });
  const titleOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const titleY = interpolate(spring({ frame: frame - 20, fps, config: { damping: 20 } }), [0, 1], [50, 0]);

  const features = ["إدارة التذاكر", "سير الموافقات", "التقارير والتحليلات", "قاعدة المعرفة"];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Radiating rings */}
      {[1, 2, 3].map((ring) => {
        const ringOpacity = interpolate(frame, [10 + ring * 10, 30 + ring * 10], [0, 0.08], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
        const ringSize = 300 + ring * 200 + Math.sin(frame * 0.02) * 10;
        return (
          <div
            key={ring}
            style={{
              position: "absolute",
              width: ringSize,
              height: ringSize,
              borderRadius: "50%",
              border: "1px solid #6366F1",
              opacity: ringOpacity,
            }}
          />
        );
      })}

      {/* Logo */}
      <div style={{ transform: `scale(${logoScale})`, marginBottom: 30 }}>
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 24,
            background: "linear-gradient(135deg, #6366F1, #06B6D4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 20px 60px rgba(99, 102, 241, 0.4)",
          }}
        >
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 56,
          fontWeight: 800,
          color: "#F8FAFC",
          textAlign: "center",
          fontFamily: "sans-serif",
          marginBottom: 16,
        }}
      >
        أنت جاهز الآن!
      </div>

      <div
        style={{
          opacity: titleOpacity,
          fontSize: 24,
          color: "#94A3B8",
          textAlign: "center",
          fontFamily: "sans-serif",
          marginBottom: 40,
        }}
      >
        ابدأ باستخدام النظام بكل ثقة
      </div>

      {/* Feature pills */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        {features.map((feature, i) => {
          const pillOpacity = interpolate(frame, [50 + i * 8, 65 + i * 8], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          const pillScale = spring({ frame: frame - (50 + i * 8), fps, config: { damping: 12 } });
          return (
            <div
              key={i}
              style={{
                opacity: pillOpacity,
                transform: `scale(${pillScale})`,
                padding: "12px 28px",
                borderRadius: 50,
                background: "#1E293B",
                border: "1px solid #334155",
                fontSize: 18,
                color: "#E2E8F0",
                fontFamily: "sans-serif",
                fontWeight: 600,
              }}
            >
              {feature}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
