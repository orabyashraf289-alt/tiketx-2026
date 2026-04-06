import { AbsoluteFill, useCurrentFrame } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { PremiumIntro } from "../components/PremiumIntro";
import { PremiumContent } from "../components/PremiumContent";
import { PremiumOutro } from "../components/PremiumOutro";

const ACCENT = "#F97316";

const Icon = () => (
  <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export const Course5Automation = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a1225" }}>
      <AbsoluteFill>
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${ACCENT}10 0%, transparent 70%)`, top: -200, right: -200, transform: `translate(${Math.sin(frame * 0.01) * 30}px, ${Math.cos(frame * 0.015) * 20}px)` }} />
      </AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={130}>
          <PremiumIntro title="الأتمتة الذكية" subtitle="أتمتة سير العمل بالكامل" accentColor={ACCENT} icon={<Icon />} courseNumber={5} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })} />
        <TransitionSeries.Sequence durationInFrames={130}>
          <PremiumContent sectionTitle="قواعد الأتمتة" sectionIcon="⚡" accentColor={ACCENT} items={[
            { icon: "🎯", title: "الشروط والمحفزات", desc: "تعريف شروط تنفيذ القواعد" },
            { icon: "🔁", title: "الإجراءات التلقائية", desc: "تعيين وتحويل وإشعار تلقائي" },
            { icon: "📋", title: "القوالب الجاهزة", desc: "قوالب أتمتة معدة مسبقاً" },
            { icon: "📊", title: "سجل التنفيذ", desc: "تتبع كل عملية أتمتة" },
          ]} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })} />
        <TransitionSeries.Sequence durationInFrames={100}>
          <PremiumOutro title="الأتمتة تعمل بكفاءة!" accentColor={ACCENT} features={["الشروط", "الإجراءات", "القوالب", "السجل"]} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
