/**
 * appLock — core lock state module.
 *
 * Manages all app-lock configuration and state. The PIN system is the current
 * unlock mechanism. The architecture is designed so that Face ID / Touch ID
 * can slot in as an alternative unlock path without changing the lock model —
 * Face ID will call unlock() after biometric success, bypassing the PIN keypad.
 *
 * Config is stored in localStorage under LOCK_CONFIG_KEY.
 * Lock state (locked/unlocked) is stored separately under LOCK_STATE_KEY.
 * The PIN itself is never stored — only a SHA-256 hash with a fixed salt.
 */

export interface AppLockConfig {
  isEnabled: boolean
  /** Milliseconds before auto-lock on blur. 0 = immediate, -1 = never. */
  autoLockDelay: number
  /** Reserved for future Face ID / Touch ID support. Always false for now. */
  useFaceID: boolean
  /** SHA-256 hex of `pin + 'roost-salt-v1'`. Null when no PIN is set. */
  pinHash: string | null
}

const LOCK_CONFIG_KEY = 'roost-lock-config'
const LOCK_STATE_KEY = 'roost-lock-state'

const DEFAULT_CONFIG: AppLockConfig = {
  isEnabled: false,
  autoLockDelay: 60_000, // 1 minute default
  useFaceID: false,
  pinHash: null,
}

// ── Hashing ───────────────────────────────────────────────────────────────────

async function hashPIN(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + 'roost-salt-v1')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ── Config ────────────────────────────────────────────────────────────────────

export function getConfig(): AppLockConfig {
  try {
    const raw = localStorage.getItem(LOCK_CONFIG_KEY)
    if (!raw) return { ...DEFAULT_CONFIG }
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function updateConfig(partial: Partial<AppLockConfig>): void {
  try {
    const current = getConfig()
    localStorage.setItem(LOCK_CONFIG_KEY, JSON.stringify({ ...current, ...partial }))
  } catch {
    // ignore storage errors
  }
}

// ── Lock state ────────────────────────────────────────────────────────────────

export function isLocked(): boolean {
  const config = getConfig()
  if (!config.isEnabled || !config.pinHash) return false
  try {
    return localStorage.getItem(LOCK_STATE_KEY) === 'true'
  } catch {
    return false
  }
}

export function lock(): void {
  try {
    localStorage.setItem(LOCK_STATE_KEY, 'true')
  } catch {
    // ignore
  }
}

export function setUnlocked(): void {
  try {
    localStorage.setItem(LOCK_STATE_KEY, 'false')
  } catch {
    // ignore
  }
}

// ── PIN operations ────────────────────────────────────────────────────────────

/** Hash and store the PIN, then enable lock. */
export async function setupPIN(pin: string): Promise<void> {
  const hash = await hashPIN(pin)
  updateConfig({ pinHash: hash, isEnabled: true })
}

/** Verify a PIN candidate against the stored hash. */
export async function verifyPIN(pin: string): Promise<boolean> {
  const config = getConfig()
  if (!config.pinHash) return false
  const hash = await hashPIN(pin)
  return hash === config.pinHash
}

/** Clear PIN and disable lock. */
export function clearPIN(): void {
  updateConfig({ pinHash: null, isEnabled: false })
  setUnlocked()
}

// ── Auto-lock delay helpers ───────────────────────────────────────────────────

export function autoLockDelayFromString(value: string): number {
  switch (value) {
    case 'immediately': return 0
    case '1m': return 60_000
    case '5m': return 300_000
    case '15m': return 900_000
    case 'never': return -1
    default: return 60_000
  }
}

export function autoLockDelayToString(ms: number): string {
  switch (ms) {
    case 0: return 'immediately'
    case 60_000: return '1m'
    case 300_000: return '5m'
    case 900_000: return '15m'
    default: return 'never'
  }
}
