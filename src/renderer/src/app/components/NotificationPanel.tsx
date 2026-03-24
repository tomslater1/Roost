import { useEffect } from "react";
import { X, Bell, CheckCircle, Receipt, ShoppingCart, Handshake } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { useApp } from "../context/AppContext";

interface NotificationPanelProps {
  onClose: () => void;
}

const iconMap = {
  chore: CheckCircle,
  expense: Receipt,
  shopping_item: ShoppingCart,
  settlement: Handshake,
};

const colorMap = {
  chore: "text-primary",
  expense: "text-success",
  shopping_item: "text-info",
  settlement: "text-success",
};

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, markAllNotificationsAsRead } = useApp();

  // Mark everything as read the moment the panel opens.
  // Empty deps is intentional — we want this to fire exactly once on mount,
  // not re-run when the mutation reference changes between idle/pending/success.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { markAllNotificationsAsRead(); }, []);

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50" data-onboarding="activity-feed">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          Notifications
        </h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Notification list */}
      <ScrollArea className="max-h-96">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Bell className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => {
              const Icon = iconMap[notification.type] ?? Bell;
              const iconColor = colorMap[notification.type] ?? "text-muted-foreground";

              return (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-muted/50 transition-colors ${
                    !notification.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`mt-0.5 ${iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.isRead ? "font-medium" : ""}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(notification.timestamp)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
