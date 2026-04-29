import { useMemo, useState, useRef } from "react";
import {
  addDays,
  differenceInCalendarMonths,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Edit2,
  PiggyBank,
  Plus,
  Receipt,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { AnimatedPage } from "@/components/AnimatedPage";
import { MemberAvatar } from "@/components/MemberAvatar";
import { Skeleton } from "@/components/LoadingSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/DatePicker";
import { useApp } from "@/context/AppContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useSubscriptionUi } from "@/context/SubscriptionUiContext";
import { useCurrencyFormat } from "@/hooks/useHome";
import type { RecurringBill, SavingsGoal, CreateRecurringBill, UpdateRecurringBill, CreateSavingsGoal, ProRequiredError } from "@/lib/schemas/money";
import { MoneyBackLink, ease } from "./MoneyShared";

// ── Colour helpers ────────────────────────────────────────────────────────────

const GOAL_COLOURS = [
  { label: "Terracotta", value: "#d4795e" },
  { label: "Sage",       value: "#9db19f" },
  { label: "Amber",      value: "#e6a563" },
  { label: "Blue",       value: "#6ca3c8" },
  { label: "Pink",       value: "#c97a9b" },
  { label: "Green",      value: "#7fa087" },
];

const BILL_COLOUR_DEFAULT = "#b0a89a";

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function billDateLabel(daysUntil: number, date: Date): string {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  return format(date, "d MMM");
}

// ── Bottom sheet wrapper ──────────────────────────────────────────────────────

function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
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
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[24px] bg-card border-t border-border/60 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 flex items-center justify-between p-5 pb-4 bg-card border-b border-border/40 z-10">
              <h2 className="text-base font-medium">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Bill Editor Sheet ─────────────────────────────────────────────────────────

function BillEditorSheet({
  open,
  onClose,
  initialBill,
}: {
  open: boolean;
  onClose: () => void;
  initialBill?: RecurringBill;
}) {
  const { addBill, updateBill } = useApp();
  const isEdit = !!initialBill;

  const [name, setName] = useState(initialBill?.name ?? "");
  const [amount, setAmount] = useState(
    initialBill ? String(initialBill.amount) : ""
  );
  const [day, setDay] = useState(initialBill?.day_of_month ?? 1);
  const [category, setCategory] = useState(initialBill?.category ?? "");

  // Reset when reopened
  const prevOpen = useRef(false);
  if (open && !prevOpen.current) {
    prevOpen.current = true;
  } else if (!open && prevOpen.current) {
    prevOpen.current = false;
    // Reset form on close
  }

  const amountNum = parseFloat(amount);
  const valid =
    name.trim().length > 0 &&
    !isNaN(amountNum) &&
    amountNum > 0 &&
    day >= 1 &&
    day <= 31;

  const isPending = addBill.isPending || updateBill.isPending;

  const handleSave = () => {
    if (!valid) return;
    const payload = {
      name: name.trim(),
      amount: amountNum,
      day_of_month: day,
      category: category || null,
    };
    if (isEdit && initialBill) {
      updateBill.mutate(
        { id: initialBill.id, data: payload as UpdateRecurringBill },
        { onSuccess: onClose }
      );
    } else {
      addBill.mutate(payload as CreateRecurringBill, {
        onSuccess: onClose,
        onError: (err) => {
          if (
            err &&
            typeof err === "object" &&
            "code" in err &&
            (err as ProRequiredError).code === "PRO_REQUIRED"
          ) {
            onClose();
          }
        },
      });
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit bill" : "Add a bill"}
    >
      <div className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="bill-name">Bill name</Label>
          <Input
            id="bill-name"
            placeholder="e.g. Netflix, Rent, Electricity"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <Label htmlFor="bill-amount">Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none pointer-events-none">
              £
            </span>
            <Input
              id="bill-amount"
              className="pl-7"
              placeholder="0.00"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Day of month */}
        <div className="space-y-2">
          <Label>Day of month</Label>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-0.5 px-0.5">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDay(d)}
                className={`flex-shrink-0 w-9 h-9 rounded-[10px] text-sm font-medium transition-colors ${
                  day === d
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Goes out on the {ordinalSuffix(day)} of each month
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!valid || isPending}
            className="flex-1"
          >
            {isPending ? "Saving…" : isEdit ? "Save changes" : "Add bill"}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}

// ── Add Goal Sheet ─────────────────────────────────────────────────────────────

function AddGoalSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addGoal } = useApp();
  const { openUpgrade } = useSubscriptionUi();

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [colour, setColour] = useState(GOAL_COLOURS[0].value);

  const amountNum = parseFloat(targetAmount);
  const valid = name.trim().length > 0 && !isNaN(amountNum) && amountNum > 0;

  const handleSave = () => {
    if (!valid) return;
    const payload: CreateSavingsGoal = {
      name: name.trim(),
      target_amount: amountNum,
      target_date: targetDate
        ? format(targetDate, "yyyy-MM-dd")
        : null,
      colour,
    };
    addGoal.mutate(payload, {
      onSuccess: () => {
        setName("");
        setTargetAmount("");
        setTargetDate(undefined);
        setColour(GOAL_COLOURS[0].value);
        onClose();
      },
      onError: (err) => {
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          (err as ProRequiredError).code === "PRO_REQUIRED"
        ) {
          onClose();
          openUpgrade();
        }
      },
    });
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Add a goal">
      <div className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="goal-name">Goal name</Label>
          <Input
            id="goal-name"
            placeholder="e.g. Holiday fund, New sofa, Emergency savings"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Target amount */}
        <div className="space-y-1.5">
          <Label htmlFor="goal-amount">Target amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none pointer-events-none">
              £
            </span>
            <Input
              id="goal-amount"
              className="pl-7"
              placeholder="0.00"
              type="number"
              min="0.01"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Target date */}
        <div className="space-y-1.5">
          <Label>Target date (optional)</Label>
          <DatePicker
            value={targetDate}
            onChange={setTargetDate}
            placeholder="No target date"
          />
        </div>

        {/* Colour */}
        <div className="space-y-2">
          <Label>Colour</Label>
          <div className="flex gap-2.5">
            {GOAL_COLOURS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColour(c.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  colour === c.value
                    ? "border-foreground scale-110"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: c.value }}
                aria-label={c.label}
              />
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!valid || addGoal.isPending}
            className="flex-1"
          >
            {addGoal.isPending ? "Saving…" : "Add goal"}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}

// ── Goal Detail Sheet ─────────────────────────────────────────────────────────

function GoalDetailSheet({
  goal,
  onClose,
  summary,
  goalsCount,
}: {
  goal: SavingsGoal | null;
  onClose: () => void;
  summary: ReturnType<typeof useApp>["summary"];
  goalsCount: number;
}) {
  const { updateGoal, deleteGoal, completeGoal, addToGoal } = useApp();
  const fmt = useCurrencyFormat();
  const [addAmount, setAddAmount] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [showAddSavings, setShowAddSavings] = useState(false);

  if (!goal) return null;

  const open = !!goal;
  const progressPct =
    goal.target_amount > 0
      ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
      : 0;
  const ringColor = goal.colour ?? "#d4795e";
  const circumference = 2 * Math.PI * 44;
  const ringOffset = circumference * (1 - progressPct / 100);

  const monthsUntil = goal.target_date
    ? differenceInCalendarMonths(
        parseISO(goal.target_date),
        startOfMonth(new Date())
      )
    : null;
  const remaining = goal.target_amount - goal.current_amount;
  const monthlyNeeded =
    monthsUntil && monthsUntil > 0 ? remaining / monthsUntil : null;

  const getStatus = (): "on-track" | "behind" | null => {
    if (!goal.target_date || !summary) return null;
    if (remaining <= 0) return "on-track";
    if (!monthsUntil || monthsUntil <= 0) return "behind";
    const monthlyAvailable = summary.surplus / Math.max(1, goalsCount);
    return monthlyAvailable >= (monthlyNeeded ?? Infinity) ? "on-track" : "behind";
  };

  const status = getStatus();

  const handleAddSavings = () => {
    const amt = parseFloat(addAmount);
    if (isNaN(amt) || amt <= 0) return;
    addToGoal.mutate({ id: goal.id, amount: amt });
    setAddAmount("");
    setShowAddSavings(false);
  };

  const handleComplete = () => {
    completeGoal.mutate({ id: goal.id }, { onSuccess: onClose });
  };

  const handleDelete = () => {
    deleteGoal.mutate({ id: goal.id }, { onSuccess: onClose });
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={goal.name}>
      <div className="space-y-6">
        {/* Ring + amounts */}
        <div className="flex items-center gap-5">
          {/* SVG ring 96×96 */}
          <div className="relative flex-shrink-0" style={{ width: 96, height: 96 }}>
            <svg
              viewBox="0 0 100 100"
              width={96}
              height={96}
              style={{ transform: "rotate(-90deg)" }}
            >
              <circle
                cx={50}
                cy={50}
                r={44}
                fill="none"
                stroke="rgba(61,50,41,0.1)"
                strokeWidth={10}
              />
              <motion.circle
                cx={50}
                cy={50}
                r={44}
                fill="none"
                stroke={ringColor}
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: ringOffset }}
                transition={{ duration: 0.6, ease }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-medium">{Math.round(progressPct)}%</span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-1">
            <p className="text-xl font-medium">{goal.name}</p>
            <p className="text-sm text-muted-foreground">
              {fmt(goal.current_amount)} saved of{" "}
              {fmt(goal.target_amount)}
            </p>
            {goal.target_date && (
              <p className="text-sm text-muted-foreground">
                by {format(parseISO(goal.target_date), "MMMM yyyy")}
              </p>
            )}
            {status && (
              <span
                className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${
                  status === "on-track"
                    ? "bg-success/15 text-success"
                    : "bg-warning/15 text-warning"
                }`}
              >
                {status === "on-track" ? "On track" : "Behind"}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 rounded-full bg-muted/55 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: ringColor }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease }}
          />
        </div>

        {/* Monthly needed */}
        {monthlyNeeded && monthlyNeeded > 0 && (
          <p className="text-sm text-muted-foreground">
            {fmt(monthlyNeeded)}/month needed to reach your goal
          </p>
        )}

        {/* Add savings */}
        <div className="space-y-3">
          <AnimatePresence>
            {showAddSavings ? (
              <motion.div
                key="add-input"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      £
                    </span>
                    <Input
                      className="pl-7"
                      placeholder="0.00"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <Button onClick={handleAddSavings} disabled={addToGoal.isPending}>
                    Add
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddSavings(false)}>
                    Cancel
                  </Button>
                </div>
              </motion.div>
            ) : (
              <Button
                key="add-btn"
                className="w-full"
                onClick={() => setShowAddSavings(true)}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add savings
              </Button>
            )}
          </AnimatePresence>

          {/* Mark complete */}
          {!goal.is_complete && (
            <Button
              variant="outline"
              className="w-full gap-2 text-success border-success/30 hover:bg-success/10"
              onClick={handleComplete}
              disabled={completeGoal.isPending}
            >
              <Check className="w-4 h-4" />
              Mark as complete
            </Button>
          )}
        </div>

        {/* Delete */}
        <div className="border-t border-border/40 pt-4">
          <AnimatePresence>
            {showDelete ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <p className="text-sm text-muted-foreground text-center">
                  Remove this goal? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowDelete(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleDelete}
                    disabled={deleteGoal.isPending}
                  >
                    Remove goal
                  </Button>
                </div>
              </motion.div>
            ) : (
              <button
                key="delete-btn"
                type="button"
                onClick={() => setShowDelete(true)}
                className="w-full text-sm text-destructive/70 hover:text-destructive transition-colors py-1"
              >
                Remove goal
              </button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </BottomSheet>
  );
}

