import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

const C = { primary: "#3B82F6", accent: "#8B5CF6", dark: "#0F172A", surface: "#1E293B", white: "#F8FAFC", green: "#10B981", amber: "#F59E0B" };

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
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
      </div>
      <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, fontSize: 64, fontWeight: 800, color: C.white, textAlign: "center", fontFamily: "sans-serif" }}>
        التقارير والتحليلات
      </div>
      <div style={{ width: lineWidth, height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`, margin: "20px auto" }} />
      <div style={{ opacity: subOpacity, fontSize: 26, color: "#94A3B8", textAlign: "center", fontFamily: "sans-serif" }}>
        رؤى تحليلية عميقة لاتخاذ قرارات أفضل
      </div>
    </AbsoluteFill>
  );
};

const ContentScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const barHeights = [55, 80, 40, 90, 65, 50, 75, 85, 60, 95, 70, 45];
  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  return (
    <AbsoluteFill style={{ padding: 80, justifyContent: "center", direction: "rtl" }}>
      <div style={{ opacity: headerOpacity, marginBottom: 16 }}>
        <div style={{ display: "inline-flex", padding: "8px 20px", borderRadius: 50, background: `${C.primary}15`, border: `1px solid ${C.primary}30`, fontSize: 16, color: "#60A5FA", fontFamily: "sans-serif", fontWeight: 600 }}>
          📊 لوحة التحليلات
        </div>
      </div>
      <div style={{ opacity: headerOpacity, fontSize: 48, fontWeight: 800, color: C.white, fontFamily: "sans-serif", marginBottom: 50 }}>
        تقرير التذاكر السنوي
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 250 }}>
        {barHeights.map((h, i) => {
          const barProgress = interpolate(frame, [20 + i * 4, 45 + i * 4], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "sans-serif", opacity: barProgress }}>{h}</div>
              <div style={{ width: 48, height: h * 2.5 * barProgress, borderRadius: "6px 6px 3px 3px", background: `linear-gradient(180deg, ${C.primary}, ${C.accent})`, opacity: 0.8 + barProgress * 0.2 }} />
              <div style={{ fontSize: 10, color: "#64748B", fontFamily: "sans-serif", opacity: barProgress }}>{months[i]}</div>
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
  const features = ["تقارير مخصصة", "تصدير PDF", "رسوم بيانية", "مؤشرات KPI"];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", direction: "rtl" }}>
      {[1, 2, 3].map((r) => (
        <div key={r} style={{ position: "absolute", width: 300 + r * 180, height: 300 + r * 180, borderRadius: "50%", border: `1px solid ${C.primary}`, opacity: interpolate(frame, [5 + r * 8, 25 + r * 8], [0, 0.08], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }) }} />
      ))}
      <div style={{ transform: `scale(${scale})`, fontSize: 52, fontWeight: 800, color: C.white, fontFamily: "sans-serif", marginBottom: 30 }}>
        قرارات مبنية على البيانات! 📊
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        {features.map((f, i) => (
          <div key={i} style={{ opacity: interpolate(frame, [40 + i * 8, 55 + i * 8], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }), padding: "10px 24px", borderRadius: 50, background: C.surface, border: "1px solid #334155", fontSize: 17, color: "#E2E8F0", fontFamily: "sans-serif", fontWeight: 600 }}>{f}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Course6Reports = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.dark }}>
      <AbsoluteFill>
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${C.primary}15 0%, transparent 70%)`, bottom: -150, left: -200, transform: `translate(${Math.cos(frame * 0.012) * 25}px, ${Math.sin(frame * 0.018) * 15}px)` }} />
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
