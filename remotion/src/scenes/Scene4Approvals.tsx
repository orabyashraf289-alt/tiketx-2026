import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

const ApprovalStep = ({ label, icon, delay, frame, fps, isActive }: { label: string; icon: string; delay: number; frame: number; fps: number; isActive: boolean }) => {
  const s = spring({ frame: frame - delay, fps, config: { damping: 12 } });
  const scale = interpolate(s, [0, 1], [0.5, 1]);
  const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div style={{ opacity, transform: `scale(${scale})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: isActive ? "linear-gradient(135deg, #6366F1, #06B6D4)" : "#1E293B",
          border: isActive ? "none" : "2px solid #334155",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          boxShadow: isActive ? "0 12px 40px rgba(99, 102, 241, 0.3)" : "none",
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 16, color: isActive ? "#F8FAFC" : "#64748B", fontFamily: "sans-serif", fontWeight: 600, textAlign: "center" }}>
        {label}
      </div>
    </div>
  );
};

export const Scene4Approvals = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const headerY = interpolate(spring({ frame, fps, config: { damping: 20 } }), [0, 1], [-40, 0]);

  const lineProgress = interpolate(frame, [50, 100], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const checkOpacity = interpolate(frame, [90, 105], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const checkScale = spring({ frame: frame - 90, fps, config: { damping: 8 } });

  return (
    <AbsoluteFill style={{ padding: 80, justifyContent: "center" }}>
      <div style={{ opacity: headerOpacity, transform: `translateY(${headerY}px)`, marginBottom: 16 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 20px",
            borderRadius: 50,
            background: "#10B98115",
            border: "1px solid #10B98130",
            fontSize: 16,
            color: "#10B981",
            fontFamily: "sans-serif",
            fontWeight: 600,
          }}
        >
          ✅ الخطوة الثالثة
        </div>
      </div>

      <div
        style={{
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
          fontSize: 52,
          fontWeight: 800,
          color: "#F8FAFC",
          fontFamily: "sans-serif",
          marginBottom: 80,
        }}
      >
        سير عمل الموافقات
      </div>

      {/* Approval flow */}
      <div style={{ display: "flex", alignItems: "center", gap: 40, justifyContent: "center", position: "relative" }}>
        <ApprovalStep label="تقديم الطلب" icon="📝" delay={15} frame={frame} fps={fps} isActive={frame > 15} />

        {/* Connector line */}
        <div style={{ width: 100, height: 3, background: "#334155", borderRadius: 2, position: "relative", overflow: "hidden" }}>
          <div style={{ width: `${Math.min(lineProgress * 3, 1) * 100}%`, height: "100%", background: "linear-gradient(90deg, #6366F1, #06B6D4)", borderRadius: 2 }} />
        </div>

        <ApprovalStep label="مراجعة المدير" icon="👔" delay={35} frame={frame} fps={fps} isActive={frame > 50} />

        <div style={{ width: 100, height: 3, background: "#334155", borderRadius: 2, position: "relative", overflow: "hidden" }}>
          <div style={{ width: `${Math.min(Math.max(lineProgress * 3 - 1, 0), 1) * 100}%`, height: "100%", background: "linear-gradient(90deg, #06B6D4, #10B981)", borderRadius: 2 }} />
        </div>

        <ApprovalStep label="موافقة القسم" icon="🏢" delay={55} frame={frame} fps={fps} isActive={frame > 70} />

        <div style={{ width: 100, height: 3, background: "#334155", borderRadius: 2, position: "relative", overflow: "hidden" }}>
          <div style={{ width: `${Math.min(Math.max(lineProgress * 3 - 2, 0), 1) * 100}%`, height: "100%", background: "linear-gradient(90deg, #10B981, #F59E0B)", borderRadius: 2 }} />
        </div>

        <ApprovalStep label="اعتماد نهائي" icon="🎯" delay={75} frame={frame} fps={fps} isActive={frame > 90} />
      </div>

      {/* Success badge */}
      <div
        style={{
          opacity: checkOpacity,
          transform: `scale(${checkScale})`,
          marginTop: 60,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            padding: "14px 36px",
            borderRadius: 50,
            background: "linear-gradient(135deg, #10B98120, #06B6D420)",
            border: "1px solid #10B98140",
            fontSize: 20,
            color: "#10B981",
            fontFamily: "sans-serif",
            fontWeight: 700,
          }}
        >
          ✓ تمت الموافقة بنجاح
        </div>
      </div>
    </AbsoluteFill>
  );
};
