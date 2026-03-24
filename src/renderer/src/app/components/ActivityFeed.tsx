import { Activity } from "lucide-react";
import { MemberAvatar } from "./MemberAvatar";
import { useApp } from "../context/AppContext";
import { timeAgo } from "@/lib/utils";

export function ActivityFeed() {
  const { activities } = useApp();

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-3">
          <Activity className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">Nothing here yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Activity appears here as you add items, log expenses, and complete chores
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center gap-3 py-2">
          <MemberAvatar
            displayName={activity.userName}
            avatarColor={activity.userColor}
            avatarIcon={activity.userIcon}
            size="sm"
          />

          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">{activity.userName}</span>{" "}
              {activity.action}
            </p>
          </div>

          <span className="text-xs text-muted-foreground flex-shrink-0">
            {timeAgo(activity.timestamp)}
          </span>
        </div>
      ))}
    </div>
  );
}
