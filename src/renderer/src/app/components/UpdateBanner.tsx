import { ArrowDownToLine, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useUpdater } from "../hooks/useUpdater";

export function UpdateBanner() {
  const { updateStatus, downloadUpdate, installUpdate } = useUpdater();

  const isVisible =
    updateStatus.status === 'available' ||
    updateStatus.status === 'downloading' ||
    updateStatus.status === 'downloaded';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 bg-secondary/15 border-b border-secondary/30 px-4 py-2">
            {updateStatus.status === 'available' && (
              <>
                <ArrowDownToLine className="w-3.5 h-3.5 text-secondary shrink-0" />
                <span className="text-xs font-medium text-secondary">
                  Roost v{updateStatus.version} is available.
                </span>
                <button
                  onClick={downloadUpdate}
                  className="text-xs font-medium px-2 py-0.5 rounded-md bg-secondary/20 hover:bg-secondary/30 text-secondary-foreground border border-secondary/40 transition-colors"
                >
                  Download update
                </button>
              </>
            )}

            {updateStatus.status === 'downloading' && (
              <>
                <ArrowDownToLine className="w-3.5 h-3.5 text-secondary shrink-0" />
                <span className="text-xs font-medium text-secondary">
                  Downloading update… {updateStatus.percent}%
                </span>
              </>
            )}

            {updateStatus.status === 'downloaded' && (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-secondary shrink-0" />
                <span className="text-xs font-medium text-secondary">
                  Update ready. Restart to apply.
                </span>
                <button
                  onClick={installUpdate}
                  className="text-xs font-medium px-2 py-0.5 rounded-md bg-secondary/20 hover:bg-secondary/30 text-secondary-foreground border border-secondary/40 transition-colors"
                >
                  Restart &amp; update
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
