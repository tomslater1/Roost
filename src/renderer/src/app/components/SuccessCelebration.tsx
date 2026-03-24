import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Sparkles } from "lucide-react";

interface SuccessCelebrationProps {
  show: boolean;
  message: string;
  onComplete?: () => void;
}

export function SuccessCelebration({ show, message, onComplete }: SuccessCelebrationProps) {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
            className="bg-success text-success-foreground rounded-2xl px-8 py-6 shadow-2xl flex items-center gap-4 max-w-md"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 10, 0],
              }}
              transition={{
                duration: 0.5,
                times: [0, 0.25, 0.5, 0.75, 1],
              }}
            >
              <CheckCircle2 className="w-12 h-12" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium text-sm">Success!</span>
              </div>
              <p className="text-lg font-semibold">{message}</p>
            </div>
          </motion.div>

          {/* Confetti particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: "50vw",
                y: "50vh",
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: `${50 + (Math.random() - 0.5) * 100}vw`,
                y: `${50 + (Math.random() - 0.5) * 100}vh`,
                scale: Math.random() * 1.5 + 0.5,
                opacity: 0,
              }}
              transition={{
                duration: 1 + Math.random(),
                ease: "easeOut",
              }}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: ["#d4795e", "#9db19f", "#e6a563", "#b88b7e", "#7fa087"][i % 5],
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
