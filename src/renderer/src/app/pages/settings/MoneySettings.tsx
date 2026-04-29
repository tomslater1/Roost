import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { Check, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/select";
import { useApp } from "../../context/AppContext";
import { useHome } from "@/hooks/useHome";
import { useMoneySettings } from "@/hooks/useMoneySettings";
import { MemberAvatar } from "@/components/MemberAvatar";

const ease = [0.16, 1, 0.3, 1] as const;

// ── Currency options ──────────────────────────────────────────────────────────

const CURRENCY_OPTIONS = [
  { value: "GBP", label: "£ GBP" },
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
  { value: "AUD", label: "$ AUD" },
  { value: "CAD", label: "$ CAD" },
  { value: "JPY", label: "¥ JPY" },
  { value: "CHF", label: "Fr CHF" },
];

function getCurrencySymbol(code: string): string {
  const map: Record<string, string> = {
    GBP: "£", USD: "$", EUR: "€", AUD: "$", CAD: "$", JPY: "¥", CHF: "Fr ",
  };
  return map[code] ?? code;
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </p>
  );
}

// ── Inline save confirmation ──────────────────────────────────────────────────

function SavedConfirmation({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.span
          key="saved"
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5 text-xs text-success"
        >
          <Check className="w-3.5 h-3.5" />
          Saved
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// ── Section 1: Your income ────────────────────────────────────────────────────

function IncomeSection() {
  const { currentMember, partnerMember, partnerName } = useApp();
  const { home } = useHome();
  const {
    myIncome,
    myIncomeVisibleToPartner,
    incomeSetAt,
    partnerIncomeVisible,
    partnerIncome,
    combinedIncome,
    setMyIncome,
    setIncomeVisibility,
  } = useMoneySettings();

  const currencyCode = home?.currency_symbol ?? "GBP";
  const symbol = getCurrencySymbol(currencyCode);

  // Local input for income amount
  const [incomeInput, setIncomeInput] = useState(
    myIncome != null ? String(myIncome) : ""
  );
  const [saveConfirm, setSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync when myIncome changes from DB
  useEffect(() => {
    if (myIncome != null) {
      setIncomeInput(String(myIncome));
    }
  }, [myIncome]);

  const handleSave = async () => {
    const parsed = parseFloat(incomeInput);
    if (isNaN(parsed) || parsed < 0) return;
    setIsSaving(true);
    try {
      await setMyIncome(parsed);
      setSaveConfirm(true);
      setTimeout(() => setSaveConfirm(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const formattedSetAt = incomeSetAt
    ? format(incomeSetAt, "d MMMM yyyy")
    : null;

  const partnerDisplayName = partnerMember?.display_name ?? partnerName;

  // Combined income display logic
  const hasMyIncome = myIncome != null && myIncome > 0;
  const hasPartnerIncome = partnerIncome != null && partnerIncome > 0;
  const hasCombined = hasMyIncome || hasPartnerIncome;

  const formatIncome = (amount: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);

  const inputHasValue = incomeInput.trim().length > 0 && !isNaN(parseFloat(incomeInput));

  return (
    <div className="space-y-3">
      <SectionHeading>Your income</SectionHeading>

      <Card>
        <CardContent className="p-5 space-y-5">
          {/* Section description */}
          <div>
            <p className="text-sm font-medium mb-1">Monthly take-home pay</p>
            <p className="text-xs text-muted-foreground leading-5">
              Only you can see your individual amount. Your combined household
              income is used across the app.
            </p>
          </div>

          {/* Income input */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Your monthly take-home pay
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none pointer-events-none">
                {symbol}
              </span>
              <Input
                type="number"
                min="0"
                step="1"
                value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value)}
                placeholder="e.g. 2500"
                className="pl-7 text-base h-11"
              />
            </div>
            {formattedSetAt && (
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Last updated {formattedSetAt}
              </p>
            )}
          </div>

          {/* Save button + inline confirm */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={isSaving || !inputHasValue}
              size="sm"
              className="gap-1.5"
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
            <SavedConfirmation visible={saveConfirm} />
          </div>

          {/* Divider between income input and share toggle */}
          <div className="border-t border-border/60" />

          {/* Share with partner toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                Share my income with {partnerDisplayName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-4">
                {partnerDisplayName} will be able to see your individual amount
                in their Settings. You can turn this off at any time.
              </p>
            </div>
            <Switch
              checked={myIncomeVisibleToPartner}
              onCheckedChange={setIncomeVisibility}
              className="flex-shrink-0"
            />
          </div>

          {/* Partner sharing status */}
          <AnimatePresence>
            {myIncomeVisibleToPartner && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease }}
                className="rounded-[10px] bg-muted/50 px-3.5 py-3"
              >
                {partnerIncomeVisible && partnerIncome != null ? (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {partnerDisplayName} has also shared their income with you
                    </p>
                    <p className="text-sm font-medium">
                      {partnerDisplayName}&rsquo;s income:{" "}
                      {formatIncome(partnerIncome)}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {partnerDisplayName} hasn&rsquo;t shared their income yet
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Combined income — always shown */}
          <div className="border-t border-border/60 pt-4">
            <p className="text-xs text-muted-foreground mb-2">
              Combined household income
            </p>
            {hasCombined ? (
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-semibold tabular-nums">
                  {formatIncome(combinedIncome)}
                </p>
                {hasMyIncome && !hasPartnerIncome && (
                  <p className="text-xs text-muted-foreground">
                    {partnerIncomeVisible
                      ? `${partnerDisplayName} hasn't shared their income yet`
                      : `Add ${partnerDisplayName}'s income to see your combined total`}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter your income above to see your combined total
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Section 2: Privacy & display ──────────────────────────────────────────────

function PrivacySection() {
  const { scrambleMode, toggleScrambleMode } = useApp();

  // Hide balances — device-only, localStorage
  const [hideBalances, setHideBalances] = useState(
    () => localStorage.getItem("roost-hide-balances") === "true"
  );

  const handleHideBalances = (v: boolean) => {
    setHideBalances(v);
    localStorage.setItem("roost-hide-balances", String(v));
  };

  return (
    <div className="space-y-3">
      <SectionHeading>Privacy &amp; display</SectionHeading>

      <Card>
        <CardContent className="p-5 divide-y divide-border/60">
          {/* Scramble mode — prominent row */}
          <div
            className={`flex items-center justify-between gap-4 py-4 first:pt-0 rounded-[10px] transition-colors ${
              scrambleMode
                ? "bg-warning/8 -mx-2 px-2"
                : ""
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Scramble mode</p>
                  {scrambleMode && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-warning bg-warning/20 px-1.5 py-0.5 rounded-full">
                      ON
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-4">
                  Replace all amounts with ••• when showing Roost to someone.
                  Syncs to both your devices instantly.
                </p>
              </div>
            </div>
            <Switch
              checked={scrambleMode}
              onCheckedChange={() => toggleScrambleMode()}
              className={`flex-shrink-0 ${scrambleMode ? "data-[state=checked]:bg-warning" : ""}`}
            />
          </div>

          {/* Hide balances on Money home */}
          <div className="flex items-center justify-between gap-4 py-4 last:pb-0">
            <div className="min-w-0">
              <p className="text-sm font-medium">Hide balances on Money home</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-4">
                Tap the ring to reveal amounts. Useful if you open Roost
                around others regularly.
              </p>
            </div>
            <Switch
              checked={hideBalances}
              onCheckedChange={handleHideBalances}
              className="flex-shrink-0"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Section 3: Budget preferences ────────────────────────────────────────────

const THRESHOLD_OPTIONS = [50, 60, 70, 80, 90] as const;
type Threshold = typeof THRESHOLD_OPTIONS[number];

function BudgetPreferencesSection() {
  const { currentMember, partnerMember, partnerName, overspendAlertThreshold } = useApp();
  const {
    defaultSplit,
    budgetCarryForward,
    updateHomeSetting,
  } = useMoneySettings();

  // ── Default split slider ─────────────────────────────────────────────────
  const [splitValue, setSplitValue] = useState(defaultSplit);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from DB
  useEffect(() => {
    setSplitValue(defaultSplit);
  }, [defaultSplit]);

  const handleSplitChange = (v: number) => {
    setSplitValue(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateHomeSetting("default_expense_split", v);
    }, 500);
  };

  const myName = currentMember?.display_name ?? "You";
  const theirName = partnerMember?.display_name ?? partnerName;
  const myPct = Math.round(splitValue);
  const theirPct = 100 - myPct;
  const isEqual = myPct === 50;

  // ── Carry-forward segmented control ─────────────────────────────────────
  const handleCarryForwardChange = (v: "auto" | "manual") => {
    updateHomeSetting("budget_carry_forward", v);
  };

  // ── Overspend threshold pill selector ───────────────────────────────────
  const handleThresholdChange = (t: Threshold) => {
    updateHomeSetting("overspend_alert_threshold", t);
  };

  return (
    <div className="space-y-3">
      <SectionHeading>Budget preferences</SectionHeading>

      <Card>
        <CardContent className="p-5 space-y-6">
          {/* Default expense split */}
          <div>
            <p className="text-sm font-medium mb-0.5">Default expense split</p>
            <p className="text-xs text-muted-foreground mb-4 leading-4">
              When you log a shared expense, this is the default split between you.
            </p>

            {/* Avatar pair + percentage display */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex flex-col items-center gap-1 min-w-[52px]">
                <MemberAvatar
                  displayName={myName}
                  avatarColor={currentMember?.avatar_color ?? "#7F77DD"}
                  avatarIcon={currentMember?.avatar_icon ?? undefined}
                  size="sm"
                />
                <span className="text-xs font-semibold tabular-nums">{myPct}%</span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[52px] text-center">{myName}</span>
              </div>

              <div className="flex-1 text-center">
                {isEqual ? (
                  <span className="text-xs text-muted-foreground">Equal split</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {myName} pays {myPct}%, {theirName} pays {theirPct}%
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center gap-1 min-w-[52px]">
                <MemberAvatar
                  displayName={theirName}
                  avatarColor={partnerMember?.avatar_color ?? "#9db19f"}
                  avatarIcon={partnerMember?.avatar_icon ?? undefined}
                  size="sm"
                />
                <span className="text-xs font-semibold tabular-nums">{theirPct}%</span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[52px] text-center">{theirName}</span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={splitValue}
              onChange={(e) => handleSplitChange(Number(e.target.value))}
              className="w-full accent-primary h-1.5 rounded-full cursor-pointer"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">0%</span>
              <span className="text-[10px] text-muted-foreground">100%</span>
            </div>
          </div>

          <div className="border-t border-border/60" />

          {/* Budget carry-forward */}
          <div>
            <p className="text-sm font-medium mb-0.5">Budget carry-forward</p>
            <p className="text-xs text-muted-foreground mb-3 leading-4">
              When a new month starts, your budget automatically carries forward
              from last month.
            </p>

            <div className="flex rounded-[10px] overflow-hidden border border-border/60">
              {(["auto", "manual"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleCarryForwardChange(option)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    budgetCarryForward === option
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {option === "auto" ? "Automatic" : "Manual"}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {budgetCarryForward === "manual" && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease }}
                  className="text-xs text-muted-foreground mt-2 leading-4"
                >
                  You&rsquo;ll need to set up your budget each month manually.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-border/60" />

          {/* Overspend alert threshold */}
          <div>
            <p className="text-sm font-medium mb-0.5">Spending alerts</p>
            <p className="text-xs text-muted-foreground mb-3 leading-4">
              Get alerted when a lifestyle budget reaches this percentage of its budget.
            </p>

            <div className="flex gap-2 flex-wrap">
              {THRESHOLD_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleThresholdChange(t)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    overspendAlertThreshold === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {t}%
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Section 4: Currency ───────────────────────────────────────────────────────

function CurrencySection() {
  const { home, updateCurrencySymbol } = useHome();
  const currencyCode = home?.currency_symbol ?? "GBP";

  return (
    <div className="space-y-3">
      <SectionHeading>Currency</SectionHeading>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Currency</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-4">
                Used across the Money section and expenses
              </p>
            </div>
            <Select value={currencyCode} onValueChange={updateCurrencySymbol}>
              <SelectTrigger className="w-[120px] text-sm" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function MoneySettings() {
  return (
    <div className="max-w-2xl space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease }}
      >
        <IncomeSection />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05, ease }}
      >
        <PrivacySection />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1, ease }}
      >
        <BudgetPreferencesSection />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15, ease }}
      >
        <CurrencySection />
      </motion.div>
    </div>
  );
}
