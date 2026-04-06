import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { Scene1Intro } from "./scenes/Scene1Intro";
import { Scene2Dashboard } from "./scenes/Scene2Dashboard";
import { Scene3Tickets } from "./scenes/Scene3Tickets";
import { Scene4Approvals } from "./scenes/Scene4Approvals";
import { Scene5Outro } from "./scenes/Scene5Outro";

const COLORS = {
  primary: "#6366F1",
  primaryLight: "#818CF8",
  accent: "#06B6D4",
  dark: "#0F172A",
  darkBlue: "#1E293B",
  surface: "#1E1B4B",
  white: "#F8FAFC",
  gold: "#F59E0B",
};

export const MainVideo = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark, direction: "rtl" }}>
      {/* Persistent animated background */}
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            width: 800,
            height: 800,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLORS.primary}15 0%, transparent 70%)`,
            top: -200,
            right: -200,
            transform: `translate(${Math.sin(frame * 0.01) * 30}px, ${Math.cos(frame * 0.015) * 20}px)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLORS.accent}10 0%, transparent 70%)`,
            bottom: -100,
            left: -100,
            transform: `translate(${Math.cos(frame * 0.012) * 25}px, ${Math.sin(frame * 0.018) * 15}px)`,
          }}
        />
      </AbsoluteFill>

      {/* Grid pattern */}
      <AbsoluteFill style={{ opacity: 0.03 }}>
        <svg width="1920" height="1080">
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 100} y1={0} x2={i * 100} y2={1080} stroke="white" strokeWidth={1} />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 100} x2={1920} y2={i * 100} stroke="white" strokeWidth={1} />
          ))}
        </svg>
      </AbsoluteFill>

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={140}>
          <Scene1Intro />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        <TransitionSeries.Sequence durationInFrames={130}>
          <Scene2Dashboard />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        <TransitionSeries.Sequence durationInFrames={130}>
          <Scene3Tickets />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        <TransitionSeries.Sequence durationInFrames={130}>
          <Scene4Approvals />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        <TransitionSeries.Sequence durationInFrames={130}>
          <Scene5Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