// ── Section 1 — Bill calendar strip ──────────────────────────────────────────

function BillCalendarStrip({
  getBillsForDateRange,
  bills,
  isLoading,
  onAdd,
}: {
  getBillsForDateRange: ReturnType<typeof useApp>["getBillsForDateRange"];
  bills: ReturnType<typeof useApp>["bills"];
  isLoading: boolean;
  onAdd: () => void;
}) {
  const fmt = useCurrencyFormat();
  const upcoming = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = addDays(start, 30);
    return getBillsForDateRange(start, end);
  }, [getBillsForDateRange]);

  if (isLoading) {
    return (
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-0.5 px-0.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-shrink-0 rounded-[20px] bg-card/90 border border-border/60 p-3.5 min-w-[110px] space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex-shrink-0 rounded-[20px] border border-border/60 bg-card/70 p-4 min-w-[200px] flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Nothing due in the next 30 days. Add a bill to get started.</span>
          <button
            type="button"
            onClick={onAdd}
            className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors flex-shrink-0"
            aria-label="Add bill"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (upcoming.length === 0) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex-shrink-0 rounded-[20px] border border-border/60 bg-card/70 px-4 py-3">
          <span className="text-sm text-muted-foreground">Nothing due in the next 30 days.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-0.5 px-0.5">
      {upcoming.map((occ, i) => {
        const isFirst = i === 0;
        const isUrgent = occ.days_until <= 3;
        return (
          <motion.div
            key={`${occ.bill.id}-${occ.next_date.toISOString()}`}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, ease, delay: i * 0.03 }}
            className={`flex-shrink-0 rounded-[20px] border p-3.5 min-w-[110px] max-w-[130px] cursor-default relative ${
              isFirst
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-card/90 border-border/60"
            }`}
          >
            {/* Urgency dot */}
            {isUrgent && !isFirst && (
              <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-warning" />
            )}

            <p
              className={`text-[11px] font-medium mb-1.5 ${
                isFirst ? "text-primary-foreground/75" : "text-muted-foreground"
              }`}
            >
              {billDateLabel(occ.days_until, occ.next_date)}
            </p>
            <p
              className={`text-sm font-medium leading-tight truncate ${
                isFirst ? "text-primary-foreground" : "text-foreground"
              }`}
            >
              {occ.bill.name}
            </p>
            <p
              className={`text-sm font-medium mt-1 tabular-nums ${
                isFirst ? "text-primary-foreground" : "text-foreground"
              }`}
            >
              {fmt(occ.bill.amount)}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Section 2 — Committed costs summary ──────────────────────────────────────

function CommittedCostsSummary({
  bills,
  summary,
}: {
  bills: ReturnType<typeof useApp>["bills"];
  summary: ReturnType<typeof useApp>["summary"];
}) {
  const fmt = useCurrencyFormat();
  const totalPerMonth = bills.reduce((sum, b) => sum + b.amount, 0);

  return (
    <Card className="border-0 shadow-none bg-card/90">
      <CardContent className="p-5">
        <p className="text-lg font-medium tabular-nums">
          {bills.length} {bills.length === 1 ? "bill" : "bills"} ·{" "}
          {fmt(totalPerMonth)}/month
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Goes out regardless of what you spend
        </p>
        {summary && summary.income > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            {Math.round((totalPerMonth / summary.income) * 100)}% of your income
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Bill row ──────────────────────────────────────────────────────────────────

function BillRow({
  bill,
  onEdit,
  onRemove,
}: {
  bill: RecurringBill;
  onEdit: (bill: RecurringBill) => void;
  onRemove: (bill: RecurringBill) => void;
}) {
  const fmt = useCurrencyFormat();
  const [showConfirm, setShowConfirm] = useState(false);
  const dotColor = bill.colour ?? BILL_COLOUR_DEFAULT;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease }}
    >
      <AnimatePresence mode="wait">
        {showConfirm ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-[16px] bg-destructive/8 border border-destructive/20 p-3.5 flex items-center justify-between gap-3"
          >
            <p className="text-sm text-destructive">Remove "{bill.name}"?</p>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="h-7 px-3 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onRemove(bill)}
                className="h-7 px-3 text-xs"
              >
                Remove
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="group flex items-center gap-3 py-3 px-1"
          >
            {/* Colour dot */}
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: dotColor }}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{bill.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every month on the {ordinalSuffix(bill.day_of_month)}
              </p>
            </div>

            {/* Amount */}
            <span className="text-sm font-medium tabular-nums flex-shrink-0">
              {fmt(bill.amount)}
            </span>

            {/* Actions (hover) */}
            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                type="button"
                onClick={() => onEdit(bill)}
                className="w-7 h-7 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                aria-label="Edit bill"
              >
                <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="w-7 h-7 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-colors"
                aria-label="Remove bill"
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive/70" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Section 3 — Bills list ────────────────────────────────────────────────────

const FREE_BILL_LIMIT = 5;

function BillsList({
  bills,
  isLoading,
  isNest,
  onAdd,
  onEdit,
  onRemove,
}: {
  bills: ReturnType<typeof useApp>["bills"];
  isLoading: boolean;
  isNest: boolean;
  onAdd: () => void;
  onEdit: (bill: RecurringBill) => void;
  onRemove: (bill: RecurringBill) => void;
}) {
  const fmt = useCurrencyFormat();
  const { openUpgrade } = useSubscriptionUi();

  const visibleBills = isNest ? bills : bills.slice(0, FREE_BILL_LIMIT);
  const lockedBills = isNest ? [] : bills.slice(FREE_BILL_LIMIT);
  const atLimit = !isNest && bills.length >= FREE_BILL_LIMIT;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3 px-1">
            <Skeleton className="w-2.5 h-2.5 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="py-8 text-center space-y-3">
        <Receipt className="w-10 h-10 text-muted-foreground/40 mx-auto" />
        <div>
          <p className="text-sm font-medium">No bills added yet</p>
          <p className="text-xs text-muted-foreground mt-1 leading-5">
            Add your regular bills — rent, utilities, subscriptions — to see
            them in the calendar above.
          </p>
        </div>
        <Button size="sm" onClick={onAdd} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Add a bill
        </Button>
      </div>
    );
  }

  return (
    <div>
      <AnimatePresence>
        {visibleBills.map((bill) => (
          <div key={bill.id} className="border-b border-border/30 last:border-0">
            <BillRow bill={bill} onEdit={onEdit} onRemove={onRemove} />
          </div>
        ))}

        {lockedBills.length > 0 &&
          lockedBills.map((bill) => (
            <div
              key={bill.id}
              className="flex items-center gap-3 py-3 px-1 opacity-40 pointer-events-none border-b border-border/30 last:border-0"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-muted" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{bill.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Every month on the {ordinalSuffix(bill.day_of_month)}
                </p>
              </div>
              <span className="text-sm font-medium tabular-nums">
                {fmt(bill.amount)}
              </span>
            </div>
          ))}
      </AnimatePresence>

      {!isNest && bills.length > FREE_BILL_LIMIT && (
        <button
          type="button"
          onClick={openUpgrade}
          className="mt-3 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          You've got {FREE_BILL_LIMIT} bills set up. Roost Pro lets you add as many as you need →
        </button>
      )}

      <div className="mt-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={atLimit ? openUpgrade : onAdd}
        >
          <Plus className="w-3.5 h-3.5" />
          Add a bill
        </Button>
      </div>
    </div>
  );
}

// ── Goal ring (small, inline) ─────────────────────────────────────────────────

function GoalRingSmall({ goal }: { goal: SavingsGoal }) {
  const pct =
    goal.target_amount > 0
      ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
      : 0;
  const color = goal.colour ?? "#d4795e";
  const R = 22;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - pct / 100);

  return (
    <div className="relative flex-shrink-0" style={{ width: 52, height: 52 }}>
      <svg
        viewBox="0 0 52 52"
        width={52}
        height={52}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={26}
          cy={26}
          r={R}
          fill="none"
          stroke="rgba(61,50,41,0.1)"
          strokeWidth={6}
        />
        <motion.circle
          cx={26}
          cy={26}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-medium">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

// ── Section 4 — Savings goals ─────────────────────────────────────────────────

const FREE_GOALS_LIMIT = 1;

function SavingsGoalsList({
  activeGoals,
  completedGoals,
  summary,
  isLoading,
  isNest,
  onAdd,
  onOpenGoal,
}: {
  activeGoals: SavingsGoal[];
  completedGoals: SavingsGoal[];
  summary: ReturnType<typeof useApp>["summary"];
  isLoading: boolean;
  isNest: boolean;
  onAdd: () => void;
  onOpenGoal: (goal: SavingsGoal) => void;
}) {
  const fmt = useCurrencyFormat();
  const { openUpgrade } = useSubscriptionUi();
  const [showCompleted, setShowCompleted] = useState(false);

  const visibleGoals = isNest
    ? activeGoals
    : activeGoals.slice(0, FREE_GOALS_LIMIT);
  const atLimit = !isNest && activeGoals.length >= FREE_GOALS_LIMIT;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <Skeleton className="w-[52px] h-[52px] rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (activeGoals.length === 0 && completedGoals.length === 0) {
    return (
      <div className="py-8 text-center space-y-3">
        <PiggyBank className="w-10 h-10 text-muted-foreground/40 mx-auto" />
        <div>
          <p className="text-sm font-medium">What are you saving toward together?</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add your first goal and track your progress here.
          </p>
        </div>
        <Button size="sm" onClick={onAdd} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Add a goal
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Active goals */}
      <AnimatePresence>
        {visibleGoals.map((goal, i) => {
          const monthsUntil = goal.target_date
            ? differenceInCalendarMonths(
                parseISO(goal.target_date),
                startOfMonth(new Date())
              )
            : null;
          const remaining = goal.target_amount - goal.current_amount;
          const monthlyNeeded =
            monthsUntil && monthsUntil > 0 ? remaining / monthsUntil : null;

          const getStatus = (): "on-track" | "behind" | null => {
            if (!goal.target_date || !summary) return null;
            if (remaining <= 0) return "on-track";
            if (!monthsUntil || monthsUntil <= 0) return "behind";
            const monthlyAvailable =
              summary.surplus / Math.max(1, activeGoals.length);
            return monthlyAvailable >= (monthlyNeeded ?? Infinity)
              ? "on-track"
              : "behind";
          };
          const status = getStatus();

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease, delay: i * 0.05 }}
            >
              <Card
                className="cursor-pointer hover:bg-card/80 transition-colors"
                onClick={() => onOpenGoal(goal)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <GoalRingSmall goal={goal} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{goal.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {fmt(goal.current_amount)} of{" "}
                      {fmt(goal.target_amount)}
                      {goal.target_date && (
                        <> · by {format(parseISO(goal.target_date), "MMM yyyy")}</>
                      )}
                    </p>
                    {monthlyNeeded && monthlyNeeded > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fmt(monthlyNeeded)}/month needed
                      </p>
                    )}
                  </div>

                  {status && (
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                        status === "on-track"
                          ? "bg-success/15 text-success"
                          : "bg-warning/15 text-warning"
                      }`}
                    >
                      {status === "on-track" ? "On track" : "Behind"}
                    </span>
                  )}

                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Free gate */}
      {!isNest && activeGoals.length > FREE_GOALS_LIMIT && (
        <button
          type="button"
          onClick={openUpgrade}
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 pl-1"
        >
          Add more savings goals with Roost Pro. Your data is safe — upgrade any time →
        </button>
      )}

      {/* Add goal button */}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={atLimit ? openUpgrade : onAdd}
      >
        <Plus className="w-3.5 h-3.5" />
        Add a goal
      </Button>

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <div className="border-t border-border/40 pt-3 mt-2">
          <button
            type="button"
            onClick={() => setShowCompleted((s) => !s)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <span>
              {completedGoals.length} completed{" "}
              {completedGoals.length === 1 ? "goal" : "goals"}
            </span>
            <motion.span
              animate={{ rotate: showCompleted ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.span>
          </button>

          <AnimatePresence>
            {showCompleted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease }}
                className="mt-3 space-y-2 overflow-hidden"
              >
                {completedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center gap-3 py-2 px-1 opacity-60"
                  >
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{goal.name}</p>
                      {goal.completed_at && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Completed{" "}
                          {format(parseISO(goal.completed_at), "d MMM yyyy")}
                        </p>
                      )}
                    </div>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {fmt(goal.target_amount)}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function BillsAndGoals() {
  const {
    bills,
    getBillsForDateRange,
    addBill,
    updateBill,
    deactivateBill,
    isRecurringBillsLoading,
    activeGoals,
    completedGoals,
    isSavingsGoalsLoading,
    summary,
  } = useApp();

  const { isNest } = useSubscription();

  // Sheet state
  const [billEditorOpen, setBillEditorOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | undefined>(undefined);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [detailGoal, setDetailGoal] = useState<SavingsGoal | null>(null);

  const openAddBill = () => {
    setEditingBill(undefined);
    setBillEditorOpen(true);
  };

  const openEditBill = (bill: RecurringBill) => {
    setEditingBill(bill);
    setBillEditorOpen(true);
  };

  const handleRemoveBill = (bill: RecurringBill) => {
    deactivateBill.mutate({ id: bill.id });
  };

  return (
    <AnimatedPage className="max-w-6xl mx-auto p-6 space-y-5">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <MoneyBackLink />
          <h1 className="text-3xl font-semibold">Bills & Goals</h1>
        </div>

        {/* Section 1 — Calendar strip */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Next 30 days</h2>
          <BillCalendarStrip
            getBillsForDateRange={getBillsForDateRange}
            bills={bills}
            isLoading={isRecurringBillsLoading}
            onAdd={openAddBill}
          />
        </div>

        {/* Section 2 — Committed costs */}
        {bills.length > 0 && (
          <CommittedCostsSummary bills={bills} summary={summary} />
        )}

        {/* Section 3 — Bills list */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Your bills</h2>
          <BillsList
            bills={bills}
            isLoading={isRecurringBillsLoading}
            isNest={isNest}
            onAdd={openAddBill}
            onEdit={openEditBill}
            onRemove={handleRemoveBill}
          />
        </div>

        {/* Section 4 — Savings goals */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Savings goals</h2>
          <SavingsGoalsList
            activeGoals={activeGoals}
            completedGoals={completedGoals}
            summary={summary}
            isLoading={isSavingsGoalsLoading}
            isNest={isNest}
            onAdd={() => setAddGoalOpen(true)}
            onOpenGoal={setDetailGoal}
          />
        </div>
      </div>

      {/* Sheets */}
      <BillEditorSheet
        open={billEditorOpen}
        onClose={() => setBillEditorOpen(false)}
        initialBill={editingBill}
      />

      <AddGoalSheet
        open={addGoalOpen}
        onClose={() => setAddGoalOpen(false)}
      />

      <GoalDetailSheet
        goal={detailGoal}
        onClose={() => setDetailGoal(null)}
        summary={summary}
        goalsCount={activeGoals.length}
      />
    </AnimatedPage>
  );
}
