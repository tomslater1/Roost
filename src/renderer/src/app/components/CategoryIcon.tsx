import {
  Home, Zap, ShoppingCart, Car, UtensilsCrossed, Sparkles, Tag,
  Building2, Tv, Shield, Dumbbell, Film, Utensils, Shirt, Plane,
  PawPrint, Heart, Gift,
  Star, Bookmark, Coffee, Music, Camera, Bike,
  Gamepad2, Globe, Baby, Wrench, Leaf, Gem,
  Headphones, BookOpen, Flower2, Wine, Dog, Cat, Sunset,
  Key, Laptop, CreditCard, Scissors, Trophy,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/categories";

// All Lucide icons available for categories. Key = iconName string stored in Category.iconName
const ICON_MAP: Record<string, LucideIcon> = {
  // Built-in categories
  Home, Zap, ShoppingCart, Car, UtensilsCrossed, Sparkles, Tag,
  // Optional presets
  Building2, Tv, Shield, Dumbbell, Film, Utensils, Shirt, Plane,
  PawPrint, Heart, Gift,
  // Custom category options
  Star, Bookmark, Coffee, Music, Camera, Bike,
  Gamepad2, Globe, Baby, Wrench, Leaf, Gem,
  Headphones, BookOpen, Flower2, Wine, Dog, Cat, Sunset,
  Key, Laptop, CreditCard, Scissors, Trophy,
};

interface Props {
  category: Category;
  className?: string;
}

/**
 * Renders a Lucide icon if:
 *   - category.iconName is set (built-in / preset categories), OR
 *   - category.emoji is a valid icon name stored in the DB (custom categories save icon names in the emoji field)
 *
 * Falls back to rendering category.emoji as a character (old custom categories or true emojis).
 */
export function CategoryIcon({ category, className = "w-4 h-4" }: Props) {
  // 1. Prefer explicit iconName (built-ins and presets)
  if (category.iconName) {
    const Icon = ICON_MAP[category.iconName];
    if (Icon) return <Icon className={className} />;
  }
  // 2. Check if emoji field contains a Lucide icon name (custom categories added via settings)
  if (category.emoji && ICON_MAP[category.emoji]) {
    const Icon = ICON_MAP[category.emoji];
    return <Icon className={className} />;
  }
  // 3. Emoji character fallback
  return <span className="text-sm leading-none select-none">{category.emoji}</span>;
}
