import { AbsoluteFill, useCurrentFrame } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { PremiumIntro } from "../components/PremiumIntro";
import { PremiumContent } from "../components/PremiumContent";
import { PremiumOutro } from "../components/PremiumOutro";

const ACCENT = "#EF4444";

const Icon = () => (
  <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export const Course7Security = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a1225" }}>
      <AbsoluteFill>
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${ACCENT}10 0%, transparent 70%)`, top: -200, right: -200, transform: `translate(${Math.sin(frame * 0.01) * 30}px, ${Math.cos(frame * 0.015) * 20}px)` }} />
      </AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={130}>
          <PremiumIntro title="الأمان والحماية" subtitle="حماية شاملة لبياناتك" accentColor={ACCENT} icon={<Icon />} courseNumber={7} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })} />
        <TransitionSeries.Sequence durationInFrames={130}>
          <PremiumContent sectionTitle="إعدادات الأمان" sectionIcon="🛡️" accentColor={ACCENT} items={[
            { icon: "🔐", title: "المصادقة الثنائية", desc: "حماية إضافية لحسابات المستخدمين" },
            { icon: "📝", title: "سجل المراجعة", desc: "تتبع جميع العمليات والتغييرات" },
            { icon: "🔑", title: "إدارة الجلسات", desc: "التحكم في جلسات المستخدمين" },
            { icon: "🚫", title: "سياسات الأمان", desc: "تعريف سياسات كلمات المرور" },
          ]} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })} />
        <TransitionSeries.Sequence durationInFrames={100}>
          <PremiumOutro title="نظامك محمي بالكامل!" accentColor={ACCENT} features={["المصادقة", "المراجعة", "الجلسات", "السياسات"]} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
