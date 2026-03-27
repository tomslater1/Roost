import { NavLink } from "react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  PiggyBank,
  CheckSquare,
  CalendarDays,
  Pin,
} from "lucide-react";
import { useApp } from "../context/AppContext";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, dataOnboarding: "" },
  { path: "/shopping", label: "Shopping", icon: ShoppingCart, dataOnboarding: "nav-shopping" },
  { path: "/expenses", label: "Expenses", icon: Receipt, dataOnboarding: "nav-expenses" },
  { path: "/budget", label: "Budget", icon: PiggyBank, dataOnboarding: "nav-budget" },
  { path: "/chores", label: "Chores", icon: CheckSquare, dataOnboarding: "nav-chores" },
  { path: "/calendar", label: "Calendar", icon: CalendarDays, dataOnboarding: "nav-calendar" },
  { path: "/pinboard", label: "Pinboard", icon: Pin, dataOnboarding: "" },
];

export function BottomNav() {
  const { shoppingItems, chores } = useApp();
  
  // Calculate badge counts
  const activeShoppingCount = shoppingItems.filter(i => !i.checked).length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueChoresCount = chores.filter(c => !c.completed && c.dueDate && new Date(c.dueDate) < today).length;

  const getBadgeCount = (path: string) => {
    if (path === "/shopping") return activeShoppingCount > 0 ? activeShoppingCount : null;
    if (path === "/chores") return overdueChoresCount > 0 ? overdueChoresCount : null;
    return null;
  };

  return (
    <nav className="h-16 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-center px-4">
      <div className="flex items-center justify-around w-full max-w-4xl gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const badgeCount = getBadgeCount(item.path);
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              data-onboarding={item.dataOnboarding}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[72px] relative ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                    {badgeCount && (
                      <span className="absolute -top-2 -right-2 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-medium">
                        {badgeCount > 9 ? "9+" : badgeCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs ${isActive ? "font-medium" : ""}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}