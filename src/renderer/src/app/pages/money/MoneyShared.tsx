import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import { addMonths, format, isAfter, isSameMonth, parse, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/LoadingSkeleton";
import { useSubscription } from "@/hooks/useSubscription";
import { useSubscriptionUi } from "@/context/SubscriptionUiContext";
import { formatCurrency } from "@/lib/utils";
import { useCurrencyFormat } from "@/hooks/useHome";

export const MONEY_MONTH_STORAGE_KEY = "roost-money-selected-month";
export const ease = [0.16, 1, 0.3, 1] as const;

export function getCategoryColor(name: string): string {
  const palette = ["#d4795e", "#9db19f", "#e6a563", "#b88b7e", "#7fa087"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function getStatusTone(pct: number, threshold = 80): "success" | "warning" | "destructive" {
  const warnAt = Math.max(50, threshold - 10);
  if (pct < warnAt) return "success";
  if (pct <= threshold) return "warning";
  return "destructive";
}

export function getStatusColor(pct: number, threshold = 80): string {
  const warnAt = Math.max(50, threshold - 10);
  if (pct < warnAt) return "#7fa087";
  if (pct <= threshold) return "#e6a563";
  return "#c75146";
}

export function parseMonthParam(value: string | null): Date | null {
  if (!value) return null;
  const parsed = parse(`${value}-01`, "yyyy-MM-dd", new Date());
  return Number.isNaN(parsed.getTime()) ? null : startOfMonth(parsed);
}

export function readPersistedMoneyMonth(): Date | null {
  try {
    return parseMonthParam(window.localStorage.getItem(MONEY_MONTH_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writePersistedMoneyMonth(month: Date) {
  try {
    window.localStorage.setItem(MONEY_MONTH_STORAGE_KEY, format(startOfMonth(month), "yyyy-MM"));
  } catch {
    // ignore storage issues
  }
}

export function useMoneyMonthSync(selectedMonth: Date, setSelectedMonth: (month: Date) => void) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const paramMonth = parseMonthParam(searchParams.get("month"));
    if (paramMonth && !isSameMonth(paramMonth, selectedMonth)) {
      setSelectedMonth(paramMonth);
      return;
    }

    if (!paramMonth) {
      const stored = readPersistedMoneyMonth();
      if (stored && !isSameMonth(stored, selectedMonth)) {
        setSelectedMonth(stored);
      }
    }
  }, [searchParams, selectedMonth, setSelectedMonth]);

  useEffect(() => {
    const monthValue = format(startOfMonth(selectedMonth), "yyyy-MM");
    writePersistedMoneyMonth(selectedMonth);
    if (searchParams.get("month") !== monthValue) {
      const next = new URLSearchParams(searchParams);
      next.set("month", monthValue);
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, selectedMonth, setSearchParams]);
}

export function MoneyBackLink() {
  return (
    <Link to="/money" className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-secondary/80 transition-colors">
      ← Money
    </Link>
  );
}

export function MoneyMonthNavigator({
  selectedMonth,
  setSelectedMonth,
}: {
  selectedMonth: Date;
  setSelectedMonth: (month: Date) => void;
}) {
  const { canAccess } = useSubscription();
  const hasHistory = canAccess("budget_insights");
  const canGoForward = !isAfter(addMonths(startOfMonth(selectedMonth), 1), startOfMonth(new Date()));
  const [showHistoryNudge, setShowHistoryNudge] = useState(false);
  const nudgeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goPrev = () => {
    if (!hasHistory) {
      setShowHistoryNudge(true);
      if (nudgeTimeout.current) clearTimeout(nudgeTimeout.current);
      nudgeTimeout.current = setTimeout(() => setShowHistoryNudge(false), 3000);
      return;
    }
    setSelectedMonth(addMonths(selectedMonth, -1));
  };

  const goNext = () => {
    if (!canGoForward) return;
    setSelectedMonth(addMonths(selectedMonth, 1));
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card/70 px-1 py-1">
        <button
          type="button"
          onClick={goPrev}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            hasHistory ? "hover:bg-muted/70 text-foreground" : "text-muted-foreground/50 bg-muted/20"
          }`}
          aria-label={hasHistory ? "Previous month" : "Month history available with Roost Pro"}
        >
          {hasHistory ? <ChevronLeft className="h-4 w-4" /> : <Lock className="h-3 w-3" />}
        </button>

        <button
          type="button"
          onClick={goNext}
          disabled={!canGoForward}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted/70 disabled:pointer-events-none disabled:opacity-35"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence>
        {showHistoryNudge && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.18, ease }}
            className="absolute right-0 top-full mt-2 z-50 w-56 rounded-[14px] border border-border/60 bg-card shadow-lg px-3.5 py-3"
          >
            <p className="text-xs font-medium text-foreground">Month history is available with Roost Pro</p>
            <HistoryNudgeUpgradeLink />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HistoryNudgeUpgradeLink() {
  const { openUpgrade } = useSubscriptionUi();
  return (
    <button
      type="button"
      onClick={openUpgrade}
      className="mt-1 text-xs text-primary hover:text-primary/80 transition-colors"
    >
      Upgrade →
    </button>
  );
}

export function MoneyScreenHeader({
  title,
  selectedMonth,
  setSelectedMonth,
}: {
  title: string;
  selectedMonth: Date;
  setSelectedMonth: (month: Date) => void;
}) {
  return (
    <div className="space-y-3">
      <MoneyBackLink />
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-1">{title}</h1>
          <p className="text-muted-foreground">{format(selectedMonth, "MMMM yyyy")}</p>
        </div>
        <MoneyMonthNavigator selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
      </div>
    </div>
  );
}

export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold">{title}</h2>
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

export function ProTeaserCard({
  title,
  body,
  cta = "See what Roost Pro can do",
}: {
  title: string;
  body: string;
  cta?: string;
}) {
  const { openUpgrade } = useSubscriptionUi();

  return (
    <Card className="border-primary/20 bg-primary/10">
      <CardContent className="p-5 space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{body}</p>
        </div>
        <Button onClick={openUpgrade} className="w-fit">
          {cta}
        </Button>
      </CardContent>
    </Card>
  );
}

export function StatCard({
  label,
  value,
  subtitle,
  accentClass,
  action,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  accentClass?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-0 shadow-none bg-card/90">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          {action}
        </div>
        <div className="space-y-1">
          <p className={`text-xl font-semibold ${accentClass ?? "text-foreground"}`}>{value}</p>
          {subtitle ? <p className="text-xs leading-5 text-muted-foreground">{subtitle}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function SummaryGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-none bg-card/90">
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function InlineProgress({ value, color }: { value: number; color: string }) {
  const width = Math.max(0, Math.min(value, 100));
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-muted/55">
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 0.45, ease }}
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

export function formatOptionalCurrency(value: number | null | undefined, fmt = formatCurrency) {
  return value == null ? "—" : fmt(value);
}

// Re-export useCurrencyFormat for convenience in Money screens
export { useCurrencyFormat };

export function useSortedCategoryTotals(items: Array<{ category: string | null | undefined; amount: number }>) {
  return useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      const key = item.category?.trim() || "Other";
      map.set(key, (map.get(key) ?? 0) + item.amount);
    });
    return [...map.entries()]
      .map(([name, amount]) => ({ name, amount, color: getCategoryColor(name) }))
      .sort((a, b) => b.amount - a.amount);
  }, [items]);
}