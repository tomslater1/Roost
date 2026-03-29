import { createHashRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { AppShell } from "./components/AppShell";
import { Welcome } from "./pages/auth/Welcome";
import { Join } from "./pages/auth/Join";
import { Setup } from "./pages/auth/Setup";
import { Dashboard } from "./pages/Dashboard";
import { Shopping } from "./pages/Shopping";
import { Expenses } from "./pages/Expenses";
import { Budget } from "./pages/Budget";
import { Chores } from "./pages/Chores";
import { Calendar } from "./pages/Calendar";
import { Pinboard } from "./pages/Pinboard";
import { SettingsLayout } from "./pages/settings/SettingsLayout";
import { Profile } from "./pages/settings/Profile";
import { Household } from "./pages/settings/Household";
import { BudgetCategories } from "./pages/settings/BudgetCategories";
import { Rooms } from "./pages/settings/Rooms";
import { Account } from "./pages/settings/Account";
import { Hazel } from "./pages/settings/Hazel";
import { Notifications } from "./pages/settings/Notifications";
import { Subscription } from "./pages/settings/Subscription";

export const router = createHashRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { path: "welcome", Component: Welcome },
      { path: "join", Component: Join },
      { path: "setup", Component: Setup },
      {
        path: "/",
        Component: AppShell,
        children: [
          { index: true, Component: Dashboard },
          { path: "dashboard", Component: Dashboard },
          { path: "shopping", Component: Shopping },
          { path: "expenses", Component: Expenses },
          { path: "budget", Component: Budget },
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
              { path: "rooms", Component: Rooms },
              { path: "budget-categories", Component: BudgetCategories },
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
