/**
 * Premium animation primitives — Framer Motion variants & easing.
 * Use across pages for consistent, polished motion.
 */
import type { Variants, Transition } from 'framer-motion';

// Curves
export const ease = {
  spring: [0.34, 1.56, 0.64, 1] as const,
  smooth: [0.16, 1, 0.3, 1] as const,
  snap: [0.4, 0, 0.2, 1] as const,
  out: [0.22, 1, 0.36, 1] as const,
};

// Spring physics for natural feel
export const spring: Transition = {
  type: 'spring',
  stiffness: 280,
  damping: 26,
  mass: 0.8,
};

export const springSoft: Transition = {
  type: 'spring',
  stiffness: 180,
  damping: 22,
  mass: 1,
};

// Page-level
export const pageContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05, when: 'beforeChildren' },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// Section: fade + slide up + blur
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease: ease.smooth },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: ease.smooth } },
};

// Card: scale + fade with spring
export const cardEnter: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: spring },
};

// List stagger
export const listContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.045, delayChildren: 0.08 },
  },
};

export const listItem: Variants = {
  hidden: { opacity: 0, x: 18, filter: 'blur(3px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.42, ease: ease.smooth },
  },
};

// Hover micro-interactions
export const hoverLift = {
  y: -3,
  transition: { duration: 0.25, ease: ease.smooth },
};

export const hoverScale = {
  scale: 1.03,
  transition: { duration: 0.2, ease: ease.smooth },
};

export const tapShrink = { scale: 0.97 };

// Number ticker variant
export const counterPop: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: spring },
};

// Stagger grid (KPIs)
export const gridContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};
