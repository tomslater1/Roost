/**
 * Animation Configuration for Roost
 * Balanced approach: smooth for big transitions, snappy for interactions
 */

import { Variants } from "motion/react";

// Easing functions
export const easing: Record<string, [number, number, number, number]> = {
  smooth: [0.43, 0.13, 0.23, 0.96], // Smooth for page transitions
  snappy: [0.34, 1.56, 0.64, 1], // Snappy spring for interactions
  easeOut: [0.16, 1, 0.3, 1], // Gentle ease out
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
      duration: 0.4,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.3,
      ease: easing.smooth,
    },
  },
};

// Modal/Dialog variants
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
      ease: easing.smooth,
    },
  },
};

// Backdrop variants
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
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
    y: -10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    x: -20,
    transition: {
      duration: 0.2,
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
      duration: 0.2,
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
      duration: 0.4,
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
    scale: 1.02,
    transition: {
      duration: 0.2,
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
    scale: 1.03,
    transition: {
      duration: 0.15,
      ease: easing.snappy,
    },
  },
  tap: {
    scale: 0.97,
    transition: {
      duration: 0.1,
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
      duration: 0.3,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.2,
      ease: easing.smooth,
    },
  },
};

// Success/Celebration animation
export const successVariants: Variants = {
  initial: {
    scale: 0,
    rotate: -180,
  },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
};

// Category expand/collapse
export const categoryExpandVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: easing.smooth,
    },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: easing.easeOut,
    },
  },
};
