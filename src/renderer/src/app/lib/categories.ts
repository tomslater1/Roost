export interface Category {
  id?: string       // budget_template_lines.id when derived from template
  name: string      // stored in expenses.category and budget_template_lines.name
  emoji?: string    // optional — not present on template-derived categories
  iconName?: string // Lucide icon component name — used for all built-in and preset categories
  color?: string    // key into COLOR_CLASSES — optional for template-derived categories
  isCustom?: boolean
}

/**
 * Derive a stable hex colour from a category name.
 * Uses the same palette and hash algorithm as getCategoryColor in MoneyShared
 * so every surface that displays a category uses the same colour.
 */
export function deriveCategoryColour(name: string): string {
  const palette = ["#d4795e", "#9db19f", "#e6a563", "#b88b7e", "#7fa087"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

// ── Core categories ─────────────────────────────────────────────────────────
// Always present in every dropdown. The essentials for a shared home.
// Cannot be removed by users.

export const BUILT_IN_CATEGORIES: Category[] = [
  { name: 'Rent',                   emoji: '🏠', iconName: 'Home',             color: 'violet'  },
  { name: 'Bills',                  emoji: '⚡', iconName: 'Zap',              color: 'yellow'  },
  { name: 'Groceries',              emoji: '🛒', iconName: 'ShoppingCart',     color: 'emerald' },
  { name: 'Transport',              emoji: '🚗', iconName: 'Car',              color: 'sky'     },
  { name: 'Takeaways',              emoji: '🍕', iconName: 'UtensilsCrossed',  color: 'orange'  },
  { name: 'Toiletries & Household', emoji: '🧴', iconName: 'Sparkles',         color: 'teal'    },
  { name: 'Other',                  emoji: '📦', iconName: 'Tag',              color: 'slate'   },
]

// ── Optional presets ─────────────────────────────────────────────────────────
// Pre-defined categories users can add in Settings → Budget.
// Stored in home_custom_categories once added.

export const OPTIONAL_PRESET_CATEGORIES: Category[] = [
  { name: 'Mortgage',         emoji: '🏡', iconName: 'Building2',      color: 'violet'  }, // swap for Rent (homeowners)
  { name: 'Subscriptions',    emoji: '📺', iconName: 'Tv',             color: 'indigo'  }, // Netflix, Spotify, Prime...
  { name: 'Insurance',        emoji: '🛡️', iconName: 'Shield',         color: 'blue'    }, // car, home, health
  { name: 'Gym & Fitness',    emoji: '🏋️', iconName: 'Dumbbell',       color: 'lime'    }, // gym membership, classes
  { name: 'Entertainment',    emoji: '🎬', iconName: 'Film',           color: 'purple'  }, // cinema, concerts, nights out
  { name: 'Eating Out',       emoji: '🍽️', iconName: 'Utensils',       color: 'amber'   }, // restaurants, cafes
  { name: 'Clothing',         emoji: '👗', iconName: 'Shirt',          color: 'pink'    }, // clothes, shoes, accessories
  { name: 'Holidays',         emoji: '✈️', iconName: 'Plane',          color: 'cyan'    }, // flights, hotels, travel
  { name: 'Pets',             emoji: '🐾', iconName: 'PawPrint',       color: 'rose'    }, // vet, food, grooming
  { name: 'Healthcare',       emoji: '💊', iconName: 'Heart',          color: 'red'     }, // prescriptions, dentist, optician
  { name: 'Gifts',            emoji: '🎁', iconName: 'Gift',           color: 'fuchsia' }, // birthdays, occasions
]

// ── Custom category options ──────────────────────────────────────────────────
// Used in the custom category form in Settings → Budget.

export const CUSTOM_CATEGORY_COLORS = [
  'slate',
  'red',
  'amber',
  'lime',
  'cyan',
  'blue',
  'purple',
  'fuchsia',
]

// Icon names available for custom categories (all from Lucide React)
export const CUSTOM_CATEGORY_ICON_NAMES = [
  'Star', 'Bookmark', 'Coffee', 'Music', 'Camera', 'Bike',
  'Gamepad2', 'Globe', 'Baby', 'Wrench', 'Leaf', 'Gem',
  'Headphones', 'BookOpen', 'Flower2', 'Wine', 'Dog', 'Cat',
  'Key', 'Laptop', 'CreditCard', 'Scissors', 'Sunset', 'Trophy',
]

// ── Helpers ──────────────────────────────────────────────────────────────────

export function mergeCategories(
  customFromDb: { name: string; color: string; emoji: string }[]
): Category[] {
  return [...BUILT_IN_CATEGORIES, ...customFromDb.map((c) => ({ ...c, isCustom: true as const }))]
}

export function getCategoryMeta(
  name: string | null | undefined,
  all: Category[]
): Category {
  if (!name) return { name: 'No category', emoji: '❓', color: 'slate' }
  return all.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? { name, emoji: '❓', color: 'slate' }
}

// Static string map — NEVER build these dynamically (Tailwind purger won't find them)
export const COLOR_CLASSES: Record<string, { bg: string; text: string; bar: string }> = {
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  orange:  { bg: 'bg-orange-500/15',  text: 'text-orange-700',  bar: 'bg-orange-500'  },
  violet:  { bg: 'bg-violet-500/15',  text: 'text-violet-700',  bar: 'bg-violet-500'  },
  yellow:  { bg: 'bg-yellow-500/15',  text: 'text-yellow-700',  bar: 'bg-yellow-500'  },
  sky:     { bg: 'bg-sky-500/15',     text: 'text-sky-700',     bar: 'bg-sky-500'     },
  indigo:  { bg: 'bg-indigo-500/15',  text: 'text-indigo-700',  bar: 'bg-indigo-500'  },
  rose:    { bg: 'bg-rose-500/15',    text: 'text-rose-700',    bar: 'bg-rose-500'    },
  teal:    { bg: 'bg-teal-500/15',    text: 'text-teal-700',    bar: 'bg-teal-500'    },
  pink:    { bg: 'bg-pink-500/15',    text: 'text-pink-700',    bar: 'bg-pink-500'    },
  slate:   { bg: 'bg-slate-500/15',   text: 'text-slate-700',   bar: 'bg-slate-500'   },
  red:     { bg: 'bg-red-500/15',     text: 'text-red-700',     bar: 'bg-red-500'     },
  amber:   { bg: 'bg-amber-500/15',   text: 'text-amber-700',   bar: 'bg-amber-500'   },
  lime:    { bg: 'bg-lime-500/15',    text: 'text-lime-700',    bar: 'bg-lime-500'    },
  cyan:    { bg: 'bg-cyan-500/15',    text: 'text-cyan-700',    bar: 'bg-cyan-500'    },
  blue:    { bg: 'bg-blue-500/15',    text: 'text-blue-700',    bar: 'bg-blue-500'    },
  purple:  { bg: 'bg-purple-500/15',  text: 'text-purple-700',  bar: 'bg-purple-500'  },
  fuchsia: { bg: 'bg-fuchsia-500/15', text: 'text-fuchsia-700', bar: 'bg-fuchsia-500' },
}
