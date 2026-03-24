// All rooms are stored in the home_rooms table — nothing is hardcoded.
// These are just suggestions shown in the "Add rooms" section of settings.

export interface RoomPreset {
  name: string
  iconName: string
}

// Suggested rooms shown to the user to quickly add
export const PRESET_ROOMS: RoomPreset[] = [
  { name: 'Kitchen', iconName: 'ChefHat' },
  { name: 'Living Room', iconName: 'Sofa' },
  { name: 'Bedroom', iconName: 'Bed' },
  { name: 'Bathroom', iconName: 'Bath' },
  { name: 'Hallway', iconName: 'DoorOpen' },
  { name: 'En Suite', iconName: 'ShowerHead' },
  { name: 'Bedroom 2', iconName: 'BedDouble' },
  { name: 'Bedroom 3', iconName: 'BedDouble' },
  { name: 'Dining Room', iconName: 'UtensilsCrossed' },
  { name: 'Home Office', iconName: 'Laptop' },
  { name: 'Garden', iconName: 'Trees' },
  { name: 'Garage', iconName: 'Car' },
  { name: 'Utility Room', iconName: 'Shirt' },
  { name: 'Loft', iconName: 'Package' },
  { name: 'Basement', iconName: 'Archive' },
]

// ── System groups ────────────────────────────────────────────────────────────
// These are never stored in the database. All three are always present and
// non-removable. "All Bedrooms"/"All Bathrooms" auto-populate as rooms are added.

export interface SystemGroup {
  name: string
  icon: string
  isSystem: true
  /** Returns true if a given room name belongs to this group */
  matches: (roomName: string) => boolean
}

export const SYSTEM_GROUPS: SystemGroup[] = [
  {
    name: 'All Rooms',
    icon: 'Home',
    isSystem: true,
    matches: () => true, // always includes everything
  },
  {
    name: 'All Bedrooms',
    icon: 'BedDouble',
    isSystem: true,
    matches: (name) => /bedroom/i.test(name),
  },
  {
    name: 'All Bathrooms',
    icon: 'Bath',
    isSystem: true,
    matches: (name) => /bath|en.?suite/i.test(name),
  },
]

// Icon options for group creation (broader set — groups can represent many things)
export const GROUP_ICON_OPTIONS: { name: string; iconName: string }[] = [
  { name: 'Layers', iconName: 'Layers' },
  { name: 'Home', iconName: 'Home' },
  { name: 'Building', iconName: 'Building2' },
  { name: 'Bed', iconName: 'Bed' },
  { name: 'Double bed', iconName: 'BedDouble' },
  { name: 'Bath', iconName: 'Bath' },
  { name: 'Shower', iconName: 'ShowerHead' },
  { name: 'Sofa', iconName: 'Sofa' },
  { name: 'Chef hat', iconName: 'ChefHat' },
  { name: 'Utensils', iconName: 'UtensilsCrossed' },
  { name: 'Laptop', iconName: 'Laptop' },
  { name: 'Trees', iconName: 'Trees' },
  { name: 'Car', iconName: 'Car' },
  { name: 'Star', iconName: 'Star' },
  { name: 'Heart', iconName: 'Heart' },
  { name: 'Flame', iconName: 'Flame' },
]

// Icons available in the custom room creator (icon picker)
export const ROOM_ICON_OPTIONS: { name: string; iconName: string }[] = [
  { name: 'Home', iconName: 'Home' },
  { name: 'Chef hat', iconName: 'ChefHat' },
  { name: 'Sofa', iconName: 'Sofa' },
  { name: 'Bed', iconName: 'Bed' },
  { name: 'Double bed', iconName: 'BedDouble' },
  { name: 'Bath', iconName: 'Bath' },
  { name: 'Shower', iconName: 'ShowerHead' },
  { name: 'Droplets', iconName: 'Droplets' },
  { name: 'Door', iconName: 'DoorOpen' },
  { name: 'Utensils', iconName: 'UtensilsCrossed' },
  { name: 'Laptop', iconName: 'Laptop' },
  { name: 'Trees', iconName: 'Trees' },
  { name: 'Leaf', iconName: 'Leaf' },
  { name: 'Flower', iconName: 'Flower2' },
  { name: 'Car', iconName: 'Car' },
  { name: 'Package', iconName: 'Package' },
  { name: 'Archive', iconName: 'Archive' },
  { name: 'Shirt', iconName: 'Shirt' },
  { name: 'Coffee', iconName: 'Coffee' },
  { name: 'Flame', iconName: 'Flame' },
  { name: 'Music', iconName: 'Music' },
  { name: 'Book', iconName: 'BookOpen' },
  { name: 'Dumbbell', iconName: 'Dumbbell' },
  { name: 'Wrench', iconName: 'Wrench' },
]
