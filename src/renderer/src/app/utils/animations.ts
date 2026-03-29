/**
 * Animation Configuration for Roost
 * Balanced approach: smooth for big transitions, snappy for interactions
 */

import { Variants } from "motion/react";

// Easing functions
export const easing: Record<string, [number, number, number, number]> = {
  smooth: [0.32, 0.72, 0, 1], // Calm, deliberate page transitions
  snappy: [0.22, 1, 0.36, 1], // Crisp without feeling springy or playful
  easeOut: [0.16, 1, 0.3, 1], // Gentle ease out
  focus: [0.2, 0.8, 0.2, 1], // Subtle, responsive state changes
};

// Page transition variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.22,
      ease: easing.smooth,
    },
  },
};

// Modal/Dialog variants
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.975,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.985,
    y: 8,
    transition: {
      duration: 0.16,
      ease: easing.smooth,
    },
  },
};

// Backdrop variants
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.16, ease: easing.focus },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.14, ease: easing.focus },
  },
};

// List container with stagger
export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// List item variants (for adding new items)
export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.985,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.985,
    x: -12,
    transition: {
      duration: 0.14,
      ease: easing.smooth,
    },
  },
};

// Checkbox/Complete variants (with strikethrough effect)
export const checkboxVariants: Variants = {
  unchecked: {
    opacity: 1,
    scale: 1,
  },
  checked: {
    opacity: 0.6,
    scale: 0.98,
    transition: {
      duration: 0.16,
      ease: easing.smooth,
    },
  },
};

// Strikethrough line animation
export const strikethroughVariants: Variants = {
  hidden: {
    width: "0%",
    opacity: 0,
  },
  visible: {
    width: "100%",
    opacity: 1,
    transition: {
      duration: 0.28,
      ease: easing.easeOut,
    },
  },
};

// Card hover variants
export const cardHoverVariants: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.01,
    transition: {
      duration: 0.14,
      ease: easing.snappy,
    },
  },
};

// Button hover variants
export const buttonHoverVariants: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.015,
    transition: {
      duration: 0.12,
      ease: easing.snappy,
    },
  },
  tap: {
    scale: 0.985,
    transition: {
      duration: 0.08,
    },
  },
};

// Settle up flow - staged animations
export const settleUpStageVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.24,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.16,
      ease: easing.smooth,
    },
  },
};

// Success/Celebration animation
export const successVariants: Variants = {
  initial: {
    scale: 0,
    rotate: -120,
  },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.24,
      ease: easing.easeOut,
    },
  },
};

// Category expand/collapse
export const categoryExpandVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      duration: 0.14,
      ease: easing.smooth,
    },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: easing.easeOut,
    },
  },
};
