import { AbsoluteFill, useCurrentFrame } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { PremiumIntro } from "../components/PremiumIntro";
import { PremiumContent } from "../components/PremiumContent";
import { PremiumOutro } from "../components/PremiumOutro";

const ACCENT = "#A855F7";

const Icon = () => (
  <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

export const Course8Tenant = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a1225" }}>
      <AbsoluteFill>
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${ACCENT}10 0%, transparent 70%)`, top: -200, right: -200, transform: `translate(${Math.sin(frame * 0.01) * 30}px, ${Math.cos(frame * 0.015) * 20}px)` }} />
      </AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={130}>
          <PremiumIntro title="إدارة المستأجرين" subtitle="نظام Multi-Tenant احترافي" accentColor={ACCENT} icon={<Icon />} courseNumber={8} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })} />
        <TransitionSeries.Sequence durationInFrames={130}>
          <PremiumContent sectionTitle="إعداد المستأجرين" sectionIcon="🏢" accentColor={ACCENT} items={[
            { icon: "🎨", title: "تخصيص الهوية", desc: "ألوان وشعار لكل مستأجر" },
            { icon: "👥", title: "إدارة الأعضاء", desc: "دعوة وإدارة فريق كل مستأجر" },
            { icon: "📊", title: "الباقات والحدود", desc: "تحديد الحصص لكل مستأجر" },
            { icon: "🌐", title: "النطاق المخصص", desc: "ربط نطاق خاص لكل مستأجر" },
          ]} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })} />
        <TransitionSeries.Sequence durationInFrames={100}>
          <PremiumOutro title="المستأجرون جاهزون!" accentColor={ACCENT} features={["الهوية", "الأعضاء", "الباقات", "النطاق"]} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
