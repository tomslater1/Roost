import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Bell, AlertCircle, Settings, LogOut, Search } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { Button } from "./ui/button";
import { NotificationPanel } from "./NotificationPanel";
import { ThemeToggle } from "./ThemeToggle";
import { MemberAvatar } from "./MemberAvatar";
import { GlobalSearch } from "./GlobalSearch";
import { useApp } from "../context/AppContext";
import { useAuthContext } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useSubscription } from "@/hooks/useSubscription";
import appIcon from "@/assets/app-icon.png";

export function TopBar() {
  const { currentMember, notifications } = useApp();
  const { user } = useAuthContext();
  const { signOut } = useAuth();
  const { prefs } = useNotificationPreferences();
  const { status, isNest } = useSubscription();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchMounted, setSearchMounted] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const displayName = currentMember?.display_name ?? user?.email?.split("@")[0] ?? "Me";
  const firstName = displayName.split(" ")[0];
  const userEmail = user?.email ?? "";

  useEffect(() => {
    const openSearch = () => setShowSearch(true)
    window.addEventListener("roost:open-search", openSearch)
    return () => window.removeEventListener("roost:open-search", openSearch)
  }, [])

  useEffect(() => {
    if (showSearch) {
      setSearchMounted(true)
      return
    }

    const timeout = window.setTimeout(() => setSearchMounted(false), 180)
    return () => window.clearTimeout(timeout)
  }, [showSearch])

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 relative bg-background">
      {/* Left — logo */}
      <div className="flex items-center gap-2">
        <img src={appIcon} alt="Roost" className="w-8 h-8 rounded-lg object-cover" />
        <span className="font-semibold text-lg">Roost</span>
      </div>

      {/* Centre/right — search then utilities */}
      <div className="flex items-center gap-3">
        <motion.div
          layout
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="hidden md:block"
          style={{ width: showSearch ? 448 : 220 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {searchMounted ? (
              <motion.div
                key="search-open"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}
              >
                <GlobalSearch open={showSearch} onOpenChange={setShowSearch} />
              </motion.div>
            ) : (
              <motion.div
                key="search-closed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
              >
                <button
                  type="button"
                  onClick={() => setShowSearch(true)}
                  className="w-full h-10 rounded-xl border border-border/80 bg-background/80 px-4 flex items-center gap-3 text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
                  aria-label="Search everything"
                >
                  <Search className="w-4 h-4" />
                  <span className="flex-1 text-left">Search Roost</span>
                  <span className="text-[11px] flex items-center gap-1.5">
                    <span>⌘</span>
                    <span>K</span>
                  </span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)} aria-label="Search everything" className="md:hidden">
          <Search className="w-4 h-4" />
        </Button>

        <ThemeToggle />

        <div
          className={[
            "hidden sm:inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border",
            isNest
              ? "bg-primary/12 text-primary border-primary/20"
              : "bg-muted text-muted-foreground border-border/70",
          ].join(' ')}
          title={isNest ? 'Roost Nest active' : 'Free plan'}
        >
          {isNest ? 'Nest' : 'Free'}
        </div>

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
                {status === 'past_due' && (
                  <span className="absolute -bottom-0.5 -left-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-warning text-foreground">
                    <AlertCircle className="w-2.5 h-2.5" />
                  </span>
                )}
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
