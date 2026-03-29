import { NavLink, Outlet, useLocation } from "react-router";
import { User, Users, Wallet, LogOut, Sparkles, DoorOpen, Bell, Crown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const settingsNav = [
  { path: "/settings/profile", label: "Profile", icon: User },
  { path: "/settings/household", label: "Household", icon: Users },
  { path: "/settings/rooms", label: "Rooms", icon: DoorOpen },
  { path: "/settings/budget-categories", label: "Budget Categories", icon: Wallet },
  { path: "/settings/hazel", label: "Hazel", icon: Sparkles },
  { path: "/settings/notifications", label: "Notifications", icon: Bell },
  { path: "/settings/account", label: "Account", icon: LogOut },
  { path: "/settings/subscription", label: "Subscription", icon: Crown },
];

export function SettingsLayout() {
  const location = useLocation();

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-semibold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your household preferences</p>
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-1">
          {settingsNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.path} to={item.path}>
                {({ isActive }) => (
                  <span
                    className={`relative flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors rounded-t-md ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {isActive && (
                      <motion.div
                        layoutId="settings-tab-indicator"
                        className="absolute inset-x-0 -bottom-px h-0.5 bg-primary rounded-full"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Content area — fades between routes */}
      <div className="pb-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
