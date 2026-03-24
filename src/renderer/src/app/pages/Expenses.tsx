import { useState } from "react";
import { useSearchParams } from "react-router";
import { ArrowUpRight, Wallet, Receipt, Trash2, Handshake, Plus, Filter, Repeat, User, Users, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useApp } from "../context/AppContext";
import { CategoryIcon } from "../components/CategoryIcon";
import { getCategoryMeta, COLOR_CLASSES } from "@/lib/categories";
import { SettleUpModal } from "../components/SettleUpModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { DatePicker } from "../components/ui/DatePicker";
import { Switch } from "../components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { AnimatedPage } from "../components/AnimatedPage";
import { EmptyState } from "../components/EmptyState";
import { ListSkeleton } from "../components/LoadingSkeleton";
import { listItemVariants } from "../utils/animations";

const ease = [0.43, 0.13, 0.23, 0.96] as const
const spring = { type: "spring" as const, stiffness: 400, damping: 17 }

export function Expenses() {
  const { expenses, currentUser, partnerName, addExpense, deleteExpense, getBalance, settlements, allCategories, isExpensesLoading, isAddingExpense } = useApp();
  const [searchParams] = useSearchParams();

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettleUp, setShowSettleUp] = useState(false);
  const [filterCategory, setFilterCategory] = useState(searchParams.get("category") ?? "all");
  const [filterPayer, setFilterPayer] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Add expense form state
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    category: "" as string,
    payer: currentUser,
    date: new Date(),
    splitType: "shared" as "shared" | "personal",
    isRecurring: false,
    interval: "Monthly",
  });

  const balance = getBalance();

  // Filter expenses
  const filteredExpenses = expenses.filter(exp => {
    if (filterCategory !== "all" && exp.category !== filterCategory) return false;
    if (filterPayer !== "all" && exp.payer !== filterPayer) return false;
    return true;
  });

  // Sort by date
  const sortedExpenses = [...filteredExpenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate totals
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const sharedSpent = expenses.filter(e => e.splitType === "shared").reduce((sum, e) => sum + e.amount, 0);
  const personalSpent = expenses.filter(e => e.splitType === "personal" && e.payer === currentUser).reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = () => {
    if (!newExpense.title.trim() || !newExpense.amount) return;

    addExpense({
      title: newExpense.title,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category || undefined,
      payer: newExpense.payer,
      date: newExpense.date,
      type: newExpense.isRecurring ? "recurring" : "one-off",
      splitType: newExpense.splitType,
      interval: newExpense.isRecurring ? newExpense.interval : undefined,
      nextDue: newExpense.isRecurring ? calculateNextDue(newExpense.date, newExpense.interval) : undefined,
    });

    setNewExpense({
      title: "",
      amount: "",
      category: "",
      payer: currentUser,
      date: new Date(),
      splitType: "shared",
      isRecurring: false,
      interval: "Monthly",
    });
    setShowAddExpense(false);
  };

  const calculateNextDue = (fromDate: Date, interval: string): Date => {
    const next = new Date(fromDate);
    if (interval === "Weekly") {
      next.setDate(next.getDate() + 7);
    } else if (interval === "Monthly") {
      next.setMonth(next.getMonth() + 1);
    } else if (interval === "Yearly") {
      next.setFullYear(next.getFullYear() + 1);
    }
    return next;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // allCategories includes built-ins + any custom categories the household has added

  return (
    <>
      <AnimatedPage className="max-w-6xl mx-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Expenses</h1>
            <p className="text-muted-foreground">
              Track shared and personal spending
            </p>
          </div>
          <Button className="gap-2" onClick={() => setShowAddExpense(true)}>
            <Plus className="w-4 h-4" />
            Add expense
          </Button>
        </div>

        {/* Balance + Quick Stats */}
        <div className="grid grid-cols-3 gap-5 items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.02, ease }}
            className="h-full"
          >
          <Card className={`h-full ${
            balance.amount === 0
              ? ""
              : balance.oweType === "owed"
                ? "bg-success/15 border-success/40"
                : "bg-destructive/15 border-destructive/40"
          }`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className={`w-5 h-5 ${
                    balance.amount === 0
                      ? "text-muted-foreground"
                      : balance.oweType === "owed"
                        ? "text-success"
                        : "text-destructive"
                  }`} />
                  <span className="font-medium">Balance</span>
                </div>
                {balance.amount > 0 && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    balance.oweType === "owed"
                      ? "bg-secondary/30 text-secondary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {balance.oweType === "owed" ? "You're owed" : "You owe"}
                  </span>
                )}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <p className="text-4xl font-semibold mb-1">
                  £{balance.amount.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {balance.amount === 0
                    ? "Nothing owed either way"
                    : balance.oweType === "owed"
                      ? `${balance.person} owes you`
                      : `You owe ${balance.person}`}
                </p>
              </motion.div>
              <AnimatePresence mode="wait">
                {balance.amount > 0 ? (
                  <motion.div
                    key="settle-btn"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => setShowSettleUp(true)}
                    >
                      <Handshake className="w-4 h-4" />
                      Settle up
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="settled"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground"
                  >
                    <Check className="w-4 h-4 text-[#7fa087]" />
                    All settled up
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08, ease }}
            className="h-full"
          >
            <Card className="h-full">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="w-5 h-5 text-primary" />
                  <span className="font-medium">Total Spent</span>
                </div>
                <p className="text-3xl font-semibold mb-2">£{totalSpent.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  {expenses.length} {expenses.length === 1 ? "expense" : "expenses"} logged
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.14, ease }}
            className="h-full"
          >
            <Card className="h-full">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ArrowUpRight className="w-5 h-5 text-primary" />
                  <span className="font-medium">Your Share</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Shared</p>
                    <p className="text-2xl font-semibold">£{(sharedSpent / 2).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Personal</p>
                    <p className="text-2xl font-semibold">£{personalSpent.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {allCategories.map(cat => (
                    <SelectItem key={cat.name} value={cat.name}>
                      <span className="flex items-center gap-2">
                        <CategoryIcon category={cat} className="w-3.5 h-3.5" />
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPayer} onValueChange={setFilterPayer}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Paid by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payers</SelectItem>
                  <SelectItem value={currentUser}>{currentUser}</SelectItem>
                  <SelectItem value={partnerName}>{partnerName}</SelectItem>
                </SelectContent>
              </Select>

              {(filterCategory !== "all" || filterPayer !== "all") && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setFilterCategory("all");
                    setFilterPayer("all");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <h3 className="font-medium">All Expenses</h3>
          </CardHeader>
          <CardContent>
            {isExpensesLoading && <ListSkeleton count={4} />}
            <AnimatePresence>
              {isAddingExpense && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-xl mb-2"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 rounded-full bg-muted animate-pulse w-36" />
                      <div className="h-5 rounded-full bg-muted animate-pulse w-14" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 rounded-full bg-muted animate-pulse w-20" />
                      <div className="h-2.5 rounded-full bg-muted animate-pulse w-16" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right space-y-1.5">
                      <div className="h-6 rounded-full bg-muted animate-pulse w-16 ml-auto" />
                      <div className="h-2.5 rounded-full bg-muted animate-pulse w-24" />
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                      <span className="text-xs">Hazel is logging…</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {!isExpensesLoading && expenses.length === 0 && (
              <EmptyState
                icon={Receipt}
                title="No expenses yet"
                description="Add your first shared expense and it'll appear here."
                action={{ label: "Add expense", onClick: () => setShowAddExpense(true) }}
              />
            )}
            {!isExpensesLoading && expenses.length > 0 && sortedExpenses.length === 0 && (
              <EmptyState
                icon={Filter}
                title="No matching expenses"
                description="Try adjusting your filters to see more results."
              />
            )}
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {sortedExpenses.map((expense) => (
                  <motion.div 
                    key={expense.id}
                    layout
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={listItemVariants}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium">{expense.title}</h4>
                        {expense.type === "recurring" && (
                          <Badge variant="outline" className="gap-1">
                            <Repeat className="w-3 h-3" />
                            {expense.interval}
                          </Badge>
                        )}
                        <Badge variant={expense.splitType === "shared" ? "default" : "secondary"}>
                          {expense.splitType}
                        </Badge>
                        {expense.category && (() => {
                          const cat = getCategoryMeta(expense.category, allCategories);
                          const colors = COLOR_CLASSES[cat.color] ?? COLOR_CLASSES.slate;
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                              <CategoryIcon category={cat} className="w-3 h-3" />
                              {cat.name}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {expense.payer}
                        </div>
                        <span>•</span>
                        <span>{formatDate(expense.date)}</span>
                        {expense.nextDue && (
                          <>
                            <span>•</span>
                            <span>Next: {formatDate(expense.nextDue)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-semibold">£{expense.amount.toFixed(2)}</p>
                        {expense.splitType === "shared" && (
                          <p className="text-sm text-muted-foreground">
                            Your share: £{(expense.amount / 2).toFixed(2)}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setDeleteId(expense.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Settlement History */}
        {settlements.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Handshake className="w-5 h-5 text-primary" />
                <h3 className="font-medium">Settlement History</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {settlements.map((settlement) => (
                    <motion.div 
                      key={settlement.id}
                      layout
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={listItemVariants}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                    >
                      <div>
                        <p className="font-medium mb-1">
                          {settlement.from} paid {settlement.to}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(settlement.date)}
                          {settlement.note && ` • ${settlement.note}`}
                        </p>
                      </div>
                      <p className="text-xl font-semibold">
                        £{settlement.amount.toFixed(2)}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        )}
      </AnimatedPage>

      {/* Add Expense Modal */}
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05, ease }}
              className="space-y-2"
            >
              <Label htmlFor="exp-title">What was it for?</Label>
              <Input
                id="exp-title"
                placeholder="e.g. Groceries, dinner, Uber…"
                value={newExpense.title}
                onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAddExpense()}
                autoFocus
              />
              {/* Hazel info */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
                Hazel will tidy the name and pick a category automatically
              </div>
            </motion.div>

            {/* Category override */}
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.08, ease }}
              className="space-y-2"
            >
              <Label>Category <span className="text-muted-foreground font-normal">(optional — Hazel will choose if left blank)</span></Label>
              <Select
                value={newExpense.category || "__hazel__"}
                onValueChange={(v) => setNewExpense({ ...newExpense, category: v === "__hazel__" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__hazel__">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Hazel will choose
                    </span>
                  </SelectItem>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat.name} value={cat.name}>
                      <span className="flex items-center gap-2">
                        <CategoryIcon category={cat} className="w-3.5 h-3.5" />
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>

            {/* Amount + Paid by */}
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1, ease }}
              className="grid grid-cols-2 gap-3"
            >
              <div className="space-y-2">
                <Label htmlFor="exp-amount">Amount (£)</Label>
                <Input
                  id="exp-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Paid by</Label>
                <Select value={newExpense.payer} onValueChange={(v) => setNewExpense({ ...newExpense, payer: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={currentUser}>{currentUser}</SelectItem>
                    <SelectItem value={partnerName}>{partnerName}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            {/* Date */}
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.15, ease }}
              className="space-y-2"
            >
              <Label>Date</Label>
              <DatePicker
                value={newExpense.date}
                onChange={(d) => d && setNewExpense({ ...newExpense, date: d })}
              />
            </motion.div>

            {/* Split type */}
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.2, ease }}
              className="space-y-2"
            >
              <Label>Split</Label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: "shared", icon: Users, label: "Shared", sub: "50/50 between you" },
                  { value: "personal", icon: User, label: "Personal", sub: "Just you" },
                ] as const).map(({ value, icon: Icon, label, sub }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setNewExpense({ ...newExpense, splitType: value })}
                    className={[
                      "flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-200",
                      newExpense.splitType === value
                        ? "border-primary bg-primary/8 text-primary"
                        : "border-border bg-background hover:bg-muted/60 text-foreground",
                    ].join(" ")}
                  >
                    <div className={[
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200",
                      newExpense.splitType === value ? "bg-primary/15" : "bg-muted",
                    ].join(" ")}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Recurring */}
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.25, ease }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Recurring expense</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Repeats automatically</p>
                </div>
                <Switch
                  id="recurring"
                  checked={newExpense.isRecurring}
                  onCheckedChange={(checked) => setNewExpense({ ...newExpense, isRecurring: checked })}
                />
              </div>

              <AnimatePresence>
                {newExpense.isRecurring && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2">
                      <Label>Repeat every</Label>
                      <Select value={newExpense.interval} onValueChange={(v) => setNewExpense({ ...newExpense, interval: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Weekly">Week</SelectItem>
                          <SelectItem value="Monthly">Month</SelectItem>
                          <SelectItem value="Yearly">Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.3, ease }}
              className="flex gap-2 justify-end pt-1"
            >
              <Button variant="outline" onClick={() => setShowAddExpense(false)}>Cancel</Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring}>
                <Button onClick={handleAddExpense} disabled={!newExpense.title.trim() || !newExpense.amount}>
                  Add expense
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settle Up Modal */}
      <SettleUpModal open={showSettleUp} onOpenChange={setShowSettleUp} />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this expense. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteExpense(deleteId);
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