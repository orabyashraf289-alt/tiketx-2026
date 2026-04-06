import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";

const C = { primary: "#EF4444", accent: "#F97316", dark: "#0F172A", surface: "#1E293B", white: "#F8FAFC", green: "#10B981", blue: "#3B82F6" };

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
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>
      </div>
      <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, fontSize: 60, fontWeight: 800, color: C.white, textAlign: "center", fontFamily: "sans-serif" }}>
        إعدادات النظام والأمان
      </div>
      <div style={{ width: lineWidth, height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`, margin: "20px auto" }} />
      <div style={{ opacity: subOpacity, fontSize: 26, color: "#94A3B8", textAlign: "center", fontFamily: "sans-serif" }}>
        حماية البيانات وضبط الإعدادات المتقدمة
      </div>
    </AbsoluteFill>
  );
};

const ContentScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const settings = [
    { icon: "🔐", title: "المصادقة الثنائية", status: "مفعل", statusColor: C.green },
    { icon: "🛡️", title: "سياسات كلمة المرور", status: "صارم", statusColor: C.blue },
    { icon: "📋", title: "سجل المراجعة", status: "مفعل", statusColor: C.green },
    { icon: "🔒", title: "تشفير البيانات", status: "AES-256", statusColor: C.green },
    { icon: "👤", title: "إدارة الجلسات", status: "30 دقيقة", statusColor: C.accent },
  ];

  return (
    <AbsoluteFill style={{ padding: 80, justifyContent: "center", direction: "rtl" }}>
      <div style={{ opacity: headerOpacity, marginBottom: 16 }}>
        <div style={{ display: "inline-flex", padding: "8px 20px", borderRadius: 50, background: `${C.primary}15`, border: `1px solid ${C.primary}30`, fontSize: 16, color: "#F87171", fontFamily: "sans-serif", fontWeight: 600 }}>
          🔒 إعدادات الأمان
        </div>
      </div>
      <div style={{ opacity: headerOpacity, fontSize: 48, fontWeight: 800, color: C.white, fontFamily: "sans-serif", marginBottom: 40 }}>
        تكوينات الحماية
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {settings.map((s, i) => {
          const delay = 15 + i * 10;
          const sp = spring({ frame: frame - delay, fps, config: { damping: 15 } });
          const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          return (
            <div key={i} style={{ opacity, transform: `translateX(${interpolate(sp, [0, 1], [60, 0])}px)`, background: C.surface, borderRadius: 14, padding: "18px 28px", border: "1px solid #334155", display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ fontSize: 32 }}>{s.icon}</div>
              <div style={{ flex: 1, fontSize: 20, fontWeight: 600, color: C.white, fontFamily: "sans-serif" }}>{s.title}</div>
              <div style={{ padding: "6px 18px", borderRadius: 50, background: `${s.statusColor}20`, border: `1px solid ${s.statusColor}40`, fontSize: 15, color: s.statusColor, fontFamily: "sans-serif", fontWeight: 600 }}>{s.status}</div>
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
  const features = ["أمان متقدم", "سجل المراجعة", "الصلاحيات", "النسخ الاحتياطي"];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", direction: "rtl" }}>
      {[1, 2, 3].map((r) => (
        <div key={r} style={{ position: "absolute", width: 300 + r * 180, height: 300 + r * 180, borderRadius: "50%", border: `1px solid ${C.primary}`, opacity: interpolate(frame, [5 + r * 8, 25 + r * 8], [0, 0.08], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }) }} />
      ))}
      <div style={{ transform: `scale(${scale})`, fontSize: 52, fontWeight: 800, color: C.white, fontFamily: "sans-serif", marginBottom: 30 }}>
        نظام آمن ومحمي! 🔒
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        {features.map((f, i) => (
          <div key={i} style={{ opacity: interpolate(frame, [40 + i * 8, 55 + i * 8], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }), padding: "10px 24px", borderRadius: 50, background: C.surface, border: "1px solid #334155", fontSize: 17, color: "#E2E8F0", fontFamily: "sans-serif", fontWeight: 600 }}>{f}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Course7Security = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.dark }}>
      <AbsoluteFill>
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${C.primary}15 0%, transparent 70%)`, top: -200, left: -100, transform: `translate(${Math.sin(frame * 0.01) * 30}px, ${Math.cos(frame * 0.015) * 20}px)` }} />
      </AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={120}><IntroScene /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })} />
        <TransitionSeries.Sequence durationInFrames={130}><ContentScene /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })} />
        <TransitionSeries.Sequence durationInFrames={110}><OutroScene /></TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
