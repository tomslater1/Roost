/**
 * Ordered list of shopping-aisle categories.
 * Order reflects a typical supermarket walk — used for consistent grouping in ShoppingList
 * and as the picker options in AddItemForm.
 * "Other" is implicit — used for items with a null category.
 */
export const SHOPPING_CATEGORIES = [
  'Produce',
  'Dairy',
  'Bakery',
  'Meat & Fish',
  'Frozen',
  'Drinks',
  'Snacks',
  'Household',
  'Personal Care',
] as const

export type ShoppingCategory = (typeof SHOPPING_CATEGORIES)[number]
