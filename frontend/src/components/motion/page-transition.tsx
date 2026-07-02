'use client';

/**
 * PageTransition
 *
 * Wraps a page's root element with a Framer Motion fade + translateY entrance.
 * AnimatePresence in the dashboard layout drives the exit animation on route
 * change. All transitions are GPU-composited (opacity + transform only).
 */

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { useMotionVariants } from '@/lib/motion/use-motion-variants';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const { pageVariants } = useMotionVariants();

  return (
    <motion.div
      className={className}
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      // will-change tells the browser to promote this layer up front
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  );
}
