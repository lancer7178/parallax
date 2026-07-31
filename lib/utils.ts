import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const currencyPrecise = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(amount: number, precise = false) {
  return (precise ? currencyPrecise : currency).format(amount)
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return '—'
  return dateFormatter.format(new Date(date))
}

/** Whole days from now until `date`. Negative when the date is in the past. */
export function daysUntil(date: Date | string) {
  const target = new Date(date).getTime()
  const today = new Date().getTime()
  return Math.ceil((target - today) / 86_400_000)
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}
