import { AbsoluteFill, useCurrentFrame } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { PremiumIntro } from "../components/PremiumIntro";
import { PremiumContent } from "../components/PremiumContent";
import { PremiumOutro } from "../components/PremiumOutro";

const ACCENT = "#10B981";

const Icon = () => (
  <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
  </svg>
);

export const Course4Classera = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a1225" }}>
      <AbsoluteFill>
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${ACCENT}10 0%, transparent 70%)`, top: -200, right: -200, transform: `translate(${Math.sin(frame * 0.01) * 30}px, ${Math.cos(frame * 0.015) * 20}px)` }} />
      </AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={130}>
          <PremiumIntro title="التكامل مع كلاسيرا" subtitle="ربط الأنظمة بسلاسة" accentColor={ACCENT} icon={<Icon />} courseNumber={4} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })} />
        <TransitionSeries.Sequence durationInFrames={130}>
          <PremiumContent sectionTitle="إعداد التكامل" sectionIcon="🔗" accentColor={ACCENT} items={[
            { icon: "⚙️", title: "إعداد الربط", desc: "تهيئة الاتصال مع كلاسيرا" },
            { icon: "🔄", title: "مزامنة البيانات", desc: "مزامنة تلقائية ثنائية الاتجاه" },
            { icon: "📩", title: "استقبال التذاكر", desc: "استقبال تذاكر من الأنظمة الخارجية" },
            { icon: "📤", title: "إرسال التحديثات", desc: "تحديث الحالة في النظام المصدر" },
          ]} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })} />
        <TransitionSeries.Sequence durationInFrames={100}>
          <PremiumOutro title="التكامل مفعّل بنجاح!" accentColor={ACCENT} features={["الربط", "المزامنة", "الاستقبال", "التحديثات"]} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
