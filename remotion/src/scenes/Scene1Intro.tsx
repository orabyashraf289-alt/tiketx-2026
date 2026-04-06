import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from "remotion";

export const Scene1Intro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 150 } });
  const titleY = interpolate(spring({ frame: frame - 15, fps, config: { damping: 20 } }), [0, 1], [80, 0]);
  const titleOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const subtitleOpacity = interpolate(frame, [35, 55], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const subtitleY = interpolate(spring({ frame: frame - 35, fps, config: { damping: 20 } }), [0, 1], [40, 0]);
  const lineWidth = interpolate(frame, [50, 80], [0, 400], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const badgeOpacity = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const badgeScale = spring({ frame: frame - 70, fps, config: { damping: 10 } });

  const particles = Array.from({ length: 12 }).map((_, i) => ({
    x: 960 + Math.cos((i / 12) * Math.PI * 2) * (200 + frame * 0.5),
    y: 540 + Math.sin((i / 12) * Math.PI * 2) * (200 + frame * 0.5),
    opacity: interpolate(frame, [10 + i * 3, 30 + i * 3], [0, 0.6], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
    size: 4 + Math.sin(frame * 0.05 + i) * 2,
  }));

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: i % 2 === 0 ? "#6366F1" : "#06B6D4",
            opacity: p.opacity,
          }}
        />
      ))}

      {/* Logo icon */}
      <div style={{ transform: `scale(${logoScale})`, marginBottom: 30 }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 28,
            background: "linear-gradient(135deg, #6366F1, #06B6D4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 20px 60px rgba(99, 102, 241, 0.4)",
          }}
        >
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            <path d="M8 7h6" />
            <path d="M8 11h8" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 72,
          fontWeight: 800,
          color: "#F8FAFC",
          textAlign: "center",
          fontFamily: "sans-serif",
          letterSpacing: -1,
        }}
      >
        دليل استخدام النظام
      </div>

      {/* Accent line */}
      <div
        style={{
          width: lineWidth,
          height: 4,
          borderRadius: 2,
          background: "linear-gradient(90deg, #6366F1, #06B6D4)",
          margin: "20px auto",
        }}
      />

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          fontSize: 28,
          color: "#94A3B8",
          textAlign: "center",
          fontFamily: "sans-serif",
          maxWidth: 700,
        }}
      >
        تعرف على كيفية إدارة التذاكر والموافقات بسهولة واحترافية
      </div>

      {/* Badge */}
      <div
        style={{
          opacity: badgeOpacity,
          transform: `scale(${badgeScale})`,
          marginTop: 40,
          padding: "12px 32px",
          borderRadius: 50,
          background: "linear-gradient(135deg, #6366F120, #06B6D420)",
          border: "1px solid #6366F140",
          fontSize: 18,
          color: "#818CF8",
          fontFamily: "sans-serif",
          fontWeight: 600,
        }}
      >
        🎓 مركز التدريب
      </div>
    </AbsoluteFill>
  );
};
