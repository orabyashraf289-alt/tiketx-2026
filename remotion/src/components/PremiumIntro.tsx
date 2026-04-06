import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface PremiumIntroProps {
  title: string;
  subtitle: string;
  accentColor: string;
  icon: React.ReactNode;
  courseNumber: number;
}

const DARK = "#0a1225";

export const PremiumIntro: React.FC<PremiumIntroProps> = ({ title, subtitle, accentColor, icon, courseNumber }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Rings animation
  const ringReveal = (i: number) => interpolate(frame, [5 + i * 6, 30 + i * 6], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const ringRotation = frame * 0.08;

  // Logo
  const logoScale = spring({ frame: frame - 10, fps, config: { damping: 14, stiffness: 120 } });
  const logoGlow = interpolate(frame, [10, 50, 80, 110], [0, 0.6, 0.4, 0.6], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Header "المزايا الرئيسية"
  const headerOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const headerY = interpolate(spring({ frame: frame - 20, fps, config: { damping: 20 } }), [0, 1], [-30, 0]);

  // Title
  const titleOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const titleY = interpolate(spring({ frame: frame - 50, fps, config: { damping: 18 } }), [0, 1], [40, 0]);

  // Gradient line
  const lineWidth = interpolate(frame, [65, 90], [0, 300], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Subtitle
  const subOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Course number badge
  const badgeOpacity = interpolate(frame, [35, 50], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Floating particles
  const particles = Array.from({ length: 6 }, (_, i) => ({
    x: 300 + i * 260,
    y: 200 + (i % 3) * 280,
    size: 3 + (i % 3) * 2,
    speed: 0.005 + i * 0.002,
    delay: i * 15,
  }));

  return (
    <AbsoluteFill style={{ backgroundColor: DARK, justifyContent: "center", alignItems: "center", direction: "rtl" }}>
      {/* Radial glow background */}
      <div style={{
        position: "absolute", width: 1200, height: 1200, borderRadius: "50%",
        background: `radial-gradient(circle, ${accentColor}08 0%, transparent 60%)`,
        transform: `translate(${Math.sin(frame * 0.008) * 20}px, ${Math.cos(frame * 0.01) * 15}px)`,
      }} />

      {/* Floating particles */}
      {particles.map((p, i) => {
        const pOpacity = interpolate(frame, [p.delay, p.delay + 30], [0, 0.3], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
        return (
          <div key={i} style={{
            position: "absolute", left: p.x + Math.sin(frame * p.speed + i) * 40,
            top: p.y + Math.cos(frame * p.speed * 1.3 + i) * 30,
            width: p.size, height: p.size, borderRadius: "50%",
            backgroundColor: accentColor, opacity: pOpacity * 0.5,
          }} />
        );
      })}

      {/* Concentric rings */}
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          position: "absolute",
          width: 200 + i * 140,
          height: 200 + i * 140,
          borderRadius: "50%",
          border: `${i === 2 ? 2 : 1}px solid`,
          borderColor: i <= 2 ? `${accentColor}${Math.round(ringReveal(i) * 25).toString(16).padStart(2, "0")}` : `#ffffff${Math.round(ringReveal(i) * 10).toString(16).padStart(2, "0")}`,
          transform: `rotate(${ringRotation * (i % 2 === 0 ? 1 : -1)}deg)`,
        }} />
      ))}

      {/* Header text */}
      <div style={{
        position: "absolute", top: 220,
        opacity: headerOpacity,
        transform: `translateY(${headerY}px)`,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: "#ffffff", fontFamily: "sans-serif", letterSpacing: 2 }}>
          Key
        </span>
        <span style={{ fontSize: 32, fontWeight: 700, color: accentColor, fontFamily: "sans-serif", letterSpacing: 2 }}>
          Features
        </span>
      </div>

      {/* Course number badge */}
      <div style={{
        position: "absolute", top: 60, left: 60,
        opacity: badgeOpacity,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}88)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "sans-serif",
        }}>
          {String(courseNumber).padStart(2, "0")}
        </div>
      </div>

      {/* Logo icon */}
      <div style={{
        transform: `scale(${logoScale})`,
        marginBottom: 20,
        filter: `drop-shadow(0 0 ${logoGlow * 40}px ${accentColor}66)`,
      }}>
        <div style={{
          width: 120, height: 120, borderRadius: 30,
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 20px 60px ${accentColor}44`,
        }}>
          {icon}
        </div>
      </div>

      {/* Title */}
      <div style={{
        opacity: titleOpacity,
        transform: `translateY(${titleY}px)`,
        fontSize: 58, fontWeight: 800, color: "#ffffff",
        fontFamily: "sans-serif", textAlign: "center",
        marginTop: 10,
      }}>
        {title}
      </div>

      {/* Gradient underline */}
      <div style={{
        width: lineWidth, height: 3, borderRadius: 2,
        background: `linear-gradient(90deg, ${accentColor}, #EC4899, ${accentColor})`,
        margin: "16px auto",
      }} />

      {/* Subtitle */}
      <div style={{
        opacity: subOpacity,
        fontSize: 24, color: accentColor,
        fontFamily: "sans-serif", textAlign: "center",
        letterSpacing: 1,
      }}>
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};
