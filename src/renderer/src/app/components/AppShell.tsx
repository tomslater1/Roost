import { Outlet, Navigate, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { EyeOff } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";
import { Onboarding } from "./Onboarding";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { QuickAddShoppingModal, QuickAddExpenseModal, QuickAddChoreModal } from "./QuickAddModals";
import { useQuickAdd } from "../context/QuickAddContext";
import { useAuthContext } from "@/context/AuthContext";
import { useHome } from "../hooks/useHome";
import { useApp } from "../context/AppContext";
import { ErrorBoundary } from "./ErrorBoundary";
import { OfflineBanner } from "./OfflineBanner";
import { UpdateBanner } from "./UpdateBanner";
import { TrialBanner } from "./subscription/TrialBanner";
import { UpgradeModal } from "./subscription/UpgradeModal";
import { INCOME_SETUP_DISMISSED_KEY } from "../pages/IncomeSetup";
import appIcon from "@/assets/app-icon.png";

// ── Scramble mode banner ──────────────────────────────────────────────────────
// Shown on all money routes when scramble mode is ON.

function ScrambleBanner() {
  const location = useLocation();
  const { scrambleMode, toggleScrambleMode } = useApp();

  const isMoneyRoute =
    location.pathname === "/money" ||
    location.pathname.startsWith("/money/");

  if (!isMoneyRoute || !scrambleMode) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="scramble-banner"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="overflow-hidden"
      >
        <div className="flex justify-center py-1.5 bg-warning/10 border-b border-warning/20">
          <button
            type="button"
            onClick={() => toggleScrambleMode()}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/20 hover:bg-warning/30 border border-warning/40 transition-colors"
          >
            <EyeOff className="w-3.5 h-3.5 text-warning" />
            <span className="text-xs font-medium text-warning">
              Scramble mode on — amounts hidden · Tap to turn off
            </span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function QuickAddModalsContainer() {
  const { shoppingOpen, expenseOpen, choreOpen, closeAll, openShopping, openExpense, openChore } = useQuickAdd();
  return (
    <>
      <QuickAddShoppingModal open={shoppingOpen} onOpenChange={(v) => v ? openShopping() : closeAll()} />
      <QuickAddExpenseModal open={expenseOpen} onOpenChange={(v) => v ? openExpense() : closeAll()} />
      <QuickAddChoreModal open={choreOpen} onOpenChange={(v) => v ? openChore() : closeAll()} />
    </>
  );
}

export function AppShell() {
  const { session, loading } = useAuthContext();
  const { home, homeLoading } = useHome();
  const { incomeRows, isHouseholdIncomeLoading } = useApp();

  // Hold the loading spinner until income data resolves for the first time —
  // this prevents a flash of dashboard content before the income-setup redirect fires.
  const isLoading =
    loading ||
    (!!session && homeLoading) ||
    (!!session && !!home && isHouseholdIncomeLoading);

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="w-10 h-10 rounded-xl overflow-hidden select-none"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <img src={appIcon} alt="Roost" className="w-full h-full object-cover" />
        </motion.div>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </motion.div>
    </div>
  );

  if (!session) return <Navigate to="/welcome" replace />;
  // User authenticated but hasn't finished Setup (e.g. confirmed email then came back)
  if (!home) return <Navigate to="/setup" replace />;

  // Redirect to income setup if the household has never set income and the user
  // hasn't explicitly dismissed the screen. Covers both new users (first boot)
  // and existing users who update to this version before setting income.
  const incomeSetupDismissed =
    localStorage.getItem(INCOME_SETUP_DISMISSED_KEY) === "true";
  if (incomeRows.length === 0 && !incomeSetupDismissed) {
    return <Navigate to="/income-setup" replace />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <TopBar />

      {/* Offline banner — slides in below top bar when disconnected */}
      <OfflineBanner />

      {/* Update banner — slides in below offline banner when an update is available */}
      <UpdateBanner />

      {/* Trial banner — slim, persistent, and part of the layout */}
      <TrialBanner />

      {/* Scramble mode banner — amber pill, only on money routes when scramble is active */}
      <ScrambleBanner />

      {/* Main content area - scrollable */}
      <main className="flex-1 overflow-y-auto pb-2">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* Bottom navigation */}
      <BottomNav />

      {/* Onboarding overlay - rendered inside router context */}
      <Onboarding />

      {/* Keyboard shortcuts helper */}
      <KeyboardShortcuts />

      {/* Global quick-add modals — opened by shortcuts or Dashboard buttons */}
      <QuickAddModalsContainer />

      {/* Global subscription upgrade modal */}
      <UpgradeModal />
    </div>
  );
}