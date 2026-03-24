/**
 * MemberAvatar — single source of truth for all user avatars in Roost.
 *
 * Renders either a Lucide icon or the first letter of the display name,
 * against the member's chosen background colour. Import AVATAR_COLORS and
 * AVATAR_ICON_OPTIONS from here for use in the avatar picker UI.
 *
 * DB note: requires migration 0007 for the `avatar_icon` column on
 * home_members. The component degrades gracefully (shows first letter)
 * when avatar_icon is null or the column does not yet exist.
 */

import {
  Star, Heart, Flame, Zap, Sun, Moon, Leaf, Music, Camera, Coffee,
  Bike, Plane, Trophy, Crown, Rocket, Palette, BookOpen, Compass,
  Mountain, Globe, Smile, Gem, Pizza, Gamepad2,
  type LucideIcon,
} from "lucide-react";

// ── Colour palette ────────────────────────────────────────────────────────────

export const AVATAR_COLORS: string[] = [
  "#7F77DD", // violet   (Roost default)
  "#E05878", // rose
  "#D6533A", // terracotta
  "#D4861D", // amber
  "#3DA85F", // green
  "#3B9BD0", // blue
  "#8B5CF6", // purple
  "#D44FAB", // fuchsia
  "#2A9D8F", // teal
  "#5C7A40", // olive
  "#C0392B", // crimson
  "#5C7A8C", // slate
];

// ── Icon catalogue ────────────────────────────────────────────────────────────

export interface AvatarIconOption {
  /** Stored in DB. null = "show first letter" */
  id: string | null;
  label: string;
  Icon?: LucideIcon;
}

export const AVATAR_ICON_OPTIONS: AvatarIconOption[] = [
  { id: null,        label: "Letter"    },
  { id: "Star",      label: "Star",      Icon: Star      },
  { id: "Heart",     label: "Heart",     Icon: Heart     },
  { id: "Flame",     label: "Flame",     Icon: Flame     },
  { id: "Zap",       label: "Zap",       Icon: Zap       },
  { id: "Sun",       label: "Sun",       Icon: Sun       },
  { id: "Moon",      label: "Moon",      Icon: Moon      },
  { id: "Leaf",      label: "Leaf",      Icon: Leaf      },
  { id: "Music",     label: "Music",     Icon: Music     },
  { id: "Camera",    label: "Camera",    Icon: Camera    },
  { id: "Coffee",    label: "Coffee",    Icon: Coffee    },
  { id: "Bike",      label: "Bike",      Icon: Bike      },
  { id: "Plane",     label: "Plane",     Icon: Plane     },
  { id: "Trophy",    label: "Trophy",    Icon: Trophy    },
  { id: "Crown",     label: "Crown",     Icon: Crown     },
  { id: "Rocket",    label: "Rocket",    Icon: Rocket    },
  { id: "Palette",   label: "Palette",   Icon: Palette   },
  { id: "BookOpen",  label: "Book",      Icon: BookOpen  },
  { id: "Compass",   label: "Compass",   Icon: Compass   },
  { id: "Mountain",  label: "Mountain",  Icon: Mountain  },
  { id: "Globe",     label: "Globe",     Icon: Globe     },
  { id: "Smile",     label: "Smile",     Icon: Smile     },
  { id: "Gem",       label: "Gem",       Icon: Gem       },
  { id: "Pizza",     label: "Pizza",     Icon: Pizza     },
  { id: "Gamepad2",  label: "Gamepad",   Icon: Gamepad2  },
];

// Fast lookup: icon id → component
const ICON_MAP = Object.fromEntries(
  AVATAR_ICON_OPTIONS.filter((o) => o.Icon).map((o) => [o.id!, o.Icon!])
) as Record<string, LucideIcon>;

// ── Size tokens ───────────────────────────────────────────────────────────────

const SIZE_CLASSES = {
  xs: { wrap: "w-6 h-6",   text: "text-[9px]",  icon: "w-3 h-3"   },
  sm: { wrap: "w-8 h-8",   text: "text-xs",      icon: "w-4 h-4"   },
  md: { wrap: "w-10 h-10", text: "text-sm",      icon: "w-5 h-5"   },
  lg: { wrap: "w-12 h-12", text: "text-base",    icon: "w-5 h-5"   },
  xl: { wrap: "w-20 h-20", text: "text-2xl",     icon: "w-9 h-9"   },
} as const;

export type AvatarSize  = keyof typeof SIZE_CLASSES;
export type AvatarShape = "circle" | "square";

// ── Component ─────────────────────────────────────────────────────────────────

interface MemberAvatarProps {
  displayName: string;
  avatarColor?: string | null;
  avatarIcon?: string | null;
  size?: AvatarSize;
  /** circle = rounded-full (default), square = rounded-xl (large profile use) */
  shape?: AvatarShape;
  className?: string;
}

export function MemberAvatar({
  displayName,
  avatarColor = "#7F77DD",
  avatarIcon,
  size = "sm",
  shape = "circle",
  className,
}: MemberAvatarProps) {
  const s = SIZE_CLASSES[size];
  const Icon = avatarIcon ? ICON_MAP[avatarIcon] : null;
  const letter = (displayName || "?")[0].toUpperCase();
  const radius = shape === "circle" ? "rounded-full" : "rounded-2xl";
  const bg = avatarColor ?? "#7F77DD";

  return (
    <div
      className={`${s.wrap} ${radius} flex items-center justify-center font-semibold text-white flex-shrink-0 select-none ${className ?? ""}`}
      style={{ backgroundColor: bg }}
    >
      {Icon ? (
        <Icon className={s.icon} strokeWidth={2} />
      ) : (
        <span className={`${s.text} font-semibold`}>{letter}</span>
      )}
    </div>
  );
}
