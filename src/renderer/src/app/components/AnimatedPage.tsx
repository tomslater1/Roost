import { motion } from "motion/react";
import { pageVariants } from "../utils/animations";
import { ReactNode } from "react";

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper component for page-level animations
 * Provides smooth fade + slide transitions when navigating between routes
 */
export function AnimatedPage({ children, className }: AnimatedPageProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}