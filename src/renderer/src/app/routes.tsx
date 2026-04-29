import { createHashRouter, Navigate } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { AppShell } from "./components/AppShell";
import { Welcome } from "./pages/auth/Welcome";
import { Join } from "./pages/auth/Join";
import { Setup } from "./pages/auth/Setup";
import { Dashboard } from "./pages/Dashboard";
import { Shopping } from "./pages/Shopping";
import { Budget } from "./pages/Budget";
import { Money } from "./pages/Money";
import { Overview } from "./pages/money/Overview";
import { Spending } from "./pages/money/Spending";
import { BillsAndGoals } from "./pages/money/BillsAndGoals";
import { Budgets } from "./pages/money/Budgets";
import { Goals } from "./pages/money/Goals";
import { Chores } from "./pages/Chores";
import { Calendar } from "./pages/Calendar";
import { Pinboard } from "./pages/Pinboard";
import { SettingsLayout } from "./pages/settings/SettingsLayout";
import { Profile } from "./pages/settings/Profile";
import { Household } from "./pages/settings/Household";
import { Rooms } from "./pages/settings/Rooms";
import { Account } from "./pages/settings/Account";
import { Hazel } from "./pages/settings/Hazel";
import { Notifications } from "./pages/settings/Notifications";
import { Subscription } from "./pages/settings/Subscription";
import { MoneySettings } from "./pages/settings/MoneySettings";
import { Security } from "./pages/settings/Security";
import { IncomeSetup } from "./pages/IncomeSetup";

export const router = createHashRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { path: "welcome", Component: Welcome },
      { path: "join", Component: Join },
      { path: "setup", Component: Setup },
      { path: "income-setup", Component: IncomeSetup },
      {
        path: "/",
        Component: AppShell,
        children: [
          { index: true, Component: Dashboard },
          { path: "dashboard", Component: Dashboard },
          { path: "shopping", Component: Shopping },
          { path: "expenses", element: <Navigate to="/money/spending" replace /> },
          { path: "budget", element: <Navigate to="/money" replace /> },
          { path: "money", Component: Money },
          { path: "money/overview", Component: Overview },
          { path: "money/spending", Component: Spending },
          { path: "money/bills", element: <Navigate to="/money/bills-and-goals" replace /> },
          { path: "money/bills-and-goals", element: <Navigate to="/money/budgets" replace /> },
          { path: "money/budgets", Component: Budgets },
          { path: "money/goals", Component: Goals },
          { path: "chores", Component: Chores },
          { path: "calendar", Component: Calendar },
          { path: "pinboard", Component: Pinboard },
          {
            path: "settings",
            Component: SettingsLayout,
            children: [
              { index: true, Component: Profile },
              { path: "profile", Component: Profile },
              { path: "household", Component: Household },
              { path: "money", Component: MoneySettings },
              { path: "security", Component: Security },
              { path: "rooms", Component: Rooms },
              { path: "budget-categories", element: <Navigate to="/money/budgets" replace /> },
              { path: "hazel", Component: Hazel },
              { path: "notifications", Component: Notifications },
              { path: "account", Component: Account },
              { path: "subscription", Component: Subscription },
            ],
          },
        ],
      },
    ],
  },
]);
