import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";

/**
 * Renders a Lucide icon by string name.
 * Falls back to <Home> if the name is not found.
 */
export function RoomIcon({ iconName, ...props }: { iconName: string } & LucideProps) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[iconName];
  if (!Icon) return <Icons.Home {...props} />;
  return <Icon {...props} />;
}
