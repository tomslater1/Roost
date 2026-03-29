import { useState, useEffect, useRef } from "react";
import { format, parseISO, differenceInCalendarDays, isToday, isTomorrow } from "date-fns";
import { ShoppingCart, Plus, Trash2, X, ChevronDown, ChevronRight, CheckCircle2, Sparkles, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { DatePicker } from "../components/ui/DatePicker";
import { useApp } from "../context/AppContext";
import { useHome } from "../hooks/useHome";
import { AnimatedPage } from "../components/AnimatedPage";
import { EmptyState } from "../components/EmptyState";
import { ListSkeleton } from "../components/LoadingSkeleton";
import { listItemVariants, categoryExpandVariants } from "../utils/animations";
import { SHOPPING_CATEGORIES } from "../lib/shopping-categories";

const interactionTransition = { duration: 0.12, ease: [0.22, 1, 0.36, 1] as const };
const STRIKE_ANIMATION_MS = 900;

interface ShoppingStrikeState {
  startedAt: number;
}

export function Shopping() {
  const { shoppingItems, isAddingShoppingItem, addShoppingItem, toggleShoppingItem, deleteShoppingItem, clearCompletedItems, isShoppingLoading } = useApp();
  const { home, updateNextShopDate } = useHome();
  const [newItem, setNewItem] = useState("");
  const [queue, setQueue] = useState<string[]>([]);
  const [recentlyCompleted, setRecentlyCompleted] = useState<Record<string, ShoppingStrikeState>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const strikeTimeoutsRef = useRef<Record<string, number>>({});
  // Track collapsed (not expanded) so any new category from Hazel is open by default
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      Object.values(strikeTimeoutsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  const shopDate = home?.next_shop_date ? parseISO(home.next_shop_date) : undefined;

  // Compute a human-readable countdown + badge colour
  const shopCountdown = (() => {
    if (!shopDate) return null;
    if (isToday(shopDate)) return { label: "Shopping today", variant: "warning" as const };
    if (isTomorrow(shopDate)) return { label: "Shopping tomorrow", variant: "warning" as const };
    const days = differenceInCalendarDays(shopDate, new Date());
    if (days < 0) return { label: "Shop date passed", variant: "destructive" as const };
    return { label: `Shopping in ${days} days`, variant: "primary" as const };
  })();

  const toggleCategory = (category: string) => {
    const next = new Set(collapsedCategories);
    if (next.has(category)) {
      next.delete(category);
    } else {
      next.add(category);
    }
    setCollapsedCategories(next);
  };

  // Drain the queue one item at a time as each Hazel call completes
  useEffect(() => {
    if (isAddingShoppingItem || queue.length === 0) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    addShoppingItem(next);
  }, [isAddingShoppingItem, queue.length]);

  const handleAddItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    // If Hazel is busy, queue it so the user doesn't have to wait
    if (isAddingShoppingItem) {
      setQueue(prev => [...prev, trimmed]);
    } else {
      addShoppingItem(trimmed);
    }
    setNewItem("");
    inputRef.current?.focus();
  };

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

  const handleToggleShoppingItem = (id: string) => {
    const item = shoppingItems.find((entry) => entry.id === id);
    if (!item) return;

    if (item.checked) {
      clearRecentCompletion(id);
    } else {
      beginRecentCompletion(id);
    }

    toggleShoppingItem(id);
  };

  // Group items by category
  const groupedItems = shoppingItems.reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof shoppingItems>);

  // Sort categories in supermarket aisle order; "Other" always last
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    const ai = SHOPPING_CATEGORIES.indexOf(a as typeof SHOPPING_CATEGORIES[number]);
    const bi = SHOPPING_CATEGORIES.indexOf(b as typeof SHOPPING_CATEGORIES[number]);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const totalItems = shoppingItems.filter(item => !item.checked).length;
  const completedItemsCount = shoppingItems.filter(item => item.checked).length;
  const totalCategories = sortedCategories.length;

  return (
    <AnimatedPage className="max-w-6xl mx-auto p-6 space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Shopping list</h1>
          <p className="max-w-xl text-muted-foreground leading-6">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} to buy • Shared live for both of you
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <DatePicker
            value={shopDate}
            onChange={(date) => updateNextShopDate(date ? format(date, 'yyyy-MM-dd') : null)}
            placeholder="Set next shop date"
            align="end"
            className="w-auto"
          />
          <AnimatePresence>
            {shopCountdown && (
              <motion.div
                key="shop-countdown"
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={[
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
                  shopCountdown.variant === "warning" && "bg-warning/15 text-warning",
                  shopCountdown.variant === "destructive" && "bg-destructive/10 text-destructive",
                  shopCountdown.variant === "primary" && "bg-primary/10 text-primary border-primary/15",
                ].filter(Boolean).join(" ")}
              >
                <Calendar className="w-3 h-3" />
                {shopCountdown.label}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Add Section */}
      <Card className="border-border/60 bg-card/90 shadow-[0_20px_42px_rgba(61,50,41,0.06),inset_0_1px_0_rgba(255,255,255,0.22)]">
        <CardContent className="p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                  <ShoppingCart className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/85">Quick add</span>
                  <span className="font-medium">Add to list</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-6">Hazel will tidy the name and place it in the right aisle for you.</p>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">{totalCategories > 0 ? `${totalCategories} categories` : 'Fresh list'}</Badge>
          </div>
          
          <div className="rounded-[20px] border border-border/45 bg-background/58 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
            <div className="flex gap-3">
            <Input
              ref={inputRef}
              placeholder="What do you need?"
              className="h-11 flex-1 border-border/40 bg-transparent shadow-none focus-visible:bg-background/70"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem() }}
              autoFocus
            />
            <Button className="h-11 gap-2 px-4.5" onClick={handleAddItem}>
              <Plus className="w-4 h-4" />
              Add
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shopping List by Category */}
      <Card className="bg-card/82">
        <CardContent className="p-5">
          <AnimatePresence initial={false}>
            {isAddingShoppingItem && (
              <motion.div
                key="hazel-processing"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="mb-3 flex items-center gap-3 rounded-2xl border border-primary/10 bg-primary/5 px-3.5 py-3"
              >
                <div className="w-4 h-4 rounded bg-muted animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 rounded-full bg-muted animate-pulse w-28" />
                  <div className="h-2 rounded-full bg-muted animate-pulse w-16" />
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                  <span className="text-xs">Hazel is tidying…</span>
                </div>
              </motion.div>
            )}
            {queue.map((item, i) => (
              <motion.div
                key={`queued-${i}-${item}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="mb-2 flex items-center gap-3 rounded-2xl border border-border/45 bg-background/55 px-3 py-2.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 flex-shrink-0" />
                <span className="text-sm text-muted-foreground truncate flex-1">{item}</span>
                <span className="text-xs text-muted-foreground/60 flex-shrink-0">queued</span>
              </motion.div>
            ))}
          </AnimatePresence>

          {isShoppingLoading && <ListSkeleton count={5} />}
          {!isShoppingLoading && Object.keys(groupedItems).length === 0 && shoppingItems.length === 0 && (
            <EmptyState
              icon={ShoppingCart}
              title="Your list is empty"
              description="Add the first item above and it'll appear here, grouped by category."
            />
          )}
          {!isShoppingLoading && shoppingItems.length > 0 && Object.keys(groupedItems).length === 0 && (
            <EmptyState
              icon={CheckCircle2}
              title="Everything’s checked off"
              description="Your list is complete. Items stay in their aisle now, so you can still review what was picked up."
              action={completedItemsCount > 0 ? { label: "Clear completed", onClick: clearCompletedItems } : undefined}
            />
          )}
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80">By aisle</p>
              <h2 className="mt-1 text-lg font-medium tracking-tight">What you still need</h2>
            </div>
            <Badge variant="outline" className="hidden sm:inline-flex bg-background/70">{totalItems} active</Badge>
          </div>

          <div className="space-y-3">
            {sortedCategories.map((category) => { const items = groupedItems[category]; return (
              <div key={category} className="rounded-[22px] border border-border/50 bg-background/38 px-2 py-2 shadow-[0_8px_20px_rgba(61,50,41,0.03),inset_0_1px_0_rgba(255,255,255,0.14)]">
                {/* Category header */}
                <motion.button
                  onClick={() => toggleCategory(category)}
                  whileHover={{ y: -0.5 }}
                  whileTap={{ scale: 0.995 }}
                  transition={interactionTransition}
                  className="flex w-full items-center gap-2 rounded-[18px] px-3.5 py-3 transition-colors hover:bg-background/72"
                >
                  {!collapsedCategories.has(category) ? (
                    <ChevronDown className="w-4 h-4 text-primary" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-primary" />
                  )}
                  <div>
                    <span className="block text-left font-medium">{category}</span>
                    <span className="block text-left text-[11px] text-muted-foreground">{items.length === 1 ? '1 item' : `${items.length} items`}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Badge variant="secondary" className="min-w-6 justify-center px-2.5">{items.length}</Badge>
                  </div>
                </motion.button>

                {/* Items in category */}
                {!collapsedCategories.has(category) && (
                  <motion.div 
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    variants={categoryExpandVariants}
                    className="mt-0.5 mb-1 space-y-1.5 overflow-hidden px-2 pb-1"
                  >
                    <AnimatePresence mode="popLayout">
                      {items.map((item) => {
                        const isAnimatingCompletion = Boolean(recentlyCompleted[item.id]);
                        const isCompleted = item.checked;
                        return (
                        <motion.div 
                          key={item.id} 
                          layout
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          whileHover={{ y: -1 }}
                          variants={listItemVariants}
                          className={[
                            "group flex items-center gap-3 rounded-[18px] border border-transparent bg-background/20 px-3.5 py-3.5 transition-[background-color,border-color,box-shadow] hover:border-border/45 hover:bg-background/80 hover:shadow-[0_10px_18px_rgba(61,50,41,0.04)]",
                            isCompleted && "border-success/18 bg-success/6 hover:bg-success/7",
                          ].filter(Boolean).join(" ")}
                        >
                          <Checkbox 
                            id={item.id} 
                            className="mt-0.5" 
                            checked={item.checked}
                            onCheckedChange={() => handleToggleShoppingItem(item.id)}
                          />
                          <label htmlFor={item.id} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <span className={[
                                "relative inline-block text-sm font-medium leading-5 transition-colors duration-200",
                                isCompleted && "text-muted-foreground/78",
                              ].filter(Boolean).join(" ")}>
                                {item.name}
                                {isCompleted && (
                                  <motion.span
                                    initial={isAnimatingCompletion ? { width: "0%" } : false}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 0.72, ease: [0.2, 0.8, 0.2, 1] }}
                                    className="absolute left-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-muted-foreground/60"
                                  />
                                )}
                              </span>
                              {item.quantity && (
                                <Badge variant="outline" className={`px-2 py-0.5 text-[10px] bg-background/75 ${isCompleted ? 'text-muted-foreground/70 border-border/45' : ''}`}>× {item.quantity}</Badge>
                              )}
                            </div>
                            <p className={[
                              "mt-1 text-[11px] transition-colors duration-200",
                              isCompleted ? "text-muted-foreground/58" : "text-muted-foreground/78",
                            ].join(" ")}>Added by {item.addedBy}{isCompleted ? ' · completed' : ''}</p>
                          </label>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => deleteShoppingItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </motion.div>
                      )})}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            ); })}
          </div>
        </CardContent>
      </Card>
    </AnimatedPage>
  );
}