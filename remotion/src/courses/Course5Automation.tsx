import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";

const C = { primary: "#F97316", accent: "#EAB308", dark: "#0F172A", surface: "#1E293B", white: "#F8FAFC", green: "#10B981", blue: "#3B82F6" };

const IntroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 150 } });
  const titleOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const titleY = interpolate(spring({ frame: frame - 15, fps, config: { damping: 20 } }), [0, 1], [60, 0]);
  const lineWidth = interpolate(frame, [40, 70], [0, 350], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const subOpacity = interpolate(frame, [45, 65], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", direction: "rtl" }}>
      <div style={{ transform: `scale(${logoScale})`, marginBottom: 30 }}>
        <div style={{ width: 110, height: 110, borderRadius: 26, background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 20px 60px ${C.primary}66` }}>
          <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
      </div>
      <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, fontSize: 64, fontWeight: 800, color: C.white, textAlign: "center", fontFamily: "sans-serif" }}>
        سير العمل والأتمتة
      </div>
      <div style={{ width: lineWidth, height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`, margin: "20px auto" }} />
      <div style={{ opacity: subOpacity, fontSize: 26, color: "#94A3B8", textAlign: "center", fontFamily: "sans-serif" }}>
        أتمتة العمليات المتكررة وتوفير الوقت
      </div>
    </AbsoluteFill>
  );
};

const ContentScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const rules = [
    { trigger: "عند إنشاء تذكرة", action: "تعيين تلقائي للقسم", icon: "⚡" },
    { trigger: "عند تجاوز SLA", action: "تصعيد للمدير", icon: "🔔" },
    { trigger: "عند تغيير الحالة", action: "إرسال إشعار", icon: "📧" },
  ];

  return (
    <AbsoluteFill style={{ padding: 80, justifyContent: "center", direction: "rtl" }}>
      <div style={{ opacity: headerOpacity, marginBottom: 16 }}>
        <div style={{ display: "inline-flex", padding: "8px 20px", borderRadius: 50, background: `${C.primary}15`, border: `1px solid ${C.primary}30`, fontSize: 16, color: C.primary, fontFamily: "sans-serif", fontWeight: 600 }}>
          ⚡ قواعد الأتمتة
        </div>
      </div>
      <div style={{ opacity: headerOpacity, fontSize: 48, fontWeight: 800, color: C.white, fontFamily: "sans-serif", marginBottom: 40 }}>
        أتمتة ذكية للعمليات
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {rules.map((rule, i) => {
          const delay = 15 + i * 15;
          const s = spring({ frame: frame - delay, fps, config: { damping: 15 } });
          const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          return (
            <div key={i} style={{ opacity, transform: `translateX(${interpolate(s, [0, 1], [80, 0])}px)`, background: C.surface, borderRadius: 16, padding: "24px 32px", border: "1px solid #334155", display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ fontSize: 40 }}>{rule.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: "#64748B", fontFamily: "sans-serif", marginBottom: 4 }}>المحفز</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: "sans-serif" }}>{rule.trigger}</div>
              </div>
              <div style={{ width: 60, display: "flex", justifyContent: "center" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: "#64748B", fontFamily: "sans-serif", marginBottom: 4 }}>الإجراء</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.green, fontFamily: "sans-serif" }}>{rule.action}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const OutroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame: frame - 5, fps, config: { damping: 10 } });
  const features = ["قواعد ذكية", "تصعيد تلقائي", "إشعارات", "سجل الأتمتة"];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", direction: "rtl" }}>
      {[1, 2, 3].map((r) => (
        <div key={r} style={{ position: "absolute", width: 300 + r * 180, height: 300 + r * 180, borderRadius: "50%", border: `1px solid ${C.primary}`, opacity: interpolate(frame, [5 + r * 8, 25 + r * 8], [0, 0.08], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }) }} />
      ))}
      <div style={{ transform: `scale(${scale})`, fontSize: 52, fontWeight: 800, color: C.white, fontFamily: "sans-serif", marginBottom: 30 }}>
        عمليات أسرع بالأتمتة! ⚡
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        {features.map((f, i) => (
          <div key={i} style={{ opacity: interpolate(frame, [40 + i * 8, 55 + i * 8], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }), padding: "10px 24px", borderRadius: 50, background: C.surface, border: "1px solid #334155", fontSize: 17, color: "#E2E8F0", fontFamily: "sans-serif", fontWeight: 600 }}>{f}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Course5Automation = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.dark }}>
      <AbsoluteFill>
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${C.primary}15 0%, transparent 70%)`, top: -200, right: -100, transform: `translate(${Math.sin(frame * 0.01) * 30}px, ${Math.cos(frame * 0.015) * 20}px)` }} />
      </AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={120}><IntroScene /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })} />
        <TransitionSeries.Sequence durationInFrames={130}><ContentScene /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })} />
        <TransitionSeries.Sequence durationInFrames={110}><OutroScene /></TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
