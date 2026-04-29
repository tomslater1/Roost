import { useCallback, useState } from "react";
import { Fingerprint, Key, Lock, Timer } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Delete } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Switch } from "../../components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/select";
import * as appLock from "@/lib/appLock";
import { useLock } from "@/context/LockContext";
import { PINSetupFlow } from "@/components/security/PINSetupFlow";

const ease = [0.16, 1, 0.3, 1] as const;
const PIN_LENGTH = 6;

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </p>
  );
}

// ── Toggle row ────────────────────────────────────────────────────────────────

function ToggleRow({
  icon: Icon,
  iconBg,
  label,
  sublabel,
  checked,
  onCheckedChange,
  disabled = false,
  badge,
}: {
  icon: React.ElementType;
  iconBg: string;
  label: string;
  sublabel: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <motion.div
      layout
      className={`flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">{label}</p>
            {badge}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-4">{sublabel}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="flex-shrink-0"
      />
    </motion.div>
  );
}

// ── Inline PIN confirmation (for disable / change PIN) ────────────────────────

const CONFIRM_KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'] as const;
type ConfirmKey = typeof CONFIRM_KEYS[number];

function InlinePINConfirm({
  heading,
  onSuccess,
  onCancel,
}: {
  heading: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState("");
  const [shaking, setShaking] = useState(false);

  const handleKey = useCallback(async (key: ConfirmKey) => {
    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    const next = pin + key;
    if (next.length > PIN_LENGTH) return;
    setPin(next);

    if (next.length === PIN_LENGTH) {
      const ok = await appLock.verifyPIN(next);
      if (ok) {
        onSuccess();
      } else {
        setShaking(true);
        setTimeout(() => {
          setShaking(false);
          setPin("");
        }, 450);
      }
    }
  }, [pin, onSuccess]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease }}
      className="overflow-hidden"
    >
      <div className="mt-4 pt-4 border-t border-border/60 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{heading}</p>
          <p className="text-xs text-muted-foreground">Enter your current PIN to continue.</p>
        </div>

        {/* Dots */}
        <motion.div
          className="flex gap-2.5 items-center"
          animate={shaking ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => {
            const filled = i < pin.length;
            return (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  backgroundColor: filled ? "#d4795e" : "transparent",
                  scale: filled ? [1, 1.15, 1] : 1,
                }}
                transition={{ duration: 0.12 }}
                className="w-2.5 h-2.5 rounded-full border-2"
                style={{ borderColor: filled ? "#d4795e" : "rgba(61,50,41,0.3)" }}
              />
            );
          })}
        </motion.div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-1.5 max-w-[220px]">
          {CONFIRM_KEYS.map((key, i) => {
            if (key === "") return <div key={`blank-${i}`} />;
            return (
              <motion.button
                key={key}
                type="button"
                whileTap={{ scale: 0.93 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={() => handleKey(key as ConfirmKey)}
                className="h-10 rounded-[10px] bg-muted/50 border border-border/40 flex items-center justify-center text-sm font-medium text-foreground hover:bg-muted transition-colors select-none"
                aria-label={key === "⌫" ? "Backspace" : key}
              >
                {key === "⌫" ? (
                  <Delete className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  key
                )}
              </motion.button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function Security() {
  const { refreshLockEnabled } = useLock();

  // Derive initial state from appLock config
  const [config, setConfig] = useState(() => appLock.getConfig());

  const appLockEnabled = config.isEnabled && config.pinHash !== null;
  const autoLockStr = appLock.autoLockDelayToString(config.autoLockDelay);

  // Modal / inline state
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [showChangePINConfirm, setShowChangePINConfirm] = useState(false);

  const refreshConfig = () => setConfig(appLock.getConfig());

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAppLockToggle = (on: boolean) => {
    if (on) {
      // Open PIN setup flow; lock will be enabled on completion
      setShowPinSetup(true);
    } else {
      if (!appLockEnabled) return;
      // Show inline PIN entry to confirm disable
      setShowDisableConfirm(true);
    }
  };

  const handlePinSetupComplete = () => {
    setShowPinSetup(false);
    refreshConfig();
    refreshLockEnabled();
  };

  const handlePinSetupCancel = () => {
    setShowPinSetup(false);
    // Toggle was flipped to ON; cancel means it should stay OFF
    // Config was not changed in setupPIN, so nothing to undo.
  };

  const handleDisableConfirmed = () => {
    appLock.clearPIN();
    setShowDisableConfirm(false);
    refreshConfig();
    refreshLockEnabled();
  };

  const handleDisableCancel = () => {
    setShowDisableConfirm(false);
  };

  const handleAutoLockChange = (value: string) => {
    const ms = appLock.autoLockDelayFromString(value);
    appLock.updateConfig({ autoLockDelay: ms });
    refreshConfig();
  };

  const handleChangePINConfirmed = () => {
    // Current PIN verified — open setup flow to set a new one
    setShowChangePINConfirm(false);
    setShowPinSetup(true);
  };

  const AUTO_LOCK_OPTIONS = [
    { value: "immediately", label: "Immediately" },
    { value: "1m", label: "1 minute" },
    { value: "5m", label: "5 minutes" },
    { value: "15m", label: "15 minutes" },
    { value: "never", label: "Never" },
  ];

  return (
    <div className="max-w-2xl space-y-8">

      {/* PIN setup flow modal */}
      <AnimatePresence>
        {showPinSetup && (
          <PINSetupFlow
            onComplete={handlePinSetupComplete}
            onCancel={handlePinSetupCancel}
          />
        )}
      </AnimatePresence>

      {/* ── App lock ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease }}
      >
        <SectionHeading>App lock</SectionHeading>

        <Card>
          <CardContent className="p-5 space-y-0 divide-y divide-border/60">

            {/* App lock toggle */}
            <div>
              <ToggleRow
                icon={Lock}
                iconBg="bg-muted"
                label="Require PIN to open Roost"
                sublabel="Protects your financial information if someone else picks up your Mac"
                checked={appLockEnabled}
                onCheckedChange={handleAppLockToggle}
              />

              {/* Inline disable confirmation */}
              <AnimatePresence initial={false}>
                {showDisableConfirm && (
                  <InlinePINConfirm
                    key="disable-confirm"
                    heading="Disable app lock"
                    onSuccess={handleDisableConfirmed}
                    onCancel={handleDisableCancel}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Auto-lock — only visible when app lock is on */}
            <AnimatePresence initial={false}>
              {appLockEnabled && (
                <motion.div
                  key="auto-lock"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-4 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                        <Timer className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Lock after</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          How long before Roost locks when you step away
                        </p>
                      </div>
                    </div>
                    <Select value={autoLockStr} onValueChange={handleAutoLockChange}>
                      <SelectTrigger className="w-[130px] text-sm" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AUTO_LOCK_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Change PIN — visible when lock is enabled */}
            <AnimatePresence initial={false}>
              {appLockEnabled && (
                <motion.div
                  key="change-pin"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease }}
                  className="overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between gap-4 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                          <Key className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">Change PIN</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Replace your current PIN with a new one
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowChangePINConfirm((v) => !v)}
                        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex-shrink-0"
                      >
                        Change →
                      </button>
                    </div>

                    {/* Inline current-PIN confirmation before opening setup */}
                    <AnimatePresence initial={false}>
                      {showChangePINConfirm && (
                        <InlinePINConfirm
                          key="change-confirm"
                          heading="Confirm your current PIN"
                          onSuccess={handleChangePINConfirmed}
                          onCancel={() => setShowChangePINConfirm(false)}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Touch ID ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05, ease }}
      >
        <SectionHeading>Biometrics</SectionHeading>

        <Card>
          <CardContent className="p-5">
            <ToggleRow
              icon={Fingerprint}
              iconBg="bg-muted"
              label="Unlock with Touch ID"
              sublabel="Use your Mac's Touch ID instead of PIN when available — available after app signing"
              checked={false}
              onCheckedChange={() => {}}
              disabled
              badge={
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                  Coming soon
                </span>
              }
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
