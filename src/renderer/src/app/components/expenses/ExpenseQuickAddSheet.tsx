/**
 * ExpenseQuickAddSheet — a two-state bottom sheet for fast expense entry.
 *
 * State 1 (amount entry): custom number pad visible, amount display at top.
 * State 2 (full details): number pad hidden, full form with who paid & split.
 *
 * Hazel silently suggests a category when description is typed (500ms debounce).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Check, ChevronRight, Delete, X } from "lucide-react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { MemberAvatar } from "@/components/MemberAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/context/AppContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useSubscriptionUi } from "@/context/SubscriptionUiContext";
import { categorizeExpenseWithGate } from "@/lib/normalizeInput";
import { getCategoryColor } from "@/pages/money/MoneyShared";
import type { Category } from "@/lib/categories";

// ── Constants ─────────────────────────────────────────────────────────────────

const ease = [0.16, 1, 0.3, 1] as const;

type SplitType = "equal" | "custom" | "solo";

// ── Shared helpers ────────────────────────────────────────────────────────────

function formatAmount(raw: string): string {
  if (!raw || raw === "0") return "0";
  // Insert decimal point if present
  return raw;
}

function parseAmountStr(raw: string): number {
  return parseFloat(raw) || 0;
}

// ── Number pad ────────────────────────────────────────────────────────────────

const PAD_KEYS = [
  "1", "2", "3",
  "4", "5", "6",
  "7", "8", "9",
  ".", "0", "⌫",
] as const;

type PadKey = typeof PAD_KEYS[number];

function NumPad({
  onKey,
}: {
  onKey: (key: PadKey) => void;
}) {
  return (
    <motion.div
      key="numpad"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.22, ease }}
      className="grid grid-cols-3 gap-2"
    >
      {PAD_KEYS.map((key) => (
        <motion.button
          key={key}
          type="button"
          whileTap={{ scale: 0.93 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onClick={() => onKey(key)}
          className="h-14 rounded-[14px] bg-card border border-border/60 flex items-center justify-center text-lg font-medium text-foreground hover:bg-muted/60 active:bg-muted transition-colors select-none"
          aria-label={key === "⌫" ? "Backspace" : key}
        >
          {key === "⌫" ? (
            <Delete className="w-5 h-5 text-muted-foreground" />
          ) : (
            key
          )}
        </motion.button>
      ))}
    </motion.div>
  );
}

// ── Category pill ─────────────────────────────────────────────────────────────

function CategoryPill({
  category,
  isSelected,
  isSuggested,
  onClick,
}: {
  category: Category;
  isSelected: boolean;
  isSuggested: boolean;
  onClick: () => void;
}) {
  const color = getCategoryColor(category.name);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
        isSelected
          ? "text-white"
          : isSuggested
          ? "border-2 border-dashed bg-transparent text-foreground"
          : "border border-border/60 bg-card/80 text-muted-foreground hover:text-foreground hover:border-border"
      }`}
      style={
        isSelected
          ? { backgroundColor: color, borderColor: "transparent" }
          : isSuggested
          ? { borderColor: color, color: color }
          : {}
      }
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {category.name}
    </button>
  );
}

// ── Payer button ──────────────────────────────────────────────────────────────

function PayerButton({
  displayName,
  avatarColor,
  avatarIcon,
  isSelected,
  onClick,
}: {
  displayName: string;
  avatarColor?: string | null;
  avatarIcon?: string | null;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-[18px] border-2 transition-all ${
        isSelected
          ? "border-primary bg-primary/8"
          : "border-border/60 bg-card/80 hover:border-border"
      }`}
    >
      <MemberAvatar
        displayName={displayName}
        avatarColor={avatarColor}
        avatarIcon={avatarIcon}
        size="md"
      />
      <span className="text-sm font-medium">{displayName}</span>
    </button>
  );
}

// ── Split selector ────────────────────────────────────────────────────────────

function SplitSelector({
  split,
  setSplit,
  amount,
  isNest,
}: {
  split: SplitType;
  setSplit: (s: SplitType) => void;
  amount: number;
  isNest: boolean;
}) {
  const { openUpgrade } = useSubscriptionUi();
  const half = amount / 2;

  const handleCustom = () => {
    if (!isNest) {
      openUpgrade();
      return;
    }
    setSplit("custom");
  };

  const options: { value: SplitType; label: string }[] = [
    { value: "equal", label: "Equal" },
    { value: "custom", label: "Custom" },
    { value: "solo", label: "Solo" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex rounded-[14px] border border-border/60 overflow-hidden">
        {options.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              if (value === "custom") handleCustom();
              else setSplit(value);
            }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              split === value
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {split === "equal" && amount > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Each owes £{(half).toFixed(2)}
        </p>
      )}
      {split === "solo" && (
        <p className="text-xs text-muted-foreground text-center">
          Personal expense — no split
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface ExpenseQuickAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultCategory?: string;
}

export function ExpenseQuickAddSheet({
  isOpen,
  onClose,
  onSuccess,
  defaultCategory,
}: ExpenseQuickAddSheetProps) {
  const {
    currentUser,
    partnerName,
    currentMember,
    partnerMember,
    categories,
    hasCategories,
    addExpense,
    isAddingExpense,
    defaultExpenseSplit,
  } = useApp();
  const navigate = useNavigate();

  const { isNest } = useSubscription();

  // Resolve the initial split type from the household's default split preference.
  // "equal" = 50/50. Any other value stays as "equal" for now since the custom
  // split UI requires Pro and manual entry — the preference surfaces in MoneySettings.
  const defaultSplitType: SplitType =
    Math.round(defaultExpenseSplit) === 50 ? "equal" : "equal";

  // ── Form state ────────────────────────────────────────────────────────────
  const [amountStr, setAmountStr] = useState("0");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    defaultCategory ?? ""
  );
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [payer, setPayer] = useState<string>(currentUser);
  const [split, setSplit] = useState<SplitType>(defaultSplitType);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [showFullForm, setShowFullForm] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hazelDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const descInputRef = useRef<HTMLInputElement>(null);

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setAmountStr("0");
      setDescription("");
      setSelectedCategory(defaultCategory ?? "");
      setSuggestedCategory(null);
      setPayer(currentUser);
      setSplit(defaultSplitType);
      setShowFullForm(false);
      setSubmitSuccess(false);
      setError(null);
    }
  }, [isOpen, defaultCategory, currentUser, defaultSplitType]);

  // Sync payer default when currentUser changes
  useEffect(() => {
    setPayer(currentUser);
  }, [currentUser]);

  // ── Number pad handler ────────────────────────────────────────────────────
  const handlePadKey = useCallback((key: PadKey) => {
    setAmountStr((prev) => {
      if (key === "⌫") {
        if (prev.length <= 1) return "0";
        return prev.slice(0, -1) || "0";
      }
      if (key === ".") {
        if (prev.includes(".")) return prev;
        return prev + ".";
      }
      // Max 2 decimal places
      const dotIdx = prev.indexOf(".");
      if (dotIdx !== -1 && prev.length - dotIdx > 2) return prev;
      if (prev === "0") return key;
      return prev + key;
    });
  }, []);

  // ── Hazel suggestion ──────────────────────────────────────────────────────
  const handleDescriptionChange = (value: string) => {
    setDescription(value);

    if (hazelDebounce.current) clearTimeout(hazelDebounce.current);
    hazelDebounce.current = setTimeout(async () => {
      if (!value.trim()) {
        setSuggestedCategory(null);
        return;
      }
      const categoryNames = categories.map((c) => c.name);
      const result = await categorizeExpenseWithGate(value, categoryNames, isNest).catch(
        () => null
      );
      if (result?.category) {
        const cat = categories.find((c) => c.name === result.category);
        if (cat) {
          if (isNest) {
            // Auto-select on Pro
            setSelectedCategory(result.category);
          } else {
            // Highlight suggestion on free
            setSuggestedCategory(result.category);
          }
        }
      }
    }, 500);
  };

  // ── Transition to full form ───────────────────────────────────────────────
  const toFullForm = () => {
    setShowFullForm(true);
    setTimeout(() => descInputRef.current?.focus(), 300);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    const amount = parseAmountStr(amountStr);
    if (amount <= 0) {
      setError("Enter an amount greater than £0");
      return;
    }
    if (!description.trim()) {
      setError("Add a description");
      return;
    }
    setError(null);

    addExpense({
      title: description.trim(),
      amount,
      category: selectedCategory || null,
      payer,
      date: new Date(),
      type: "one-off",
      splitType: split === "solo" ? "personal" : "shared",
    });

    // Brief success flash then close
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      onClose();
      onSuccess?.();
    }, 700);
  };

  const amount = parseAmountStr(amountStr);
  const canSubmit = amount > 0 && description.trim().length > 0 && !isAddingExpense;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.28, ease }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[24px] bg-card border-t border-border/60 shadow-2xl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
            </div>

            {/* Close button */}
            <div className="absolute top-3 right-4">
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="px-5 pt-2 pb-6 space-y-4">
              {/* Amount display */}
              <div
                className="flex items-baseline justify-center gap-1 py-2 cursor-text"
                onClick={() => !showFullForm && void 0}
              >
                <span className="text-3xl font-medium text-muted-foreground/60">£</span>
                <span className="text-5xl font-medium tracking-tight tabular-nums">
                  {amountStr === "0" ? (
                    <span className="text-muted-foreground/40">0</span>
                  ) : (
                    amountStr
                  )}
                </span>
                {!showFullForm && (
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-3xl font-medium text-primary ml-0.5"
                  >
                    |
                  </motion.span>
                )}
              </div>

              {/* Description */}
              <div>
                <Input
                  ref={descInputRef}
                  placeholder="What was this for?"
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  onFocus={() => {
                    if (!showFullForm) toFullForm();
                  }}
                  className="text-base border-0 border-b border-border/50 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50"
                />
              </div>

              {/* Category pills — or prompt to set up budget */}
              {!hasCategories ? (
                <button
                  type="button"
                  onClick={() => { onClose(); navigate("/money/budgets"); }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-[14px] bg-muted/40 border border-dashed border-border/60 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <span className="flex-1">Set up your budget first to categorise expenses</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-0.5 px-0.5">
                  {categories.map((cat) => (
                    <CategoryPill
                      key={cat.name}
                      category={cat}
                      isSelected={selectedCategory === cat.name}
                      isSuggested={
                        !selectedCategory && suggestedCategory === cat.name
                      }
                      onClick={() => {
                        setSelectedCategory(
                          selectedCategory === cat.name ? "" : cat.name
                        );
                        setSuggestedCategory(null);
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Animated sections */}
              <AnimatePresence mode="wait">
                {!showFullForm ? (
                  /* ── State 1: Number pad ── */
                  <NumPad key="pad" onKey={handlePadKey} />
                ) : (
                  /* ── State 2: Full form ── */
                  <motion.div
                    key="fullform"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.22, ease }}
                    className="space-y-4"
                  >
                    {/* Who paid */}
                    {currentMember && partnerMember && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                          Who paid?
                        </p>
                        <div className="flex gap-3">
                          <PayerButton
                            displayName={currentUser}
                            avatarColor={currentMember.avatar_color}
                            avatarIcon={currentMember.avatar_icon}
                            isSelected={payer === currentUser}
                            onClick={() => setPayer(currentUser)}
                          />
                          <PayerButton
                            displayName={partnerName}
                            avatarColor={partnerMember.avatar_color}
                            avatarIcon={partnerMember.avatar_icon}
                            isSelected={payer === partnerName}
                            onClick={() => setPayer(partnerName)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Split selector */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                        Split
                      </p>
                      <SplitSelector
                        split={split}
                        setSplit={setSplit}
                        amount={amount}
                        isNest={isNest}
                      />
                    </div>

                    {/* Tap to show numpad again */}
                    <button
                      type="button"
                      onClick={() => setShowFullForm(false)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Edit amount
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-destructive text-center"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit && !submitSuccess}
                whileHover={canSubmit ? { scale: 1.01 } : {}}
                whileTap={canSubmit ? { scale: 0.98 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={`w-full h-13 rounded-[16px] font-medium text-base transition-all flex items-center justify-center gap-2 ${
                  submitSuccess
                    ? "bg-success text-white"
                    : canSubmit
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                <AnimatePresence mode="wait">
                  {submitSuccess ? (
                    <motion.span
                      key="success"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Added!
                    </motion.span>
                  ) : (
                    <motion.span key="label">
                      {isAddingExpense
                        ? "Adding…"
                        : showFullForm
                        ? "Add expense →"
                        : "Add expense"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
