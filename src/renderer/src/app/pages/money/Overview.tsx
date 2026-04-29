/**
 * Overview — complete household financial dashboard.
 * Rebuilt from scratch. Reads fixed costs from useBudgetTemplate (totalFixed),
 * lifestyle spend from actual logged expenses, never from the budget template.
 *
 * Zone 1 — The Pulse (ring + 3 stats + Hazel line)
 * Zone 2 — Money flow (income / fixed / lifestyle bars + surplus)
 * Zone 3 — Budget status (per lifestyle category)
 * Zone 4 — Upcoming this month (bills + goal contributions)
 * Zone 5 — Spending trend (6-month bar chart)
 * Zone 6 — Month on month comparison (Pro)
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  endOfMonth,
  format,
  getDate,
  getDaysInMonth,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Skeleton } from "@/components/LoadingSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { useHome } from "@/hooks/useHome";
import { useSubscription } from "@/hooks/useSubscription";
import { useScramble } from "@/hooks/useScramble";
import { supabase } from "@/lib/supabase";
import {
  MoneyScreenHeader,
  SectionHeading,
  ProTeaserCard,
  ease,
  getStatusColor,
  useMoneyMonthSync,
} from "./MoneyShared";

// ── Constants ──────────────────────────────────────────────────────────────────

const RING_SIZE = 120;
const RING_STROKE = 10;
const RING_RADIUS = RING_SIZE / 2 - RING_STROKE / 2; // 55
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ≈ 345.6

const SECTION_LABELS: Record<string, string> = {
  "housing-bills": "Housing",
  "subscriptions-leisure": "Subscriptions",
  transport: "Transport",
  goals: "Goals",
  "food-drink": "Food & Drink",
  household: "Household",
  personal: "Personal",
  savings: "Savings",
};

function sectionLabel(group: string): string {
  return (
    SECTION_LABELS[group] ??
    group
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

function monthKey(date: Date): string {
  return format(startOfMonth(date), "yyyy-MM-dd");
}

// ── Ring component ─────────────────────────────────────────────────────────────

function PulseRing({
  pct,
  noLifestyle,
}: {
  pct: number;
  noLifestyle?: boolean;
}) {
  const clampedPct = Math.min(pct, 100);
  const color =
    pct >= 100
      ? "#c75146"
      : pct >= 90
        ? "#d4795e"
        : pct >= 70
          ? "#e6a563"
          : "#9db19f";
  const targetOffset = RING_CIRCUMFERENCE * (1 - clampedPct / 100);

  // Animate from full offset (0%) to target on mount
  const [currentOffset, setCurrentOffset] = useState(RING_CIRCUMFERENCE);
  useEffect(() => {
    const id = setTimeout(() => setCurrentOffset(targetOffset), 60);
    return () => clearTimeout(id);
  }, [targetOffset]);

  if (noLifestyle) {
    return (
      <div className="flex h-[120px] w-[120px] flex-shrink-0 items-center justify-center rounded-full border-[10px] border-muted/40 text-center">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground leading-tight">
            No budget
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight">set</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[120px] w-[120px] flex-shrink-0">
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={RING_STROKE}
          className="text-muted/40"
        />
        {/* Progress arc */}
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={currentOffset}
          style={{
            transition:
              "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p
          className="text-xl font-medium tracking-tight leading-none"
          style={{ color }}
        >
          {Math.round(pct)}%
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground text-center leading-tight">
          of budget
          <br />
          used
        </p>
      </div>
    </div>
  );
}

// ── Zone skeleton ──────────────────────────────────────────────────────────────

function ZoneSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 w-full rounded-[10px] ${i === 0 ? "w-2/3" : ""}`} />
      ))}
    </div>
  );
}

// ── Progress bar with overflow indicator ──────────────────────────────────────

function CategoryBar({
  spend,
  budget,
  color,
}: {
  spend: number;
  budget: number;
  color: string;
}) {
  const pct = budget > 0 ? Math.min((spend / budget) * 100, 100) : 0;
  const isOver = budget > 0 && spend > budget;

  return (
    <div className="relative h-2 overflow-visible rounded-full bg-muted/40">
      <motion.div
        className="absolute left-0 top-0 h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.45, ease }}
        style={{ backgroundColor: color }}
      />
      {isOver && (
        <div
          className="absolute top-0 h-full w-1.5 rounded-r-full"
          style={{ left: "calc(100% - 2px)", backgroundColor: "#8b1a14" }}
        />
      )}
    </div>
  );
}

// ── 16px goal ring icon ────────────────────────────────────────────────────────

function GoalRing({ colour }: { colour: string }) {
  const size = 16;
  const stroke = 2;
  const radius = (size - stroke) / 2;
  return (
    <svg
      width={size}
      height={size}
      className="flex-shrink-0"
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-muted/40"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={colour || "#9db19f"}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Trend bar chart ────────────────────────────────────────────────────────────

type TrendPoint = {
  month: Date;
  spend: number;
  hasData: boolean;
};

function TrendChart({
  points,
  budgetLine,
  projectedSpend,
  isFree,
  fmt,
}: {
  points: TrendPoint[];
  budgetLine: number;
  projectedSpend: number | null;
  isFree: boolean;
  fmt: (v: number) => string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const today = new Date();
  const currentMonthKey = monthKey(today);

  const barsWithData = points.filter((p) => p.hasData);

  const maxValue = Math.max(
    ...barsWithData.map((p) => p.spend),
    budgetLine > 0 ? budgetLine : 0,
    projectedSpend ?? 0,
    1,
  );

  const budgetLinePct = budgetLine > 0 ? (budgetLine / maxValue) * 100 : null;

  return (
    <div className="relative">
      {/* Chart area — items-stretch so each column fills the full h-40 height */}
      <div className="relative flex h-40 items-stretch gap-2.5">
        {/* Budget reference line lives inside chart coordinate space */}
        {budgetLinePct !== null && (
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-foreground/30"
            style={{ bottom: `${budgetLinePct}%` }}
          >
            <span className="absolute right-0 -top-4 text-[10px] text-muted-foreground">
              Budget
            </span>
          </div>
        )}

        {points.map((point, idx) => {
          const isCurrent = monthKey(point.month) === currentMonthKey;
          const barHeightPct =
            point.spend > 0 ? Math.max((point.spend / maxValue) * 100, 8) : 0;
          const projPct =
            isCurrent && projectedSpend
              ? Math.max((projectedSpend / maxValue) * 100, 8)
              : null;
          const isLocked = isFree && !isCurrent;

          return (
            <div
              key={monthKey(point.month)}
              className="relative flex-1 flex items-end"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip */}
              <AnimatePresence>
                {hoveredIdx === idx && point.hasData && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.15, ease }}
                    className="absolute bottom-full mb-2 z-10 whitespace-nowrap rounded-[10px] border border-border/60 bg-card px-2.5 py-1.5 text-xs shadow-md"
                  >
                    <span className="font-medium">{format(point.month, "MMM")}: </span>
                    <span>{fmt(point.spend)} spent</span>
                    {budgetLine > 0 && (
                      <span className="text-muted-foreground">
                        {" "}· {fmt(budgetLine)} budgeted
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Projection extension (current month only) */}
              {projPct !== null && projPct > barHeightPct && (
                <div
                  className="absolute inset-x-0 bottom-0 rounded-t-[10px] opacity-30"
                  style={{
                    height: `${projPct}%`,
                    backgroundColor: "#d4795e",
                  }}
                />
              )}
              {/* Actual bar — absent when no data for this month */}
              {point.hasData && (
                <motion.div
                  className="absolute inset-x-0 bottom-0 rounded-t-[10px]"
                  style={{
                    backgroundColor: isLocked ? "#ddd4c6" : isCurrent ? "#d4795e" : "#ddd4c6",
                    opacity: isLocked ? 0.45 : 1,
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${barHeightPct}%` }}
                  transition={{ duration: 0.5, ease, delay: idx * 0.05 }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Label row — separate from chart so it doesn't affect bar heights */}
      <div className="flex gap-2.5 mt-2">
        {points.map((point) => {
          const isCurrent = monthKey(point.month) === currentMonthKey;
          return (
            <div key={`${monthKey(point.month)}-label`} className="flex-1 flex justify-center">
              <span
                className={`text-xs ${isCurrent ? "font-medium text-foreground" : "text-muted-foreground"}`}
              >
                {format(point.month, "MMM")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Free tier overlay */}
      {isFree && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[14px] bg-background/50 backdrop-blur-[1px]">
          <div className="max-w-[220px] text-center">
            <p className="text-sm font-medium">See your spending history with Roost Pro</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Unlock previous months and trend analysis.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function Overview() {
  const navigate = useNavigate();
  const {
    expenses,
    selectedSummaryMonth,
    setSelectedSummaryMonth,
    getIncomeForMonth,
    isHouseholdIncomeLoading,
    isExpensesLoading,
    fixedLines,
    envelopeLines,
    totalFixed,
    totalEnvelopes,
    isTemplateLoading,
    activeGoals,
    isSavingsGoalsLoading,
  } = useApp();
  const { home } = useHome();
  const { fmt } = useScramble();
  const { canAccess } = useSubscription();

  const isProHistory = canAccess("budget_insights");
  const isNest = canAccess("hazel_budget_insights");

  useMoneyMonthSync(selectedSummaryMonth, setSelectedSummaryMonth);

  // ── Date helpers ─────────────────────────────────────────────────────────────

  const today = new Date();
  const isCurrentMonth = isSameMonth(selectedSummaryMonth, today);
  const dayOfMonthNow = isCurrentMonth ? getDate(today) : getDaysInMonth(selectedSummaryMonth);
  const daysInMonth = getDaysInMonth(selectedSummaryMonth);
  const daysLeft = isCurrentMonth ? daysInMonth - getDate(today) : 0;

  // ── Income ───────────────────────────────────────────────────────────────────

  const income = getIncomeForMonth(selectedSummaryMonth);
  const combinedIncome = income?.combined_amount ?? 0;
  const incomeSet = combinedIncome > 0;

  // ── Expenses for selected month ──────────────────────────────────────────────

  const monthExpenses = useMemo(
    () => expenses.filter((e) => isSameMonth(new Date(e.date), selectedSummaryMonth)),
    [expenses, selectedSummaryMonth],
  );

  const actualSpend = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + e.amount, 0),
    [monthExpenses],
  );

  // Spend per category (matches envelope line names)
  const spendByCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthExpenses.forEach((e) => {
      const key = e.category?.trim() || "Uncategorised";
      map.set(key, (map.get(key) ?? 0) + e.amount);
    });
    return map;
  }, [monthExpenses]);

  // ── Budget calculations ──────────────────────────────────────────────────────

  const lifestylePct =
    totalEnvelopes > 0 ? (actualSpend / totalEnvelopes) * 100 : 0;
  const lifestyleRemaining = totalEnvelopes - actualSpend;

  // Projection (only if current month and > 3 days of data)
  const canProject = isCurrentMonth && dayOfMonthNow > 3 && actualSpend > 0;
  const dailyRate = canProject ? actualSpend / dayOfMonthNow : null;
  const projectedLifestyle = dailyRate ? dailyRate * daysInMonth : null;
  const projectedSurplus =
    incomeSet && projectedLifestyle !== null
      ? combinedIncome - totalFixed - projectedLifestyle
      : null;

  // Actual surplus
  const surplus = incomeSet ? combinedIncome - totalFixed - actualSpend : null;

  // ── Fixed costs by section (top 3 for chips) ─────────────────────────────────

  const fixedBySection = useMemo(() => {
    const sections = new Map<string, number>();
    fixedLines.forEach((line) => {
      sections.set(
        line.section_group,
        (sections.get(line.section_group) ?? 0) + line.amount,
      );
    });
    return [...sections.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([group, amount]) => ({ group, label: sectionLabel(group), amount }));
  }, [fixedLines]);

  // ── Zone 3: budget status rows, sorted ──────────────────────────────────────

  const budgetStatusRows = useMemo(() => {
    return envelopeLines
      .map((line) => {
        const spend = spendByCategory.get(line.name) ?? 0;
        const pct = line.amount > 0 ? (spend / line.amount) * 100 : 0;
        const isOver = spend > line.amount && line.amount > 0;
        return { line, spend, pct, isOver };
      })
      .sort((a, b) => {
        if (a.isOver && !b.isOver) return -1;
        if (!a.isOver && b.isOver) return 1;
        if (b.pct !== a.pct) return b.pct - a.pct;
        return a.line.name.localeCompare(b.line.name);
      });
  }, [envelopeLines, spendByCategory]);

  const showAllBudgetLink = budgetStatusRows.length > 6;
  const visibleBudgetRows = showAllBudgetLink
    ? budgetStatusRows.slice(0, 6)
    : budgetStatusRows;

  // ── Zone 4: upcoming bills & goal contributions ──────────────────────────────

  const todayDay = getDate(today);

  const { upcomingBills, pastBills } = useMemo(() => {
    if (!isCurrentMonth) return { upcomingBills: [], pastBills: [] };
    const withDay = fixedLines.filter(
      (l) => l.day_of_month != null && l.is_active,
    );
    const upcoming = withDay
      .filter((l) => l.day_of_month! > todayDay)
      .sort((a, b) => a.day_of_month! - b.day_of_month!);
    const past = withDay
      .filter((l) => l.day_of_month! <= todayDay)
      .sort((a, b) => a.day_of_month! - b.day_of_month!);
    return { upcomingBills: upcoming, pastBills: past };
  }, [fixedLines, isCurrentMonth, todayDay]);

  const goalContributions = useMemo(() => {
    if (!isCurrentMonth) return [];
    return activeGoals.filter(
      (g) => g.monthly_contribution && g.monthly_contribution > 0,
    );
  }, [activeGoals, isCurrentMonth]);

  const hasUpcoming =
    isCurrentMonth &&
    (upcomingBills.length > 0 ||
      pastBills.length > 0 ||
      goalContributions.length > 0);

  // ── Zone 5: spending trend ────────────────────────────────────────────────────

  const { data: trendData, isLoading: isTrendLoading } = useQuery({
    queryKey: ["overview-trend", home?.id, monthKey(selectedSummaryMonth)],
    enabled: !!home?.id,
    queryFn: async (): Promise<TrendPoint[]> => {
      const start = startOfMonth(subMonths(selectedSummaryMonth, 5));
      const end = endOfMonth(selectedSummaryMonth);

      const { data: rows, error } = await supabase
        .from("expenses")
        .select("date, amount")
        .eq("home_id", home!.id)
        .gte("date", format(start, "yyyy-MM-dd"))
        .lte("date", format(end, "yyyy-MM-dd"));

      if (error) throw error;

      const months = Array.from({ length: 6 }, (_, i) =>
        startOfMonth(addMonths(start, i)),
      );

      return months.map((month) => {
        const prefix = format(month, "yyyy-MM");
        const spend = (rows ?? []).reduce((sum, row) => {
          if (!row.date.startsWith(prefix)) return sum;
          return sum + Number(row.amount);
        }, 0);
        return { month, spend, hasData: spend > 0 };
      });
    },
  });

  const trendPoints = trendData ?? [];
  const trendMonthsWithData = trendPoints.filter((p) => p.hasData).length;
  const showTrend = !isTrendLoading && trendMonthsWithData >= 2;

  // ── Zone 6: month on month comparison ────────────────────────────────────────

  const previousMonth = startOfMonth(subMonths(selectedSummaryMonth, 1));
  const prevMonthExpenses = useMemo(
    () => expenses.filter((e) => isSameMonth(new Date(e.date), previousMonth)),
    [expenses, previousMonth],
  );
  const prevMonthTotal = prevMonthExpenses.reduce(
    (sum, e) => sum + e.amount,
    0,
  );

  const comparison = useMemo(() => {
    if (!prevMonthExpenses.length) return null;
    const diffPct =
      prevMonthTotal > 0
        ? ((actualSpend - prevMonthTotal) / prevMonthTotal) * 100
        : 100;

    const currentByCategory = new Map<string, number>();
    const previousByCategory = new Map<string, number>();
    monthExpenses.forEach((e) =>
      currentByCategory.set(
        e.category,
        (currentByCategory.get(e.category) ?? 0) + e.amount,
      ),
    );
    prevMonthExpenses.forEach((e) =>
      previousByCategory.set(
        e.category,
        (previousByCategory.get(e.category) ?? 0) + e.amount,
      ),
    );

    // Only consider lifestyle (envelope) category names — never fixed cost names like "Rent"
    const envelopeNames = new Set(envelopeLines.map((l) => l.name.toLowerCase()));

    const allCats = new Set([
      ...currentByCategory.keys(),
      ...previousByCategory.keys(),
    ]);
    let biggest: {
      name: string;
      pct: number;
      direction: "up" | "down";
      absoluteChange: number;
    } | null = null;

    allCats.forEach((cat) => {
      if (!envelopeNames.has(cat?.toLowerCase())) return;
      const current = currentByCategory.get(cat) ?? 0;
      const previous = previousByCategory.get(cat) ?? 0;
      const absoluteChange = Math.abs(current - previous);
      if (absoluteChange < 10) return;
      const pct =
        previous > 0 ? ((current - previous) / previous) * 100 : 100;
      if (Math.abs(pct) < 20) return;
      if (!biggest || absoluteChange > biggest.absoluteChange) {
        biggest = {
          name: cat,
          pct,
          direction: pct >= 0 ? "up" : "down",
          absoluteChange,
        };
      }
    });

    return { diffPct, biggest };
  }, [monthExpenses, prevMonthExpenses, prevMonthTotal, actualSpend, envelopeLines]);

  // ── Hazel static line ────────────────────────────────────────────────────────

  const [hazelInsight, setHazelInsight] = useState<string | null>(null);
  const [pastBillsExpanded, setPastBillsExpanded] = useState(false);

  const staticHazelLine = useMemo(() => {
    // Priority 1: any lifestyle category over budget
    for (const { line, spend } of budgetStatusRows) {
      if (spend > line.amount && line.amount > 0) {
        return `${line.name} is over budget this month — you've spent ${fmt(spend)} of ${fmt(line.amount)}.`;
      }
    }
    // Priority 2: projected overspend
    if (projectedSurplus !== null && projectedSurplus < 0) {
      const topCat = [...spendByCategory.entries()].sort(
        ([, a], [, b]) => b - a,
      )[0];
      return `At your current pace you'll overspend by ${fmt(Math.abs(projectedSurplus))} this month${topCat ? ` — ${topCat[0]} is the biggest factor` : ""}.`;
    }
    // Priority 3: healthy projected surplus
    if (projectedSurplus !== null && projectedSurplus > 100) {
      return `You're on track for a ${fmt(projectedSurplus)} surplus this month.`;
    }
    // Priority 4: early month
    if (isCurrentMonth && getDate(today) <= 7 && actualSpend < totalEnvelopes * 0.15) {
      return "Early days — check back later in the month for a more accurate picture.";
    }
    // Priority 5: default
    if (totalEnvelopes > 0) {
      return `Your spending is ${Math.round(lifestylePct)}% of your budget with ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left in the month.`;
    }
    return "Log your first expenses to start tracking your financial health.";
  }, [
    budgetStatusRows,
    projectedSurplus,
    spendByCategory,
    isCurrentMonth,
    today,
    actualSpend,
    totalEnvelopes,
    lifestylePct,
    daysLeft,
    fmt,
  ]);

  // Pro Hazel: call budgetInsights edge function, fall back to static silently
  useEffect(() => {
    if (!isNest || envelopeLines.length === 0) {
      setHazelInsight(null);
      return;
    }
    const topCategories = envelopeLines.slice(0, 5).map((l) => ({
      name: l.name,
      spend: spendByCategory.get(l.name) ?? 0,
      limit: l.amount,
      pct:
        l.amount > 0
          ? Math.round(((spendByCategory.get(l.name) ?? 0) / l.amount) * 100)
          : 0,
      recurringTotal: 0,
    }));
    window.api
      .budgetInsights({
        input: {
          monthLabel: format(selectedSummaryMonth, "MMMM yyyy"),
          totalSpent: actualSpend,
          totalBudget: totalEnvelopes,
          projectedMonthEnd: projectedLifestyle ?? actualSpend,
          remaining: lifestyleRemaining,
          overspend: Math.max(0, actualSpend - totalEnvelopes),
          topCategories,
        },
        isNest: true,
      })
      .then((res) => {
        if (res.success) setHazelInsight(res.data.summary);
      })
      .catch(() => {
        /* fall back to static silently */
      });
    // Recalculate only when month or template changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNest, monthKey(selectedSummaryMonth), envelopeLines.length]);

  const hazelLine = hazelInsight ?? staticHazelLine;

  // ── Loading states ────────────────────────────────────────────────────────────

  const zone123Loading =
    isExpensesLoading || isTemplateLoading || isHouseholdIncomeLoading;
  const zone4Loading = isTemplateLoading || isSavingsGoalsLoading;

  // ── Lifestyle bar: ceiling indicator position ─────────────────────────────────

  // income baseline = 100%, lifestyle bar is actual/income * 100
  // ceiling = totalEnvelopes/income * 100
  const lifestyleBarWidthPct =
    incomeSet && combinedIncome > 0
      ? Math.min((actualSpend / combinedIncome) * 100, 100)
      : 0;
  const lifestyleCeilingPct =
    incomeSet && combinedIncome > 0
      ? Math.min((totalEnvelopes / combinedIncome) * 100, 100)
      : null;
  const fixedBarWidthPct =
    incomeSet && combinedIncome > 0
      ? Math.min((totalFixed / combinedIncome) * 100, 100)
      : 0;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <AnimatedPage className="mx-auto max-w-2xl p-6 pb-12 space-y-5">
      <MoneyScreenHeader
        title="Overview"
        selectedMonth={selectedSummaryMonth}
        setSelectedMonth={setSelectedSummaryMonth}
      />

      {/* ── Zone 1: The Pulse ─────────────────────────────────────────────── */}
      <section>
        <Card className="border-0 bg-card/90 shadow-none">
          <CardContent className="p-5">
            {zone123Loading ? (
              <div className="flex items-center gap-6">
                <Skeleton className="h-[120px] w-[120px] flex-shrink-0 rounded-full" />
                <div className="flex-1 space-y-4">
                  <ZoneSkeleton lines={3} />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-6">
                  {/* Ring */}
                  <PulseRing
                    pct={lifestylePct}
                    noLifestyle={envelopeLines.length === 0}
                  />

                  {/* Three stats */}
                  <div className="flex-1 space-y-3.5">
                    {/* Stat 1: Spent this month */}
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Spent this month
                      </p>
                      <p className="text-[20px] font-medium leading-tight tracking-tight">
                        {fmt(actualSpend)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {monthExpenses.length}{" "}
                        {monthExpenses.length === 1 ? "expense" : "expenses"}
                      </p>
                    </div>

                    {/* Stat 2: Lifestyle budget remaining */}
                    {envelopeLines.length > 0 && (
                      <div>
                        <p className="text-[11px] text-muted-foreground">
                          Lifestyle budget left
                        </p>
                        <p
                          className="text-[18px] font-medium leading-tight tracking-tight"
                          style={{ color: getStatusColor(lifestylePct) }}
                        >
                          {fmt(lifestyleRemaining)}
                        </p>
                      </div>
                    )}

                    {/* Stat 3: Projection */}
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Projected this month
                      </p>
                      {!incomeSet ? (
                        <p className="text-[13px] text-muted-foreground italic">
                          Set income for full picture
                        </p>
                      ) : !canProject ? (
                        <p className="text-[13px] text-muted-foreground italic">
                          Not enough data yet
                        </p>
                      ) : projectedSurplus !== null ? (
                        <>
                          <p
                            className="text-[16px] font-medium leading-tight tracking-tight"
                            style={{
                              color:
                                projectedSurplus >= 0 ? "#7fa087" : "#c75146",
                            }}
                          >
                            Projected surplus:{" "}
                            {projectedSurplus >= 0 ? "" : "-"}
                            {fmt(Math.abs(projectedSurplus))}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Based on {dayOfMonthNow} days of spending
                          </p>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Hazel ambient line */}
                {hazelLine && (
                  <p className="mt-4 text-[12px] italic leading-relaxed text-muted-foreground border-t border-border/40 pt-3.5">
                    {hazelLine}
                  </p>
                )}

                {/* No lifestyle budget prompt */}
                {envelopeLines.length === 0 && (
                  <button
                    type="button"
                    className="mt-3 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    onClick={() => navigate("/money/budgets")}
                  >
                    Set up your budget to track spending →
                  </button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Zone 2: Money flow ───────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeading title="This month" />
        <Card className="border-0 bg-card/90 shadow-none">
          <CardContent className="space-y-5 p-5">
            {zone123Loading ? (
              <ZoneSkeleton lines={5} />
            ) : !incomeSet ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Income not set for this month.
                </p>
                <Link
                  to="/settings/money"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Set income →
                </Link>
              </div>
            ) : (
              <>
                {/* Income row */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">Income</p>
                    <p className="text-lg font-medium tracking-tight">
                      {fmt(combinedIncome)}
                    </p>
                  </div>
                  <div className="h-2.5 w-full rounded-full" style={{ background: "rgba(61, 50, 41, 0.12)" }} />
                </div>

                {/* Fixed costs row */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">Fixed costs</p>
                      <span className="rounded-full bg-[#d4795e]/15 px-2 py-0.5 text-[10px] font-medium text-[#d4795e]">
                        Fixed
                      </span>
                    </div>
                    <p className="text-sm font-medium">{fmt(totalFixed)}</p>
                  </div>
                  <div className="relative h-2.5 overflow-hidden rounded-full bg-muted/40">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${fixedBarWidthPct}%` }}
                      transition={{ duration: 0.5, ease }}
                      style={{ backgroundColor: "#d4795e" }}
                    />
                  </div>
                  {/* Section chips */}
                  {fixedBySection.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {fixedBySection.map(({ group, label, amount }) => (
                        <button
                          key={group}
                          type="button"
                          onClick={() => navigate("/money/budgets")}
                          className="flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: "#d4795e" }}
                          />
                          {label} {fmt(amount)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lifestyle spending row */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">Lifestyle spending</p>
                      <span className="rounded-full bg-[#9db19f]/20 px-2 py-0.5 text-[10px] font-medium text-[#7fa087]">
                        Lifestyle
                      </span>
                    </div>
                    <p className="text-sm font-medium">{fmt(actualSpend)}</p>
                  </div>
                  <div className="relative h-2.5 overflow-hidden rounded-full bg-muted/40">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${lifestyleBarWidthPct}%` }}
                      transition={{ duration: 0.5, ease }}
                      style={{
                        backgroundColor: getStatusColor(lifestylePct),
                      }}
                    />
                    {/* Ceiling indicator */}
                    {lifestyleCeilingPct !== null && (
                      <div
                        className="absolute top-0 h-full w-0.5 bg-foreground/40"
                        style={{ left: `${lifestyleCeilingPct}%` }}
                      />
                    )}
                  </div>
                  {totalEnvelopes > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      {fmt(actualSpend)} of {fmt(totalEnvelopes)} lifestyle
                      budget
                    </p>
                  )}
                </div>

                {/* Surplus row */}
                <div>
                  <div className="h-px bg-border/50 mb-4" />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-medium">Estimated surplus</p>
                    <p
                      className="text-xl font-medium tracking-tight"
                      style={{
                        color:
                          surplus !== null && surplus >= 0
                            ? "#7fa087"
                            : "#c75146",
                      }}
                    >
                      {surplus !== null ? fmt(surplus) : "—"}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Zone 3: Budget status ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeading title="Budget status" />
        <Card className="border-0 bg-card/90 shadow-none">
          <CardContent className="p-5">
            {zone123Loading ? (
              <ZoneSkeleton lines={4} />
            ) : envelopeLines.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Set up lifestyle budgets to see your spending by category.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/money/budgets")}
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Go to Budgets →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleBudgetRows.map(({ line, spend, pct, isOver }) => {
                  const barColor = getStatusColor(pct);
                  const overAmount = spend - line.amount;
                  return (
                    <div key={line.id} className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <p className="flex-1 text-[13px] font-medium truncate">
                          {line.name}
                        </p>
                        {isOver ? (
                          <p className="text-[12px] font-medium text-destructive flex-shrink-0">
                            -{fmt(overAmount)} over
                          </p>
                        ) : (
                          <p className="text-[12px] text-muted-foreground flex-shrink-0">
                            {fmt(spend)} of {fmt(line.amount)}
                          </p>
                        )}
                      </div>
                      <CategoryBar
                        spend={spend}
                        budget={line.amount}
                        color={barColor}
                      />
                    </div>
                  );
                })}

                <div className="flex items-center justify-between pt-1">
                  {showAllBudgetLink && (
                    <button
                      type="button"
                      onClick={() => navigate("/money/spending")}
                      className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      See all {budgetStatusRows.length} categories →
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate("/money/budgets")}
                    className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Manage budgets →
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Zone 4: Upcoming this month ──────────────────────────────────────── */}
      {isCurrentMonth && (
        <section className="space-y-3">
          {zone4Loading ? (
            <>
              <SectionHeading title="Coming up" />
              <Card className="border-0 bg-card/90 shadow-none">
                <CardContent className="p-5">
                  <ZoneSkeleton lines={3} />
                </CardContent>
              </Card>
            </>
          ) : hasUpcoming ? (
            <>
              <SectionHeading title="Coming up" />
              <Card className="border-0 bg-card/90 shadow-none">
                <CardContent className="divide-y divide-border/40 p-0">
                  {/* ── BILLS subsection ────────────────────────────────── */}
                  {(upcomingBills.length > 0 || pastBills.length > 0) && (
                    <div className="px-5 pt-3 pb-1">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                        Bills
                      </p>
                    </div>
                  )}

                  {upcomingBills.slice(0, 5).map((line) => {
                    const dayNum = line.day_of_month!;
                    const dueSoon =
                      dayNum - todayDay <= 3 && dayNum > todayDay;
                    return (
                      <button
                        key={line.id}
                        type="button"
                        onClick={() => navigate("/money/budgets")}
                        className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/30 ${dueSoon ? "border-l-2 border-warning" : ""}`}
                      >
                        <div className="flex-1">
                          <p className="text-[13px] font-medium">{line.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {dueSoon && (
                            <span className="text-[10px] font-medium text-warning">
                              Due soon
                            </span>
                          )}
                          <p className="text-[12px] text-muted-foreground">
                            Due {ordinal(dayNum)}
                          </p>
                          <p className="text-[13px] font-medium">
                            {fmt(line.amount)}
                          </p>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                        </div>
                      </button>
                    );
                  })}

                  {upcomingBills.length > 5 && (
                    <button
                      type="button"
                      onClick={() => navigate("/money/budgets")}
                      className="w-full px-5 py-3 text-left text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      and {upcomingBills.length - 5} more →
                    </button>
                  )}

                  {/* Past bills — expandable */}
                  {pastBills.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPastBillsExpanded((v) => !v)}
                        className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-muted/30"
                      >
                        <p className="text-[12px] text-muted-foreground">
                          {pastBills.length}{" "}
                          {pastBills.length === 1 ? "bill" : "bills"} already
                          out this month
                        </p>
                        <ChevronRight
                          className={`h-3.5 w-3.5 text-muted-foreground/50 transition-transform ${pastBillsExpanded ? "rotate-90" : ""}`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {pastBillsExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease }}
                            className="overflow-hidden"
                          >
                            {pastBills.map((line) => (
                              <div
                                key={line.id}
                                className="flex items-center gap-3 px-5 py-2.5 border-t border-border/30"
                              >
                                <div className="flex-1">
                                  <p className="text-[12px] text-muted-foreground">
                                    {line.name}
                                  </p>
                                </div>
                                <p className="text-[12px] text-muted-foreground">
                                  {ordinal(line.day_of_month!)}
                                </p>
                                <p className="text-[12px] font-medium text-muted-foreground">
                                  {fmt(line.amount)}
                                </p>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}

                  {/* ── GOAL CONTRIBUTIONS subsection ───────────────────── */}
                  {goalContributions.length > 0 && (
                    <>
                      <div className="px-5 pt-3 pb-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                          Goal Contributions
                        </p>
                      </div>
                      {goalContributions.map((goal) => {
                        const day = goal.contribution_day ?? 1;
                        const colour = goal.colour ?? "#9db19f";
                        return (
                          <button
                            key={goal.id}
                            type="button"
                            onClick={() => navigate("/money/goals")}
                            className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/30"
                          >
                            <GoalRing colour={colour} />
                            <div className="flex-1">
                              <p className="text-[13px] font-medium">
                                {goal.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="text-[12px] text-muted-foreground">
                                {fmt(goal.monthly_contribution!)} on the{" "}
                                {ordinal(day)}
                              </p>
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                            </div>
                          </button>
                        );
                      })}
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </section>
      )}

      {/* ── Zone 5: Spending trend ───────────────────────────────────────────── */}
      {(isTrendLoading || showTrend || (!isTrendLoading && trendMonthsWithData >= 1 && !isProHistory)) && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionHeading title="Spending trend" />
            <button
              type="button"
              onClick={() => navigate("/money/spending")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              See full history →
            </button>
          </div>
          <Card className="border-0 bg-card/90 shadow-none">
            <CardContent className="p-5">
              {isTrendLoading ? (
                <Skeleton className="h-52 w-full rounded-[14px]" />
              ) : (
                <TrendChart
                  points={trendPoints}
                  budgetLine={totalEnvelopes}
                  projectedSpend={projectedLifestyle}
                  isFree={!isProHistory}
                  fmt={fmt}
                />
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* ── Zone 6: Month on month comparison ───────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeading title="vs last month" />
        {!isProHistory ? (
          <ProTeaserCard
            title="See how this month compares"
            body="Roost Pro unlocks month-on-month comparisons and the categories shifting the most."
            cta="Unlock comparisons"
          />
        ) : !comparison ? null : (
          <Card className="border-0 bg-card/90 shadow-none">
            <CardContent className="space-y-4 p-5">
              {/* Visual bar comparison */}
              <div className="space-y-2">
                {(() => {
                  const maxBar = Math.max(actualSpend, prevMonthTotal, 1);
                  const currentPct = (actualSpend / maxBar) * 100;
                  const prevPct = (prevMonthTotal / maxBar) * 100;
                  return (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-20 flex-shrink-0 text-[12px] text-muted-foreground text-right">
                            {format(selectedSummaryMonth, "MMM")}
                          </div>
                          <div className="relative flex-1 h-6 rounded-full bg-muted/40 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${currentPct}%` }}
                              transition={{ duration: 0.5, ease }}
                              style={{ backgroundColor: "#d4795e" }}
                            />
                          </div>
                          <div className="w-20 flex-shrink-0 text-[13px] font-medium">
                            {fmt(actualSpend)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-20 flex-shrink-0 text-[12px] text-muted-foreground text-right">
                            {format(previousMonth, "MMM")}
                          </div>
                          <div className="relative flex-1 h-6 rounded-full bg-muted/40 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${prevPct}%` }}
                              transition={{ duration: 0.5, ease, delay: 0.1 }}
                              style={{ backgroundColor: "#ddd4c6" }}
                            />
                          </div>
                          <div className="w-20 flex-shrink-0 text-[13px] font-medium text-muted-foreground">
                            {fmt(prevMonthTotal)}
                          </div>
                        </div>
                      </div>

                      {/* % change chip */}
                      <div className="flex justify-end">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            comparison.diffPct > 0
                              ? "bg-destructive/10 text-destructive"
                              : "bg-success/10 text-success"
                          }`}
                        >
                          {comparison.diffPct > 0 ? "↑" : "↓"}{" "}
                          {Math.abs(comparison.diffPct).toFixed(0)}%{" "}
                          {comparison.diffPct > 0 ? "more" : "less"}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Biggest mover */}
              {comparison.biggest && (
                <div className="rounded-[14px] bg-background/55 px-4 py-3 text-[13px] leading-6 text-foreground">
                  <span className="font-medium">{comparison.biggest.name}</span>{" "}
                  is {comparison.biggest.direction}{" "}
                  {Math.abs(comparison.biggest.pct).toFixed(0)}% vs last month.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      {/* ── Settings link (replaces income editor) ──────────────────────────── */}
      <div className="flex justify-center pt-2">
        <Link
          to="/settings/money"
          className="text-[12px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          Update your income in Settings →
        </Link>
      </div>
    </AnimatedPage>
  );
}
