import { useState, useMemo } from "react";
import {
  differenceInCalendarMonths,
  format,
  formatDuration,
  intervalToDuration,
  parseISO,
  startOfMonth,
} from "date-fns";
import {
  Check,
  ChevronDown,
  PiggyBank,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { AnimatedPage } from "@/components/AnimatedPage";
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
import type { SavingsGoal, CreateSavingsGoal, ProRequiredError } from "@/lib/schemas/money";
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

// ── Bottom sheet ──────────────────────────────────────────────────────────────

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
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
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

// ── Add Goal Sheet ─────────────────────────────────────────────────────────────

function daySuffix(d: number) {
  if (d >= 11 && d <= 13) return `${d}th`;
  switch (d % 10) {
    case 1: return `${d}st`;
    case 2: return `${d}nd`;
    case 3: return `${d}rd`;
    default: return `${d}th`;
  }
}

function DayPicker({ value, onChange }: { value: number; onChange: (day: number) => void }) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {days.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          className={`flex-shrink-0 text-xs rounded-lg px-2.5 py-1.5 transition-colors ${
            value === d
              ? "bg-foreground text-background font-medium"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          {daySuffix(d)}
        </button>
      ))}
    </div>
  );
}

function AddGoalSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addGoal } = useApp();
  const { openUpgrade } = useSubscriptionUi();

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [colour, setColour] = useState(GOAL_COLOURS[0].value);
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [contributionDay, setContributionDay] = useState(1);

  const amountNum = parseFloat(targetAmount);
  const contribNum = monthlyContribution ? parseFloat(monthlyContribution) : undefined;
  const valid = name.trim().length > 0 && !isNaN(amountNum) && amountNum > 0;

  const reset = () => {
    setName("");
    setTargetAmount("");
    setTargetDate(undefined);
    setColour(GOAL_COLOURS[0].value);
    setMonthlyContribution("");
    setContributionDay(1);
  };

  const handleSave = () => {
    if (!valid) return;
    const payload: CreateSavingsGoal = {
      name: name.trim(),
      target_amount: amountNum,
      target_date: targetDate ? format(targetDate, "yyyy-MM-dd") : null,
      colour,
      monthly_contribution: contribNum && contribNum > 0 ? contribNum : null,
      contribution_day: contribNum && contribNum > 0 ? contributionDay : null,
    };
    addGoal.mutate(payload, {
      onSuccess: () => {
        reset();
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

        <div className="space-y-1.5">
          <Label htmlFor="goal-amount">Target amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none pointer-events-none">£</span>
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

        <div className="space-y-1.5">
          <Label>Target date (optional)</Label>
          <DatePicker value={targetDate} onChange={setTargetDate} placeholder="No target date" />
        </div>

        <div className="space-y-2">
          <Label>Colour</Label>
          <div className="flex gap-2.5">
            {GOAL_COLOURS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColour(c.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  colour === c.value ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: c.value }}
                aria-label={c.label}
              />
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="goal-contribution">Monthly contribution (optional)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none pointer-events-none">£</span>
            <Input
              id="goal-contribution"
              className="pl-7"
              placeholder="0.00"
              type="number"
              min="0.01"
              step="0.01"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">This becomes a fixed line in your budget.</p>
        </div>

        {contribNum && contribNum > 0 && (
          <div className="space-y-1.5">
            <Label>Payment date</Label>
            <DayPicker value={contributionDay} onChange={setContributionDay} />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={!valid || addGoal.isPending} className="flex-1">
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
  surplus,
  goalsCount,
}: {
  goal: SavingsGoal | null;
  onClose: () => void;
  surplus: number;
  goalsCount: number;
}) {
  const { updateGoal, deleteGoal, completeGoal, addToGoal } = useApp();
  const fmt = useCurrencyFormat();
  const [addAmount, setAddAmount] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [showAddSavings, setShowAddSavings] = useState(false);

  if (!goal) return null;

  const progressPct = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
  const ringColor = goal.colour ?? "#d4795e";
  const circumference = 2 * Math.PI * 44;
  const ringOffset = circumference * (1 - progressPct / 100);

  const monthsUntil = goal.target_date
    ? differenceInCalendarMonths(parseISO(goal.target_date), startOfMonth(new Date()))
    : null;
  const remaining = goal.target_amount - goal.current_amount;
  const monthlyNeeded = monthsUntil && monthsUntil > 0 ? remaining / monthsUntil : null;

  const getStatus = (): "on-track" | "behind" | null => {
    if (!goal.target_date) return null;
    if (remaining <= 0) return "on-track";
    if (!monthsUntil || monthsUntil <= 0) return "behind";
    const monthlyAvailable = surplus / Math.max(1, goalsCount);
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

  return (
    <BottomSheet open={!!goal} onClose={onClose} title={goal.name}>
      <div className="space-y-6">
        {/* Ring + amounts */}
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0" style={{ width: 96, height: 96 }}>
            <svg viewBox="0 0 100 100" width={96} height={96} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={50} cy={50} r={44} fill="none" stroke="rgba(61,50,41,0.1)" strokeWidth={10} />
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

          <div className="flex-1 space-y-1">
            <p className="text-xl font-medium">{goal.name}</p>
            <p className="text-sm text-muted-foreground">
              {fmt(goal.current_amount)} saved of {fmt(goal.target_amount)}
            </p>
            {goal.target_date && (
              <p className="text-sm text-muted-foreground">
                by {format(parseISO(goal.target_date), "MMMM yyyy")}
              </p>
            )}
            {status && (
              <span
                className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${
                  status === "on-track" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
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
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">£</span>
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
                  <Button onClick={handleAddSavings} disabled={addToGoal.isPending}>Add</Button>
                  <Button variant="outline" onClick={() => setShowAddSavings(false)}>Cancel</Button>
                </div>
              </motion.div>
            ) : (
              <Button key="add-btn" className="w-full" onClick={() => setShowAddSavings(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add savings
              </Button>
            )}
          </AnimatePresence>

          {!goal.is_complete && (
            <Button
              variant="outline"
              className="w-full gap-2 text-success border-success/30 hover:bg-success/10"
              onClick={() => completeGoal.mutate({ id: goal.id }, { onSuccess: onClose })}
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
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <p className="text-sm text-muted-foreground">Remove this goal permanently?</p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowDelete(false)} className="flex-1">Keep it</Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteGoal.mutate({ id: goal.id }, { onSuccess: onClose })}
                    disabled={deleteGoal.isPending}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Remove
                  </Button>
                </div>
              </motion.div>
            ) : (
              <button
                key="delete-btn"
                type="button"
                onClick={() => setShowDelete(true)}
                className="text-sm text-muted-foreground hover:text-destructive transition-colors"
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

// ── Goal Ring (card size) ─────────────────────────────────────────────────────

function GoalRing({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
  const r = (size / 2) - 6;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);
  const cx = size / 2;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(61,50,41,0.1)" strokeWidth={8} />
        <motion.circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

// ── Contribution summary card ─────────────────────────────────────────────────

function ContributionSummaryCard({
  requiredMonthly,
  surplus,
}: {
  requiredMonthly: number;
  surplus: number;
}) {
  const fmt = useCurrencyFormat();
  const covered = surplus >= requiredMonthly;
  const close = !covered && surplus >= requiredMonthly * 0.8;

  const accentClass = covered
    ? "border-success/30 bg-success/8"
    : close
    ? "border-warning/30 bg-warning/8"
    : "border-destructive/30 bg-destructive/8";
  const textClass = covered ? "text-success" : close ? "text-warning" : "text-destructive";

  return (
    <Card className={`border ${accentClass} shadow-none`}>
      <CardContent className="p-4 space-y-1">
        <p className="text-sm text-muted-foreground">
          To hit your goals you need to save{" "}
          <span className={`font-medium ${textClass}`}>{fmt(requiredMonthly)}/month</span>.
        </p>
        <p className="text-sm text-muted-foreground">
          Your current surplus is{" "}
          <span className={`font-medium ${covered ? "text-success" : "text-foreground"}`}>
            {fmt(surplus)}
          </span>
          .{" "}
          {covered
            ? "You're on track."
            : close
            ? "You're close, but may need to trim elsewhere."
            : "Your goals may be hard to reach at this rate."}
        </p>
      </CardContent>
    </Card>
  );
}

// ── Goal card ─────────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  surplus,
  goalsCount,
  onClick,
}: {
  goal: SavingsGoal;
  surplus: number;
  goalsCount: number;
  onClick: () => void;
}) {
  const fmt = useCurrencyFormat();
  const color = goal.colour ?? "#d4795e";
  const progressPct = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
  const remaining = goal.target_amount - goal.current_amount;

  const monthsUntil = goal.target_date
    ? differenceInCalendarMonths(parseISO(goal.target_date), startOfMonth(new Date()))
    : null;
  const monthlyNeeded = monthsUntil && monthsUntil > 0 ? remaining / monthsUntil : null;

  const getStatus = (): "on-track" | "behind" | "no-deadline" => {
    if (!goal.target_date) return "no-deadline";
    if (remaining <= 0) return "on-track";
    if (!monthsUntil || monthsUntil <= 0) return "behind";
    const monthlyAvailable = surplus / Math.max(1, goalsCount);
    return monthlyAvailable >= (monthlyNeeded ?? Infinity) ? "on-track" : "behind";
  };
  const status = getStatus();

  const statusStyle = {
    "on-track": "bg-success/15 text-success",
    "behind": "bg-warning/15 text-warning",
    "no-deadline": "bg-muted text-muted-foreground",
  }[status];
  const statusLabel = {
    "on-track": "On track",
    "behind": "Behind",
    "no-deadline": "No deadline",
  }[status];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="w-full rounded-[20px] border border-border/60 bg-card/90 p-4 text-left"
    >
      <div className="flex items-start gap-4">
        <GoalRing pct={progressPct} color={color} size={64} />

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-base font-medium leading-tight">{goal.name}</p>
            <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {fmt(goal.current_amount)} saved of {fmt(goal.target_amount)}
          </p>
          {goal.target_date && (
            <p className="text-xs text-muted-foreground">
              by {format(parseISO(goal.target_date), "MMMM yyyy")}
            </p>
          )}
          {monthlyNeeded && monthlyNeeded > 0 && (
            <p className="text-xs text-muted-foreground">
              Save {fmt(monthlyNeeded)}/month to reach this goal
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ── Completed goals section ───────────────────────────────────────────────────

function CompletedGoalsSection({ goals }: { goals: SavingsGoal[] }) {
  const [expanded, setExpanded] = useState(false);
  const fmt = useCurrencyFormat();

  if (goals.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2, ease }}>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
        {goals.length} completed {goals.length === 1 ? "goal" : "goals"}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-1">
              {goals.map((goal) => {
                const color = goal.colour ?? "#9db19f";
                const duration =
                  goal.created_at && goal.completed_at
                    ? formatDuration(
                        intervalToDuration({
                          start: new Date(goal.created_at),
                          end: new Date(goal.completed_at),
                        }),
                        { format: ["years", "months"], delimiter: ", " }
                      )
                    : null;

                return (
                  <div
                    key={goal.id}
                    className="flex items-center gap-3 rounded-[18px] bg-card/60 border border-border/40 px-4 py-3 opacity-70"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}25` }}
                    >
                      <Check className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{goal.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmt(goal.target_amount)}
                        {goal.completed_at && ` · completed ${format(new Date(goal.completed_at), "MMMM yyyy")}`}
                        {duration ? ` · took ${duration}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function Goals() {
  const {
    activeGoals,
    completedGoals,
    isSavingsGoalsLoading,
    summary,
  } = useApp();
  const fmt = useCurrencyFormat();
  const { isNest } = useSubscription();
  const { openUpgrade } = useSubscriptionUi();

  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [detailGoal, setDetailGoal] = useState<SavingsGoal | null>(null);

  // Monthly contribution required across all goals with target dates
  const requiredMonthly = useMemo(() => {
    return activeGoals.reduce((sum, goal) => {
      if (!goal.target_date) return sum;
      const monthsUntil = differenceInCalendarMonths(
        parseISO(goal.target_date),
        startOfMonth(new Date())
      );
      if (monthsUntil <= 0) return sum;
      const remaining = goal.target_amount - goal.current_amount;
      if (remaining <= 0) return sum;
      return sum + remaining / monthsUntil;
    }, 0);
  }, [activeGoals]);

  const surplus = summary?.surplus ?? 0;
  const hasGoalsWithDates = activeGoals.some((g) => !!g.target_date);

  // Pro gating: free tier shows 1 goal
  const displayGoals = isNest ? activeGoals : activeGoals.slice(0, 1);
  const hiddenCount = activeGoals.length - displayGoals.length;

  const handleAddGoal = () => {
    if (!isNest && activeGoals.length >= 1) {
      openUpgrade();
      return;
    }
    setAddGoalOpen(true);
  };

  return (
    <AnimatedPage className="max-w-6xl mx-auto p-6 space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <MoneyBackLink />
        <div>
          <h1 className="text-3xl font-semibold mb-1">Goals</h1>
          <p className="text-muted-foreground">What are you saving toward?</p>
        </div>
      </div>

      {isSavingsGoalsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-[20px]" />
          ))}
        </div>
      ) : activeGoals.length === 0 ? (
        /* ── Empty state ── */
        <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
          <div className="w-16 h-16 rounded-[20px] bg-primary/10 flex items-center justify-center">
            <PiggyBank className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2 max-w-xs">
            <p className="text-lg font-medium">What are you saving toward?</p>
            <p className="text-sm text-muted-foreground leading-6">
              A new sofa, a holiday, an emergency fund. Add your first goal and Roost will track your progress.
            </p>
          </div>
          <Button onClick={handleAddGoal} className="mt-2">
            <Plus className="w-4 h-4 mr-1.5" />
            Add your first goal
          </Button>
        </div>
      ) : (
        <>
          {/* ── Monthly contribution summary ── */}
          {hasGoalsWithDates && requiredMonthly > 0 && (
            <ContributionSummaryCard requiredMonthly={requiredMonthly} surplus={surplus} />
          )}

          {/* ── Active goals ── */}
          <section className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Saving toward</p>

            <div className="space-y-2.5">
              {displayGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  surplus={surplus}
                  goalsCount={activeGoals.length}
                  onClick={() => setDetailGoal(goal)}
                />
              ))}
            </div>

            {/* Pro gate for hidden goals */}
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={openUpgrade}
                className="w-full rounded-[20px] border border-primary/20 bg-primary/8 p-4 text-left"
              >
                <p className="text-sm font-medium">
                  {hiddenCount} more {hiddenCount === 1 ? "goal" : "goals"} with Roost Pro
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Save toward more things. Upgrade to see all your goals. →
                </p>
              </button>
            )}

            {/* Add goal */}
            <button
              type="button"
              onClick={handleAddGoal}
              className="w-full rounded-[20px] border border-dashed border-border/60 bg-card/50 px-4 py-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add a goal
            </button>
          </section>

          {/* ── Completed goals ── */}
          <CompletedGoalsSection goals={completedGoals} />
        </>
      )}

      <AddGoalSheet open={addGoalOpen} onClose={() => setAddGoalOpen(false)} />
      <GoalDetailSheet
        goal={detailGoal}
        onClose={() => setDetailGoal(null)}
        surplus={surplus}
        goalsCount={activeGoals.length}
      />
    </AnimatedPage>
  );
}
