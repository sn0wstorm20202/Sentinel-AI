'use client';

import { useReducedMotion } from 'framer-motion';
import { makeReducedVariants, pageVariants, staggerContainer, fadeUpItem, staggerContainerFast, fadeInItem } from './config';
import type { Variants } from 'framer-motion';

/**
 * Returns the correct variant set depending on whether the user has requested
 * reduced motion at the OS level. All components should consume variants via
 * this hook rather than importing config directly.
 */
export function useMotionVariants() {
  const shouldReduce = useReducedMotion();

  function resolve(variants: Variants): Variants {
    return shouldReduce ? makeReducedVariants(variants) : variants;
  }

  return {
    pageVariants:           resolve(pageVariants),
    staggerContainer:       resolve(staggerContainer),
    staggerContainerFast:   resolve(staggerContainerFast),
    fadeUpItem:             resolve(fadeUpItem),
    fadeInItem:             resolve(fadeInItem),
  };
}
