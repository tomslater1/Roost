import { useState, useEffect, useRef } from "react";
import { format, parseISO, differenceInCalendarDays, isToday, isTomorrow } from "date-fns";
import { ShoppingCart, Plus, Trash2, X, ChevronDown, ChevronRight, CheckCircle2, Sparkles, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "../components/ui/card";
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


export function Shopping() {
  const { shoppingItems, isAddingShoppingItem, addShoppingItem, toggleShoppingItem, deleteShoppingItem, clearCompletedItems, isShoppingLoading } = useApp();
  const { home, updateNextShopDate } = useHome();
  const [newItem, setNewItem] = useState("");
  const [queue, setQueue] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track collapsed (not expanded) so any new category from Hazel is open by default
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

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

  // Group items by category
  const groupedItems = shoppingItems.reduce((acc, item) => {
    if (!item.checked) {
      const cat = item.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
    }
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

  const doneItems = shoppingItems.filter(item => item.checked);
  const totalItems = shoppingItems.filter(item => !item.checked).length;

  return (
    <AnimatedPage className="max-w-6xl mx-auto p-6 space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Shopping list</h1>
          <p className="text-muted-foreground">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} to buy • Updates live for both of you
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
                  "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
                  shopCountdown.variant === "warning" && "bg-warning/15 text-warning",
                  shopCountdown.variant === "destructive" && "bg-destructive/10 text-destructive",
                  shopCountdown.variant === "primary" && "bg-primary/10 text-primary",
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
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-primary/8 to-accent/10">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <span className="font-medium">Add to list</span>
          </div>
          
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              placeholder="What do you need?"
              className="flex-1 bg-background"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem() }}
              autoFocus
            />
            <Button className="gap-2" onClick={handleAddItem}>
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Hazel will tidy the name and pick a category for you
          </p>
        </CardContent>
      </Card>

      {/* Shopping List by Category */}
      <Card>
        <CardContent className="p-5">
          <AnimatePresence initial={false}>
            {isAddingShoppingItem && (
              <motion.div
                key="hazel-processing"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-primary/5 border border-primary/10 mb-2"
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
                className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/40 mb-1.5"
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
          {!isShoppingLoading && Object.keys(groupedItems).length === 0 && doneItems.length > 0 && (
            <EmptyState
              icon={CheckCircle2}
              title="All done!"
              description="Everything's been picked up. Clear completed items or add more below."
              action={{ label: "Clear completed", onClick: clearCompletedItems }}
            />
          )}
          <div className="space-y-1">
            {sortedCategories.map((category) => { const items = groupedItems[category]; return (
              <div key={category}>
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex items-center gap-2 w-full py-3 px-3 hover:bg-muted/50 rounded-xl transition-colors"
                >
                  {!collapsedCategories.has(category) ? (
                    <ChevronDown className="w-4 h-4 text-primary" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-primary" />
                  )}
                  <span className="font-medium">{category}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{items.length}</span>
                  </div>
                </button>

                {/* Items in category */}
                {!collapsedCategories.has(category) && (
                  <motion.div 
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    variants={categoryExpandVariants}
                    className="space-y-1 mt-1 mb-3 ml-3 overflow-hidden"
                  >
                    <AnimatePresence mode="popLayout">
                      {items.map((item) => (
                        <motion.div 
                          key={item.id} 
                          layout
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={listItemVariants}
                          className="flex items-center gap-3 group py-2 px-3 hover:bg-muted/30 rounded-lg transition-colors"
                        >
                          <Checkbox 
                            id={item.id} 
                            className="mt-0.5" 
                            checked={item.checked}
                            onCheckedChange={() => toggleShoppingItem(item.id)}
                          />
                          <label htmlFor={item.id} className="flex-1 cursor-pointer">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm">{item.name}</span>
                              {item.quantity && (
                                <span className="text-xs text-muted-foreground">× {item.quantity}</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">Added by {item.addedBy}</p>
                          </label>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteShoppingItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            ); })}
          </div>

          {/* Done section */}
          {doneItems.length > 0 && (
            <div className="border-t border-border pt-5 mt-5">
              <div className="flex items-center justify-between mb-4 px-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-success/20 dark:bg-success/30 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-success" />
                  </div>
                  <span className="font-medium text-muted-foreground">
                    Done ({doneItems.length})
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={clearCompletedItems}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear all
                </Button>
              </div>
              
              <div className="space-y-1">
                <AnimatePresence mode="popLayout">
                  {doneItems.map((item) => (
                    <motion.div 
                      key={item.id} 
                      layout
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={listItemVariants}
                      className="flex items-center gap-3 group py-2 px-3 hover:bg-muted/30 rounded-lg transition-colors"
                    >
                      <Checkbox 
                        id={`done-${item.id}`} 
                        checked 
                        className="mt-0.5" 
                        onCheckedChange={() => toggleShoppingItem(item.id)}
                      />
                      <label htmlFor={`done-${item.id}`} className="flex-1 cursor-pointer relative">
                        <span className="text-sm text-muted-foreground relative inline-block">
                          {item.name}
                          <motion.span
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute left-0 top-1/2 h-[1.5px] bg-muted-foreground/60"
                          />
                        </span>
                      </label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteShoppingItem(item.id)}
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AnimatedPage>
  );
}