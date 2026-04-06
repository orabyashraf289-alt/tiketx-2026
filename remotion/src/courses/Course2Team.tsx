import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

const C = { primary: "#8B5CF6", accent: "#EC4899", dark: "#0F172A", surface: "#1E293B", white: "#F8FAFC", green: "#10B981", blue: "#3B82F6" };

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
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
      </div>
      <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, fontSize: 64, fontWeight: 800, color: C.white, textAlign: "center", fontFamily: "sans-serif" }}>
        إدارة فريق الدعم
      </div>
      <div style={{ width: lineWidth, height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`, margin: "20px auto" }} />
      <div style={{ opacity: subOpacity, fontSize: 26, color: "#94A3B8", textAlign: "center", fontFamily: "sans-serif" }}>
        توزيع المهام وإدارة أداء الفريق بكفاءة
      </div>
    </AbsoluteFill>
  );
};

const ContentScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const members = [
    { name: "أحمد محمد", role: "مدير الدعم", tickets: 45, rating: "98%", avatar: "👨‍💼" },
    { name: "سارة علي", role: "وكيل أول", tickets: 38, rating: "95%", avatar: "👩‍💻" },
    { name: "خالد حسن", role: "وكيل دعم", tickets: 32, rating: "92%", avatar: "👨‍🔧" },
  ];

  return (
    <AbsoluteFill style={{ padding: 80, justifyContent: "center", direction: "rtl" }}>
      <div style={{ opacity: headerOpacity, marginBottom: 16 }}>
        <div style={{ display: "inline-flex", padding: "8px 20px", borderRadius: 50, background: `${C.primary}15`, border: `1px solid ${C.primary}30`, fontSize: 16, color: "#A78BFA", fontFamily: "sans-serif", fontWeight: 600 }}>
          👥 إدارة الفريق
        </div>
      </div>
      <div style={{ opacity: headerOpacity, fontSize: 48, fontWeight: 800, color: C.white, fontFamily: "sans-serif", marginBottom: 40 }}>
        أعضاء الفريق والأداء
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {members.map((m, i) => {
          const delay = 15 + i * 15;
          const s = spring({ frame: frame - delay, fps, config: { damping: 15 } });
          const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          return (
            <div key={i} style={{ opacity, transform: `scale(${interpolate(s, [0, 1], [0.8, 1])}) translateY(${interpolate(s, [0, 1], [30, 0])}px)`, background: C.surface, borderRadius: 20, padding: 32, border: "1px solid #334155", minWidth: 280, textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>{m.avatar}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.white, fontFamily: "sans-serif", marginBottom: 4 }}>{m.name}</div>
              <div style={{ fontSize: 14, color: "#94A3B8", fontFamily: "sans-serif", marginBottom: 20 }}>{m.role}</div>
              <div style={{ display: "flex", justifyContent: "space-around" }}>
                <div><div style={{ fontSize: 28, fontWeight: 800, color: C.primary, fontFamily: "sans-serif" }}>{m.tickets}</div><div style={{ fontSize: 12, color: "#64748B", fontFamily: "sans-serif" }}>تذكرة</div></div>
                <div><div style={{ fontSize: 28, fontWeight: 800, color: C.green, fontFamily: "sans-serif" }}>{m.rating}</div><div style={{ fontSize: 12, color: "#64748B", fontFamily: "sans-serif" }}>رضا</div></div>
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
  const features = ["توزيع التذاكر", "تقييم الأداء", "إدارة الصلاحيات", "التقارير"];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", direction: "rtl" }}>
      {[1, 2, 3].map((r) => (
        <div key={r} style={{ position: "absolute", width: 300 + r * 180, height: 300 + r * 180, borderRadius: "50%", border: `1px solid ${C.primary}`, opacity: interpolate(frame, [5 + r * 8, 25 + r * 8], [0, 0.08], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }) }} />
      ))}
      <div style={{ transform: `scale(${scale})`, fontSize: 52, fontWeight: 800, color: C.white, fontFamily: "sans-serif", marginBottom: 30 }}>
        فريق دعم احترافي! 👥
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        {features.map((f, i) => (
          <div key={i} style={{ opacity: interpolate(frame, [40 + i * 8, 55 + i * 8], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }), padding: "10px 24px", borderRadius: 50, background: C.surface, border: "1px solid #334155", fontSize: 17, color: "#E2E8F0", fontFamily: "sans-serif", fontWeight: 600 }}>{f}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Course2Team = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.dark }}>
      <AbsoluteFill>
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${C.primary}15 0%, transparent 70%)`, top: -200, left: -200, transform: `translate(${Math.sin(frame * 0.01) * 30}px, ${Math.cos(frame * 0.015) * 20}px)` }} />
      </AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={120}><IntroScene /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })} />
        <TransitionSeries.Sequence durationInFrames={130}><ContentScene /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })} />
        <TransitionSeries.Sequence durationInFrames={110}><OutroScene /></TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
