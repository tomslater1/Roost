import { motion } from "motion/react";

interface ProgressIndicatorProps {
  current: number;
  total: number;
  labels?: string[];
}

export function ProgressIndicator({ current, total, labels }: ProgressIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: i <= current ? 1 : 0.8,
                opacity: i <= current ? 1 : 0.4,
              }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${
                  i < current
                    ? "bg-success text-success-foreground"
                    : i === current
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < current ? "✓" : i + 1}
              </div>
              {labels && labels[i] && (
                <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-xs text-center whitespace-nowrap text-muted-foreground">
                  {labels[i]}
                </span>
              )}
            </motion.div>
            {i < total - 1 && (
              <div className="flex-1 h-0.5 bg-muted mx-2 relative overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: i < current ? "100%" : "0%" }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-success"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
