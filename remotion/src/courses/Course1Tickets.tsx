import { AbsoluteFill, useCurrentFrame } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { PremiumIntro } from "../components/PremiumIntro";
import { PremiumContent } from "../components/PremiumContent";
import { PremiumOutro } from "../components/PremiumOutro";

const ACCENT = "#6366F1";

const Icon = () => (
  <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    <path d="M8 7h6" /><path d="M8 11h8" />
  </svg>
);

export const Course1Tickets = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a1225" }}>
      <AbsoluteFill>
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${ACCENT}10 0%, transparent 70%)`, top: -200, right: -200, transform: `translate(${Math.sin(frame * 0.01) * 30}px, ${Math.cos(frame * 0.015) * 20}px)` }} />
      </AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={130}>
          <PremiumIntro title="أساسيات نظام التذاكر" subtitle="نظام إدارة التذاكر الذكي" accentColor={ACCENT} icon={<Icon />} courseNumber={1} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })} />
        <TransitionSeries.Sequence durationInFrames={130}>
          <PremiumContent sectionTitle="إنشاء ومتابعة التذاكر" sectionIcon="🎫" accentColor={ACCENT} items={[
            { icon: "📝", title: "إنشاء تذكرة جديدة", desc: "رفع التذاكر بسهولة مع تصنيف تلقائي" },
            { icon: "🔄", title: "تتبع الحالة", desc: "متابعة مراحل التذكرة لحظة بلحظة" },
            { icon: "⚡", title: "تحديد الأولويات", desc: "تصنيف حسب الأهمية والاستعجال" },
            { icon: "📎", title: "المرفقات والتعليقات", desc: "إرفاق ملفات وإضافة ملاحظات" },
          ]} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })} />
        <TransitionSeries.Sequence durationInFrames={100}>
          <PremiumOutro title="أنت جاهز لإدارة التذاكر!" accentColor={ACCENT} features={["إنشاء التذاكر", "تتبع الحالة", "الأولويات", "المرفقات"]} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
