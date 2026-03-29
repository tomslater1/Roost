import React, { useEffect, useRef, useState, useMemo } from "react";
import { differenceInCalendarDays } from "date-fns";
import { Clipboard, CheckCircle, Trash2, Plus, User, Users, Calendar as CalendarIcon, AlertCircle, DoorOpen, RefreshCw, Clock, Sparkles, X, Check, UserX, Flame } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useApp } from "../context/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { DatePicker } from "../components/ui/DatePicker";
import { Textarea } from "../components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { AnimatedPage } from "../components/AnimatedPage";
import { EmptyState } from "../components/EmptyState";
import { ListSkeleton } from "../components/LoadingSkeleton";
import { listItemVariants } from "../utils/animations";
import { RoomIcon } from "../components/RoomIcon";

const ease = [0.43, 0.13, 0.23, 0.96] as const
const spring = { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const }
const microInteraction = { duration: 0.12, ease: [0.22, 1, 0.36, 1] as const }
const STRIKE_ANIMATION_MS = 900;

interface ChoreStrikeState {
  startedAt: number;
}

const FREQUENCY_OPTIONS = [
  { value: "one-time" as const, label: "One-time", icon: Clock },
  { value: "daily" as const, label: "Daily", icon: RefreshCw },
  { value: "weekly" as const, label: "Weekly", icon: RefreshCw },
  { value: "monthly" as const, label: "Monthly", icon: RefreshCw },
]

