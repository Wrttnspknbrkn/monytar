// Multi-currency support: supported currencies, formatting, and conversion.
// Conversion uses a static reference table (base = USD). In production these
// rates would be refreshed from an FX provider; the API surface here stays the
// same so callers don't change.

export interface CurrencyMeta {
  code: string
  symbol: string
  name: string
  /** Minor units (decimal places) used when formatting. */
  decimals: number
}

// This is the single source of truth for which currencies Monytar supports —
// every currency picker in the app (Settings, onboarding, etc.) must render
// from this list, not a separate local copy. A previous bug let Settings
// offer 8 currencies this file didn't know about; selecting one of those
// silently fell back to USD everywhere `formatMoney`/`getCurrencyMeta` was
// called, with no error.
export const SUPPORTED_CURRENCIES: CurrencyMeta[] = [
  { code: "USD", symbol: "$", name: "US Dollar", decimals: 2 },
  { code: "EUR", symbol: "€", name: "Euro", decimals: 2 },
  { code: "GBP", symbol: "£", name: "British Pound", decimals: 2 },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar", decimals: 2 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", decimals: 2 },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", decimals: 0 },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", decimals: 2 },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", decimals: 2 },
  { code: "GHS", symbol: "GH₵", name: "Ghanaian Cedi", decimals: 2 },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", decimals: 2 },
  { code: "ZAR", symbol: "R", name: "South African Rand", decimals: 2 },
  { code: "INR", symbol: "₹", name: "Indian Rupee", decimals: 2 },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", decimals: 2 },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso", decimals: 2 },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", decimals: 2 },
  { code: "AED", symbol: "AED", name: "UAE Dirham", decimals: 2 },
]

const CURRENCY_BY_CODE = new Map(SUPPORTED_CURRENCIES.map((c) => [c.code, c]))

// Reference rates relative to 1 USD. Used only as a deterministic fallback.
const USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 156,
  CHF: 0.88,
  NGN: 1550,
  GHS: 15.2,
  KES: 129,
  ZAR: 18.3,
  INR: 83,
  BRL: 5.4,
  MXN: 17.1,
  SGD: 1.34,
  AED: 3.67,
}

export function isSupportedCurrency(code: string): boolean {
  return CURRENCY_BY_CODE.has(code?.toUpperCase?.() ?? "")
}

export function getCurrencyMeta(code: string): CurrencyMeta {
  return CURRENCY_BY_CODE.get(code?.toUpperCase?.() ?? "") ?? SUPPORTED_CURRENCIES[0]
}

export function getCurrencySymbol(code: string): string {
  return getCurrencyMeta(code).symbol
}

/**
 * Converts an amount between two supported currencies via the USD base table.
 * Unknown currencies are treated as USD so the result is always a finite number.
 */
export function convertCurrency(amount: number, from: string, to: string): number {
  if (!Number.isFinite(amount)) return 0
  const fromCode = from?.toUpperCase?.() ?? "USD"
  const toCode = to?.toUpperCase?.() ?? "USD"
  if (fromCode === toCode) return amount

  const fromRate = USD_RATES[fromCode] ?? 1
  const toRate = USD_RATES[toCode] ?? 1
  const inUsd = amount / fromRate
  const converted = inUsd * toRate
  const decimals = getCurrencyMeta(toCode).decimals
  const factor = 10 ** decimals
  return Math.round(converted * factor) / factor
}

/**
 * Locale-aware currency formatting. Falls back gracefully for unsupported codes.
 */
export function formatMoney(amount: number, currency = "USD"): string {
  const meta = getCurrencyMeta(currency)
  const value = Number.isFinite(amount) ? amount : 0
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: meta.code,
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    }).format(value)
  } catch {
    // Currency not recognized by Intl — build a manual representation.
    return `${meta.symbol}${value.toFixed(meta.decimals)}`
  }
}
