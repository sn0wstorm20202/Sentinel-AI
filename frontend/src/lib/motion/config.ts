/**
 * Sentinel AI — Motion Configuration
 *
 * Single source of truth for all Framer Motion variants and transitions.
 * Centralising here ensures consistent easing curves across the OS, and
 * makes it trivial to honour prefers-reduced-motion by swapping out this
 * module rather than scattering overrides through every component.
 */

import { Variants, Transition } from 'framer-motion';

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

export const SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 35,
};

export const SPRING_GENTLE: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 30,
};

export const EASE_OUT_QUART: Transition = {
  duration: 0.25,
  ease: [0.25, 1, 0.5, 1],
};

export const EASE_IN_OUT: Transition = {
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1],
};

// ---------------------------------------------------------------------------
// Page-level transitions
// ---------------------------------------------------------------------------

export const pageVariants: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { ...EASE_OUT_QUART, duration: 0.3 } },
  exit:    { opacity: 0, y: -4, transition: { ...EASE_IN_OUT, duration: 0.15 } },
};

// ---------------------------------------------------------------------------
// Stagger containers
// ---------------------------------------------------------------------------

export const staggerContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export const staggerContainerFast: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
};

// ---------------------------------------------------------------------------
// Child items (used inside staggered containers)
// ---------------------------------------------------------------------------

export const fadeUpItem: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: EASE_OUT_QUART },
};

export const fadeInItem: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

// ---------------------------------------------------------------------------
// Sidebar — uses translateX instead of width to stay GPU-composited
// ---------------------------------------------------------------------------

export const sidebarVariants: Variants = {
  expanded:  { x: 0, transition: SPRING_SNAPPY },
  collapsed: { x: 0, transition: SPRING_SNAPPY },   // width driven by CSS; translateX below is for content
};

// The inner content fades when collapsing so items don't clip awkwardly
export const sidebarLabelVariants: Variants = {
  visible: { opacity: 1, x: 0,   transition: { ...EASE_OUT_QUART, delay: 0.05 } },
  hidden:  { opacity: 0, x: -8,  transition: EASE_IN_OUT },
};

// ---------------------------------------------------------------------------
// Copilot panel — slides in from right edge
// ---------------------------------------------------------------------------

export const copilotPanelVariants: Variants = {
  hidden:  { opacity: 0, x: 24,  transition: SPRING_SNAPPY },
  visible: { opacity: 1, x: 0,   transition: SPRING_GENTLE },
  exit:    { opacity: 0, x: 24,  transition: EASE_IN_OUT },
};

// ---------------------------------------------------------------------------
// Skeleton shimmer — communicates loading state without layout shift
// ---------------------------------------------------------------------------

export const skeletonVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
};

// ---------------------------------------------------------------------------
// Reduced-motion override
//
// When the OS reports prefers-reduced-motion we expose an instant variant
// set: every animation becomes a 0-duration fade only.
// ---------------------------------------------------------------------------

export function makeReducedVariants(variants: Variants): Variants {
  return Object.fromEntries(
    Object.entries(variants).map(([key, value]) => [
      key,
      { ...(typeof value === 'object' ? value : {}), transition: { duration: 0 } },
    ])
  );
}
