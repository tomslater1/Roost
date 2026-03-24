import { WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 bg-warning/15 border-b border-warning/30 px-4 py-2">
            <WifiOff className="w-3.5 h-3.5 text-warning shrink-0" />
            <span className="text-xs text-warning font-medium">
              No internet connection — changes will sync when you're back
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
