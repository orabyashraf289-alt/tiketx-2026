import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

const TicketRow = ({ title, priority, status, delay, frame, fps }: { title: string; priority: string; status: string; delay: number; frame: number; fps: number }) => {
  const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
  const x = interpolate(s, [0, 1], [200, 0]);
  const opacity = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const priorityColor: Record<string, string> = { عالية: "#EF4444", متوسطة: "#F59E0B", منخفضة: "#10B981" };
  const statusColor: Record<string, string> = { مفتوحة: "#6366F1", "قيد المعالجة": "#06B6D4", "تم الحل": "#10B981" };

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${x}px)`,
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "20px 28px",
        background: "#1E293B",
        borderRadius: 14,
        border: "1px solid #334155",
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: priorityColor[priority] || "#6366F1" }} />
      <div style={{ flex: 1, fontSize: 20, color: "#F8FAFC", fontFamily: "sans-serif", fontWeight: 600 }}>{title}</div>
      <div
        style={{
          padding: "6px 16px",
          borderRadius: 50,
          background: `${priorityColor[priority]}20`,
          color: priorityColor[priority],
          fontSize: 14,
          fontFamily: "sans-serif",
          fontWeight: 600,
        }}
      >
        {priority}
      </div>
      <div
        style={{
          padding: "6px 16px",
          borderRadius: 50,
          background: `${statusColor[status]}20`,
          color: statusColor[status],
          fontSize: 14,
          fontFamily: "sans-serif",
          fontWeight: 600,
        }}
      >
        {status}
      </div>
    </div>
  );
};

export const Scene3Tickets = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const headerY = interpolate(spring({ frame, fps, config: { damping: 20 } }), [0, 1], [-40, 0]);

  const cursorOpacity = interpolate(frame, [80, 90], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const cursorX = interpolate(frame, [90, 110], [1600, 1200], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const cursorY = interpolate(frame, [90, 110], [200, 380], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

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
            background: "#06B6D415",
            border: "1px solid #06B6D430",
            fontSize: 16,
            color: "#06B6D4",
            fontFamily: "sans-serif",
            fontWeight: 600,
          }}
        >
          🎫 الخطوة الثانية
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
          marginBottom: 50,
        }}
      >
        إدارة التذاكر
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 1000 }}>
        <TicketRow title="مشكلة في تسجيل الدخول" priority="عالية" status="مفتوحة" delay={15} frame={frame} fps={fps} />
        <TicketRow title="طلب صلاحيات إضافية" priority="متوسطة" status="قيد المعالجة" delay={25} frame={frame} fps={fps} />
        <TicketRow title="تحديث بيانات الموظف" priority="منخفضة" status="تم الحل" delay={35} frame={frame} fps={fps} />
        <TicketRow title="خطأ في التقارير الشهرية" priority="عالية" status="قيد المعالجة" delay={45} frame={frame} fps={fps} />
      </div>

      {/* Animated cursor */}
      <div
        style={{
          position: "absolute",
          left: cursorX,
          top: cursorY,
          opacity: cursorOpacity,
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#6366F1">
          <path d="M5 3l14 9-7 2-3 7z" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
