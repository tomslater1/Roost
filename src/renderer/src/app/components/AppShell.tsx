import { Outlet, Navigate } from "react-router";
import { motion } from "motion/react";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";
import { Onboarding } from "./Onboarding";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { QuickAddShoppingModal, QuickAddExpenseModal, QuickAddChoreModal } from "./QuickAddModals";
import { useQuickAdd } from "../context/QuickAddContext";
import { useAuthContext } from "@/context/AuthContext";
import { useHome } from "../hooks/useHome";
import { ErrorBoundary } from "./ErrorBoundary";
import { OfflineBanner } from "./OfflineBanner";
import { UpdateBanner } from "./UpdateBanner";

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

  const isLoading = loading || (!!session && homeLoading);

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-medium text-lg select-none"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          R
        </motion.div>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </motion.div>
    </div>
  );

  if (!session) return <Navigate to="/welcome" replace />;
  // User authenticated but hasn't finished Setup (e.g. confirmed email then came back)
  if (!home) return <Navigate to="/setup" replace />;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <TopBar />

      {/* Offline banner — slides in below top bar when disconnected */}
      <OfflineBanner />

      {/* Update banner — slides in below offline banner when an update is available */}
      <UpdateBanner />

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
    </div>
  );
}