import { useState } from "react";
import { Link } from "react-router";
import { Bell, Settings, LogOut } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { Button } from "./ui/button";
import { NotificationPanel } from "./NotificationPanel";
import { ThemeToggle } from "./ThemeToggle";
import { MemberAvatar } from "./MemberAvatar";
import { useApp } from "../context/AppContext";
import { useAuthContext } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";

export function TopBar() {
  const { currentMember, notifications } = useApp();
  const { user } = useAuthContext();
  const { signOut } = useAuth();
  const { prefs } = useNotificationPreferences();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const displayName = currentMember?.display_name ?? user?.email?.split("@")[0] ?? "Me";
  const firstName = displayName.split(" ")[0];
  const userEmail = user?.email ?? "";

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 relative bg-background">
      {/* Left — logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
          R
        </div>
        <span className="font-semibold text-lg">Roost</span>
      </div>

      {/* Right — theme · notifications · settings · profile */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* Notification bell */}
        <AnimatePresence>
          {prefs.in_app_enabled && (
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.8, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: "auto" }}
              exit={{ opacity: 0, scale: 0.8, width: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Button
                variant={showNotifications ? "secondary" : "ghost"}
                size="icon"
                className="relative"
                onClick={() => setShowNotifications(!showNotifications)}
                data-onboarding-trigger="notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>

              {showNotifications && (
                <NotificationPanel onClose={() => setShowNotifications(false)} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings */}
        <Button variant="ghost" size="icon" asChild>
          <Link to="/settings/profile" data-onboarding="nav-settings">
            <Settings className="w-4 h-4" />
          </Link>
        </Button>

        {/* Profile menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 hover:bg-muted/50 rounded-lg px-2 py-1.5 transition-colors"
            data-onboarding-trigger="profile"
          >
            <span className="text-sm text-muted-foreground hidden sm:block">{firstName}</span>
            <MemberAvatar
              displayName={displayName}
              avatarColor={currentMember?.avatar_color}
              avatarIcon={currentMember?.avatar_icon}
              size="sm"
            />
          </button>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                {/* User info */}
                <div className="p-3 border-b border-border flex items-center gap-3">
                  <MemberAvatar
                    displayName={displayName}
                    avatarColor={currentMember?.avatar_color}
                    avatarIcon={currentMember?.avatar_icon}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                  </div>
                </div>

                <div className="p-1">
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors text-left"
                    onClick={() => { setShowProfileMenu(false); signOut(); }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