// Returns how many consecutive periods a recurring chore has been completed.
// completions must be sorted newest-first.
function computeStreak(completions: Date[], frequency: "weekly" | "monthly"): number {
  if (completions.length < 2) return completions.length;
  const windowMs = frequency === "weekly" ? 7 * 86400_000 : 30 * 86400_000;
  const slackMs  = frequency === "weekly" ? 3 * 86400_000 : 7 * 86400_000;
  let streak = 1;
  for (let i = 1; i < completions.length; i++) {
    const gap = completions[i - 1].getTime() - completions[i].getTime();
    if (gap >= windowMs - slackMs && gap <= windowMs + slackMs) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function Chores() {
  const { chores, choreHistory, rooms, roomGroups, currentUser, partnerName, addChore, deleteChore, toggleChore, isChoresLoading, isAddingChore } = useApp();
  const [view, setView] = useState<"all" | "me" | "partner">("all");
  const [showAddChore, setShowAddChore] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [addedSuggestions, setAddedSuggestions] = useState<Set<string>>(new Set());
  const [recentlyCompleted, setRecentlyCompleted] = useState<Record<string, ChoreStrikeState>>({});
  const strikeTimeoutsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    return () => {
      Object.values(strikeTimeoutsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  const [newChore, setNewChore] = useState({
    title: "",
    assignedTo: currentUser,
    dueDate: new Date() as Date | undefined,
    frequency: "one-time" as "one-time" | "daily" | "weekly" | "monthly",
    notes: "",
    room: "All Rooms" as string,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Per-chore: most recent completion entry from activity feed (for the history row)
  const lastCompletionByChore = useMemo(() => {
    const map = new Map<string, { userName: string; completedAt: Date }>();
    // choreHistory is already sorted newest-first from the hook
    for (const entry of choreHistory) {
      if (!map.has(entry.choreId)) {
        map.set(entry.choreId, { userName: entry.userName, completedAt: entry.completedAt });
      }
    }
    return map;
  }, [choreHistory]);

  // Per-chore: streak count for recurring chores (weekly / monthly only)
  const streakByChore = useMemo(() => {
    const byChore = new Map<string, Date[]>();
    for (const entry of choreHistory) {
      const arr = byChore.get(entry.choreId) ?? [];
      arr.push(entry.completedAt);
      byChore.set(entry.choreId, arr);
    }
    const result = new Map<string, number>();
    for (const chore of chores) {
      if (chore.frequency !== "weekly" && chore.frequency !== "monthly") continue;
      const dates = byChore.get(chore.id) ?? [];
      if (dates.length < 2) continue;
      // sort newest first
      const sorted = [...dates].sort((a, b) => b.getTime() - a.getTime());
      const streak = computeStreak(sorted, chore.frequency as "weekly" | "monthly");
      if (streak >= 2) result.set(chore.id, streak);
    }
    return result;
  }, [choreHistory, chores]);

  // Filter chores by person
  const filteredChores = chores.filter(chore => {
    if (view === "me") return chore.assignedTo === currentUser;
    if (view === "partner") return chore.assignedTo === partnerName;
    return true;
  });

  const activeChores = filteredChores.filter(c => !c.completed || Boolean(recentlyCompleted[c.id]));
  const completedChores = filteredChores.filter(c => c.completed && !recentlyCompleted[c.id]);
  const completedChoresCount = filteredChores.filter(c => c.completed).length;
  const overdueChores = activeChores.filter(c => c.dueDate && new Date(c.dueDate) < today);
  const upcomingChores = activeChores.filter(c => !c.dueDate || new Date(c.dueDate) >= today);
  const dueSoonCount = activeChores.filter((c) => c.dueDate && differenceInCalendarDays(new Date(c.dueDate), today) <= 2).length;

  const clearRecentCompletion = (id: string) => {
    const timeoutId = strikeTimeoutsRef.current[id];
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      delete strikeTimeoutsRef.current[id];
    }
    setRecentlyCompleted((current) => {
      if (!(id in current)) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const beginRecentCompletion = (id: string) => {
    clearRecentCompletion(id);
    setRecentlyCompleted((current) => ({
      ...current,
      [id]: { startedAt: Date.now() },
    }));
    strikeTimeoutsRef.current[id] = window.setTimeout(() => {
      clearRecentCompletion(id);
    }, STRIKE_ANIMATION_MS);
  };

  const handleToggleChore = (id: string) => {
    const chore = chores.find((entry) => entry.id === id);
    if (!chore) return;

    if (chore.completed) {
      clearRecentCompletion(id);
      toggleChore(id);
      return;
    }

    beginRecentCompletion(id);
    toggleChore(id);
  };

  const handleSuggestChores = async () => {
    // Toggle off if already showing results
    if (showSuggestions && !suggestionsLoading) {
      setShowSuggestions(false);
      return;
    }
    setShowSuggestions(true);
    setSuggestions([]);
    setAddedSuggestions(new Set());
    setSuggestionsLoading(true);
    try {
      const month = new Date().toLocaleDateString("en-GB", { month: "long" });
      const existingTitles = activeChores.map((c) => c.title);
      const result = await window.api.suggestChores(existingTitles, month);
      if (result.length === 0) {
        setShowSuggestions(false);
      } else {
        setSuggestions(result);
      }
    } catch {
      setShowSuggestions(false);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleAddSuggestion = (suggestion: string) => {
    addChore({
      title: suggestion,
      assignedTo: currentUser,
      dueDate: new Date(),
      completed: false,
      frequency: "one-time",
    });
    setAddedSuggestions((prev) => new Set([...prev, suggestion]));
  };

  const handleAddChore = () => {
    if (!newChore.title.trim()) return;
    addChore({
      title: newChore.title,
      assignedTo: newChore.assignedTo,
      dueDate: newChore.dueDate || null,
      completed: false,
      frequency: newChore.frequency,
      notes: newChore.notes || undefined,
      room: newChore.room || undefined,
    });
    setNewChore({ title: "", assignedTo: currentUser, dueDate: new Date(), frequency: "one-time", notes: "", room: "All Rooms" });
    setShowAddChore(false);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)}d ago`;
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `In ${diffDays} days`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const isOverdue = (dueDate: Date | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < today;
  };

  const getRoomIcon = (roomName: string) =>
    rooms.find(r => r.name === roomName)?.icon ??
    roomGroups.find(g => g.name === roomName)?.icon ??
    "Home";

  return (
    <>
      <AnimatedPage className="max-w-6xl mx-auto p-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-1.5">Chores</h1>
            <p className="max-w-xl text-muted-foreground leading-6">
              {activeChores.length === 0
                ? "Everything's taken care of"
                : `${activeChores.length} task${activeChores.length !== 1 ? 's' : ''} keeping the home in motion`}
              {overdueChores.length > 0 && (
                <span className="text-destructive"> · {overdueChores.length} overdue</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring}>
              <Button
                variant="outline"
                className="gap-2 border-border/60 bg-background/74"
                onClick={handleSuggestChores}
                disabled={suggestionsLoading}
              >
                <Sparkles className={`w-4 h-4 ${suggestionsLoading ? "animate-pulse text-primary" : ""}`} />
                {suggestionsLoading ? "Thinking…" : "Suggest"}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring}>
              <Button className="gap-2 px-4.5" onClick={() => setShowAddChore(true)}>
                <Plus className="w-4 h-4" />
                Add chore
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Hazel suggestions panel */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.99 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="border-primary/18 bg-primary/5 shadow-[0_16px_30px_rgba(212,121,94,0.06),inset_0_1px_0_rgba(255,255,255,0.18)]">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className={`w-4 h-4 text-primary ${suggestionsLoading ? "animate-pulse" : ""}`} />
                      <span className="text-sm font-medium">
                        {suggestionsLoading ? "Hazel is thinking…" : "Suggested for you"}
                      </span>
                    </div>
                    {!suggestionsLoading && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        transition={spring}
                        onClick={() => setShowSuggestions(false)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-background/75 hover:text-foreground transition-colors"
                        aria-label="Dismiss suggestions"
                      >
                        <X className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                  </div>

                  {suggestionsLoading ? (
                    <div className="flex flex-wrap gap-2">
                      {[120, 150, 105, 135, 115].map((w, i) => (
                        <div
                          key={i}
                          className="h-9 rounded-xl bg-muted/60 animate-pulse"
                          style={{ width: `${w}px` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2.5">
                        <AnimatePresence>
                          {suggestions.map((suggestion, i) => {
                            const added = addedSuggestions.has(suggestion);
                            return (
                              <motion.button
                                key={suggestion}
                                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                                onClick={() => !added && handleAddSuggestion(suggestion)}
                                disabled={added}
                                className={[
                                  "flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]",
                                  added
                                    ? "border-success/30 bg-success/8 text-success cursor-default"
                                    : "border-border/60 bg-background/78 hover:border-primary/35 hover:bg-background/96 text-foreground cursor-pointer",
                                ].join(" ")}
                              >
                                {added
                                  ? <Check className="w-3.5 h-3.5 flex-shrink-0" />
                                  : <Plus className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                }
                                {suggestion}
                              </motion.button>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Tap any suggestion to add it straight to your list.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 items-stretch">
          {[
            {
              icon: Clipboard,
              label: "To do",
              value: upcomingChores.length,
              sub: upcomingChores.length === 1 ? "task remaining" : "tasks remaining",
              tone: "neutral",
              delay: 0.02,
            },
            {
              icon: AlertCircle,
              label: "Needs attention",
              value: overdueChores.length,
              sub: overdueChores.length === 0 ? (dueSoonCount > 0 ? `${dueSoonCount} due soon` : "Nothing pressing") : overdueChores.length === 1 ? "task past due" : "tasks past due",
              tone: overdueChores.length > 0 ? "urgent" : dueSoonCount > 0 ? "warm" : "neutral",
              delay: 0.08,
            },
            {
              icon: CheckCircle,
              label: "Completed",
              value: completedChoresCount,
              sub: completedChoresCount === 1 ? "task done" : "tasks done",
              tone: completedChoresCount > 0 ? "positive" : "neutral",
              delay: 0.14,
            },
          ].map(({ icon: Icon, label, value, sub, tone, delay }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay, ease }}
              className="h-full"
            >
              <Card className={[
                "h-full",
                tone === "urgent" && "bg-destructive/8 border-destructive/25",
                tone === "warm" && "bg-warning/8 border-warning/25",
                tone === "positive" && "bg-success/8 border-success/25",
              ].filter(Boolean).join(" ")}>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={[
                        "flex h-9 w-9 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
                        tone === "urgent" ? "bg-destructive/12 text-destructive" : tone === "warm" ? "bg-warning/12 text-warning" : tone === "positive" ? "bg-success/12 text-success" : "bg-primary/10 text-primary",
                      ].join(" ")}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                  </div>
                  <p className={[
                    "mb-1 text-3xl font-semibold tracking-tight",
                    tone === "urgent" && "text-destructive",
                    tone === "warm" && "text-warning",
                    tone === "positive" && "text-success",
                  ].filter(Boolean).join(" ")}>
                    {value}
                  </p>
                  <p className="text-sm text-muted-foreground leading-6">{sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Person filter */}
        <div className="inline-flex w-fit items-center gap-1 rounded-[18px] border border-border/55 bg-muted/26 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
          {(
            [
              { value: "all", label: "Everyone", icon: Users },
              { value: "me", label: currentUser, icon: User },
              { value: "partner", label: partnerName, icon: User },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <motion.button
              key={value}
              type="button"
              onClick={() => setView(value)}
              whileTap={{ scale: 0.985 }}
              transition={microInteraction}
              className={[
                "flex items-center gap-1.5 rounded-[14px] px-3.5 py-2 text-sm font-medium transition-all duration-150",
                view === value
                  ? "bg-background/96 text-foreground shadow-[0_8px_18px_rgba(61,50,41,0.08)]"
                  : "text-muted-foreground hover:bg-background/42 hover:text-foreground",
              ].join(" ")}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </motion.button>
          ))}
        </div>

        {/* Loading */}
        {isChoresLoading && (
          <Card>
            <CardContent className="p-5">
              <ListSkeleton count={3} />
            </CardContent>
          </Card>
        )}

        {/* Overdue */}
        <AnimatePresence>
          {!isChoresLoading && overdueChores.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease }}
            >
              <Card className="border-destructive/25 bg-destructive/5 shadow-[0_16px_28px_rgba(199,81,70,0.06),inset_0_1px_0_rgba(255,255,255,0.14)]">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-destructive/70">Needs attention</p>
                      <h3 className="font-medium text-destructive">Overdue</h3>
                    </div>
                    <Badge variant="destructive" className="text-xs">{overdueChores.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {overdueChores.map((chore) => (
                        <ChoreRow
                          key={chore.id}
                          chore={chore}
                          overdue
                          lastCompletion={lastCompletionByChore.get(chore.id)}
                          streak={streakByChore.get(chore.id)}
                          getRoomIcon={getRoomIcon}
                          formatDate={formatDate}
                          onToggle={() => handleToggleChore(chore.id)}
                          onDelete={() => setDeleteId(chore.id)}
                          isCompleting={Boolean(chore.completed)}
                          shouldAnimateStrike={Boolean(recentlyCompleted[chore.id])}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active / upcoming */}
        {!isChoresLoading && (
          <Card className="bg-card/84">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Clipboard className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/75">Open tasks</p>
                  <h3 className="font-medium">To do</h3>
                </div>
                <Badge variant="secondary">{upcomingChores.length}</Badge>
              </div>
              <AnimatePresence>
                {isAddingChore && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-2 flex items-center gap-4 rounded-2xl border border-primary/10 bg-primary/5 p-4"
                  >
                    <div className="w-6 h-6 rounded-full border-2 border-primary/30 flex-shrink-0 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 rounded-full bg-muted animate-pulse w-40" />
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 rounded-full bg-muted animate-pulse w-20" />
                        <div className="h-2.5 rounded-full bg-muted animate-pulse w-16" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                      <span className="text-xs">Hazel is adding…</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {(isAddingChore ? upcomingChores.slice(1) : upcomingChores).map((chore) => (
                    <ChoreRow
                      key={chore.id}
                      chore={chore}
                      lastCompletion={lastCompletionByChore.get(chore.id)}
                      streak={streakByChore.get(chore.id)}
                      getRoomIcon={getRoomIcon}
                      formatDate={formatDate}
                      onToggle={() => handleToggleChore(chore.id)}
                      onDelete={() => setDeleteId(chore.id)}
                      isCompleting={Boolean(chore.completed)}
                      shouldAnimateStrike={Boolean(recentlyCompleted[chore.id])}
                    />
                  ))}
                </AnimatePresence>
                {upcomingChores.length === 0 && overdueChores.length === 0 && (
                  <EmptyState
                    icon={Clipboard}
                    title="All caught up"
                    description="No chores right now. Add one to keep the home running smoothly."
                    action={{ label: "Add a chore", onClick: () => setShowAddChore(true) }}
                  />
                )}
                {upcomingChores.length === 0 && overdueChores.length > 0 && (
                  <p className="text-sm text-center text-muted-foreground py-4">
                    No upcoming tasks — just the overdue ones above.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed */}
        <AnimatePresence>
          {completedChores.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease }}
            >
              <Card className="bg-card/72 border-border/55">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/72">Resolved</p>
                      <h3 className="font-medium text-muted-foreground">Completed</h3>
                    </div>
                    <Badge variant="secondary">{completedChores.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {completedChores.map((chore) => (
                        <ChoreRow
                          key={chore.id}
                          chore={chore}
                          completed
                          lastCompletion={lastCompletionByChore.get(chore.id)}
                          streak={streakByChore.get(chore.id)}
                          getRoomIcon={getRoomIcon}
                          formatDate={formatDate}
                          onToggle={() => handleToggleChore(chore.id)}
                          onDelete={() => setDeleteId(chore.id)}
                          isCompleting={Boolean(chore.completed)}
                          shouldAnimateStrike={false}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </AnimatedPage>

      {/* Add Chore Modal */}
      <Dialog open={showAddChore} onOpenChange={setShowAddChore}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add chore</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.04, ease }}
              className="space-y-2"
            >
              <Label htmlFor="chore-title">Task</Label>
              <Input
                id="chore-title"
                placeholder="e.g. Vacuum the living room, take out the bins…"
                value={newChore.title}
                onChange={(e) => setNewChore({ ...newChore, title: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAddChore()}
                autoFocus
              />
            </motion.div>

            {/* Assigned to */}
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.08, ease }}
              className="space-y-2"
            >
              <Label>Assigned to</Label>
              <div className="grid grid-cols-2 gap-2">
                {[currentUser, partnerName].map((person) => (
                  <button
                    key={person}
                    type="button"
                    onClick={() => setNewChore({ ...newChore, assignedTo: person })}
                    className={[
                      "flex items-center gap-2.5 rounded-xl border p-3 text-sm text-left transition-all duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
                      newChore.assignedTo === person
                        ? "border-primary/30 bg-primary/8 text-primary"
                        : "border-border/60 bg-background/70 hover:bg-muted/50 text-foreground",
                    ].join(" ")}
                  >
                    <div className={[
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 transition-colors duration-150",
                      newChore.assignedTo === person ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    ].join(" ")}>
                      {person.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{person}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Planned for */}
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.12, ease }}
              className="space-y-2"
            >
              <Label>Planned for</Label>
              <DatePicker
                value={newChore.dueDate}
                onChange={(d) => setNewChore({ ...newChore, dueDate: d })}
                placeholder="Pick a date"
              />
            </motion.div>

            {/* Frequency */}
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.16, ease }}
              className="space-y-2"
            >
              <Label>Frequency</Label>
              <div className="grid grid-cols-4 gap-2">
                {FREQUENCY_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setNewChore({ ...newChore, frequency: value })}
                    className={[
                      "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-sm transition-all duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
                      newChore.frequency === value
                        ? "border-primary/30 bg-primary/8 text-primary"
                        : "border-border/60 bg-background/70 hover:bg-muted/50 text-muted-foreground",
                    ].join(" ")}
                  >
                    <span className="font-medium text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Room picker */}
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.2, ease }}
              className="space-y-3"
            >
              <Label className="flex items-center gap-1.5">
                <DoorOpen className="w-3.5 h-3.5 text-muted-foreground" />
                Room
              </Label>
              {rooms.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No rooms yet —{" "}
                  <span className="text-primary">add some in Settings → Rooms</span>
                </p>
              ) : (
                <div className="space-y-3">
                  {roomGroups.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Groups</p>
                      <div className="flex flex-wrap gap-1.5">
                        {roomGroups.map((group) => (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() =>
                              setNewChore({ ...newChore, room: newChore.room === group.name ? "" : group.name })
                            }
                            className={[
                              "flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-sm transition-all duration-150",
                              newChore.room === group.name
                                ? "border-primary/30 bg-primary/8 text-primary"
                                : "border-border/60 bg-background/70 hover:bg-muted/50 text-foreground",
                            ].join(" ")}
                          >
                            <RoomIcon iconName={group.icon} className="w-3.5 h-3.5" />
                            {group.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {roomGroups.length > 0 && (
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Rooms</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {rooms.map((room) => (
                        <button
                          key={room.name}
                          type="button"
                          onClick={() =>
                            setNewChore({ ...newChore, room: newChore.room === room.name ? "" : room.name })
                          }
                          className={[
                            "flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-sm transition-all duration-150",
                            newChore.room === room.name
                              ? "border-primary/30 bg-primary/8 text-primary"
                              : "border-border/60 bg-background/70 hover:bg-muted/50 text-foreground",
                          ].join(" ")}
                        >
                          <RoomIcon iconName={room.icon} className="w-3.5 h-3.5" />
                          {room.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Notes */}
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.24, ease }}
              className="space-y-2"
            >
              <Label htmlFor="chore-notes">
                Notes <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="chore-notes"
                placeholder="Any extra details…"
                value={newChore.notes}
                onChange={(e) => setNewChore({ ...newChore, notes: e.target.value })}
                rows={2}
              />
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.28, ease }}
              className="flex gap-2 justify-end pt-1"
            >
              <Button variant="outline" onClick={() => setShowAddChore(false)}>Cancel</Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring}>
                <Button onClick={handleAddChore} disabled={!newChore.title.trim() || !newChore.dueDate || !newChore.room}>
                  Add chore
                </Button>
              </motion.div>
            </motion.div>

          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chore?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this chore. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteChore(deleteId);
                setDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── ChoreRow ──────────────────────────────────────────────────────────────────

interface ChoreRowProps {
  chore: {
    id: string;
    title: string;
    assignedTo: string;
    dueDate: Date | null;
    frequency?: string | null;
    room?: string | null;
    completedAt?: Date | null;
    completed: boolean;
  };
  overdue?: boolean;
  completed?: boolean;
  lastCompletion?: { userName: string; completedAt: Date };
  streak?: number;
  isCompleting?: boolean;
  shouldAnimateStrike?: boolean;
  getRoomIcon: (name: string) => string;
  formatDate: (date: Date | null) => string;
  onToggle: () => void;
  onDelete: () => void;
}

const ChoreRow = React.forwardRef<HTMLDivElement, ChoreRowProps>(function ChoreRow(
  { chore, overdue, completed, lastCompletion, streak, isCompleting, shouldAnimateStrike, getRoomIcon, formatDate, onToggle, onDelete }: ChoreRowProps,
  ref
) {
  const spring = { duration: 0.16, ease: [0.22, 1, 0.36, 1] as const }
  const isUnassigned = !chore.assignedTo || chore.assignedTo === "Unknown";

  // Human-readable "last done" label for the history row
  const lastDoneLabel = (() => {
    if (!lastCompletion) return null;
    const days = differenceInCalendarDays(new Date(), lastCompletion.completedAt);
    if (days === 0) return `${lastCompletion.userName} · today`;
    if (days === 1) return `${lastCompletion.userName} · yesterday`;
    if (days < 7) return `${lastCompletion.userName} · ${days}d ago`;
    if (days < 30) return `${lastCompletion.userName} · ${Math.floor(days / 7)}w ago`;
    return `${lastCompletion.userName} · ${Math.floor(days / 30)}mo ago`;
  })();

  return (
    <motion.div
      ref={ref}
      layout
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={listItemVariants}
      className={[
        "group flex items-start gap-4 rounded-[20px] border p-4 transition-[background-color,border-color,box-shadow]",
        completed
          ? "border-success/16 bg-success/5"
          : isCompleting
            ? "border-success/20 bg-success/7 hover:bg-success/8 hover:shadow-[0_10px_20px_rgba(127,160,135,0.05)]"
          : overdue
            ? "border-destructive/18 bg-destructive/7 hover:bg-destructive/10 hover:shadow-[0_10px_20px_rgba(199,81,70,0.05)]"
            : "border-border/45 bg-background/46 hover:bg-background/74 hover:shadow-[0_10px_20px_rgba(61,50,41,0.04)]",
      ].join(" ")}
    >
      {/* Complete button */}
      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        transition={microInteraction}
        className={[
          "mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors",
          completed
            ? "border-success bg-success"
            : overdue
              ? "border-destructive hover:bg-destructive/10"
              : "border-primary/70 hover:bg-primary/10",
        ].join(" ")}
      >
        <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={spring}
            >
              <CheckCircle className="w-4 h-4 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          <h4 className={`font-medium leading-5 relative inline-block ${completed || isCompleting ? "text-muted-foreground" : ""}`}>
            {chore.title}
            {(completed || isCompleting) && (
              <motion.span
                initial={shouldAnimateStrike ? { width: "0%" } : false}
                animate={{ width: "100%" }}
                transition={{ duration: 0.72, ease: [0.2, 0.8, 0.2, 1] }}
                className="absolute left-0 top-1/2 h-[1.5px] bg-muted-foreground/50"
              />
            )}
          </h4>
          {chore.frequency && chore.frequency !== "one-time" && (
            <Badge variant="outline" className="text-xs gap-1 bg-background/78 text-muted-foreground">
              <RefreshCw className="w-2.5 h-2.5" />
              {chore.frequency}
            </Badge>
          )}
          {/* Streak badge */}
          {streak && streak >= 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Badge className="text-xs gap-1 bg-warning/15 text-warning border-warning/30 hover:bg-warning/20">
                <Flame className="w-2.5 h-2.5" />
                {streak} in a row
              </Badge>
            </motion.div>
          )}
        </div>

        <div className={`flex items-center gap-3 text-[12px] flex-wrap transition-colors duration-200 ${isCompleting ? 'text-muted-foreground/62' : 'text-muted-foreground/84'}`}>
          {/* Assignee */}
          {isUnassigned ? (
            <div className="flex items-center gap-1.5 text-warning">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-warning/15">
                <UserX className="w-2.5 h-2.5 text-warning" />
              </div>
              <span className="font-medium">Unassigned</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/15">
                <span className="text-[9px] font-medium text-primary leading-none">
                  {chore.assignedTo.charAt(0).toUpperCase()}
                </span>
              </div>
              <span>{chore.assignedTo}</span>
            </div>
          )}

          {/* Room */}
          {chore.room && (
            <>
              <span className="text-border">·</span>
              <div className="flex items-center gap-1">
                <RoomIcon iconName={getRoomIcon(chore.room)} className="w-3 h-3" />
                <span>{chore.room}</span>
              </div>
            </>
          )}

          {/* Due date */}
          {chore.dueDate && (
            <>
              <span className="text-border">·</span>
              <div className={`flex items-center gap-1 ${overdue ? "text-destructive font-medium" : ""}`}>
                {overdue && <AlertCircle className="w-3 h-3" />}
                <CalendarIcon className="w-3 h-3" />
                <span>{formatDate(chore.dueDate)}</span>
              </div>
            </>
          )}

          {/* Completed at */}
          {completed && chore.completedAt && (
            <>
              <span className="text-border">·</span>
              <span>Done {formatDate(chore.completedAt)}</span>
            </>
          )}

          {/* Last completion history — shown on active (not currently-completed) chores */}
          {!completed && lastDoneLabel && (
            <>
              <span className="text-border">·</span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="text-[11px] text-muted-foreground/68 italic"
              >
                {lastDoneLabel}
              </motion.span>
            </>
          )}
          {isCompleting && (
            <>
              <span className="text-border">·</span>
              <span className="text-[11px] text-success/80">completed</span>
            </>
          )}
        </div>
      </div>

      {/* Delete */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={onDelete}
        >
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </Button>
      </motion.div>
    </motion.div>
  );
});
