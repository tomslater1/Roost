import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Command } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useQuickAdd } from "../context/QuickAddContext";

interface Shortcut {
  keys: string[];
  description: string;
}

const shortcuts: Shortcut[] = [
  { keys: ["?"], description: "Show keyboard shortcuts" },
  { keys: ["Cmd/Ctrl", "K"], description: "Open search" },
  { keys: ["G", "D"], description: "Go to Dashboard" },
  { keys: ["G", "S"], description: "Go to Shopping" },
  { keys: ["G", "E"], description: "Go to Spending" },
  { keys: ["G", "C"], description: "Go to Chores" },
  { keys: ["G", "B"], description: "Go to Money" },
  { keys: ["Cmd/Ctrl", "Shift", "L"], description: "Toggle theme" },
  { keys: ["N", "S"], description: "New shopping item" },
  { keys: ["N", "E"], description: "New expense" },
  { keys: ["N", "C"], description: "New chore" },
  { keys: ["Esc"], description: "Close open modal" },
];

const G_HINT = "g → D S E C B";
const N_HINT = "n → S E C";

export function KeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false);
  const [chordMode, setChordMode] = useState<"g" | "n" | null>(null);
  const chordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const { openShopping, openExpense, openChore, closeAll } = useQuickAdd();

  const clearChord = () => {
    setChordMode(null);
    if (chordTimer.current) {
      clearTimeout(chordTimer.current);
      chordTimer.current = null;
    }
  };

  const startChord = (mode: "g" | "n") => {
    setChordMode(mode);
    if (chordTimer.current) clearTimeout(chordTimer.current);
    chordTimer.current = setTimeout(clearChord, 1500);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;

      const key = e.key.toLowerCase();

      // Escape — close all quick-add modals and help dialog
      if (e.key === "Escape") {
        closeAll();
        setShowHelp(false);
        clearChord();
        return;
      }

      // Show help dialog
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowHelp(true);
        clearChord();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && key === "k") {
        e.preventDefault();
        window.dispatchEvent(new Event("roost:open-search"));
        clearChord();
        return;
      }

      // Resolve chord sequences
      if (chordMode === "g") {
        e.preventDefault();
        clearChord();
        switch (key) {
          case "d": navigate("/dashboard"); break;
          case "s": navigate("/shopping"); break;
          case "e": navigate("/money/spending"); break;
          case "c": navigate("/chores"); break;
          case "b": navigate("/money"); break;
        }
        return;
      }

      if (chordMode === "n") {
        e.preventDefault();
        clearChord();
        switch (key) {
          case "s": openShopping(); break;
          case "e": openExpense(); break;
          case "c": openChore(); break;
        }
        return;
      }

      // Start chord mode
      if (key === "g" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        startChord("g");
        return;
      }

      if (key === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        startChord("n");
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (chordTimer.current) clearTimeout(chordTimer.current);
    };
  }, [navigate, chordMode, openShopping, openExpense, openChore, closeAll]);

  return (
    <>
      {/* Chord hint badge */}
      <AnimatePresence>
        {chordMode && (
          <motion.div
            key="chord-hint"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-popover border border-border shadow-lg backdrop-blur-sm">
              <span className="text-xs font-mono text-muted-foreground">
                {chordMode === "g" ? G_HINT : N_HINT}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard hint indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        className="fixed bottom-20 right-6 z-50"
      >
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shadow-lg bg-background/95 backdrop-blur"
          onClick={() => setShowHelp(true)}
        >
          <Command className="w-3 h-3" />
          <span className="text-xs">Press ? for shortcuts</span>
        </Button>
      </motion.div>

      {/* Shortcuts dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              {shortcuts.map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((k, j) => (
                      <Badge key={j} variant="outline" className="font-mono text-xs">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
