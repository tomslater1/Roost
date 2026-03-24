import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'

// cn() is the standard shadcn/ui utility for combining Tailwind classes.
// It merges class names and resolves conflicts (e.g. 'p-2 p-4' → 'p-4')
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// Format a timestamp as a relative time string ("2 minutes ago")
export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

// Format a currency amount in GBP
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount)
}

// Generate initials from a display name ("Tom Slater" → "TS")
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
