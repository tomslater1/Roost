import { useRef } from "react"
import {
  Bell, Monitor, Smartphone, CheckCircle2, Receipt,
  ShoppingCart, Handshake, Moon, ChevronUp, ChevronDown,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent } from "../../components/ui/card"
import { Switch } from "../../components/ui/switch"
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences"
import type { NotificationPrefs } from "@/lib/schemas/notifications"

const ease = [0.16, 1, 0.3, 1] as const
const spring = { type: "spring" as const, stiffness: 400, damping: 17 }

// ── Time spinner unit ────────────────────────────────────────────────────────
// A single column (hours or minutes) with animated drum-scroll numbers.

const numVariants = {
  enter: (dir: number) => ({ y: dir * 14, opacity: 0, scale: 0.85 }),
  center: { y: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ y: dir * -14, opacity: 0, scale: 0.85 }),
}

interface TimeUnitProps {
  value: number
  wrap: number   // modulus (24 for hours, 60 for minutes)
  step: number
  label: string
  onChange: (v: number) => void
}

function TimeUnit({ value, wrap, step, label, onChange }: TimeUnitProps) {
  // Use a ref so direction is always current when AnimatePresence reads custom
  const dirRef = useRef(0)

  const inc = () => {
    dirRef.current = 1
    onChange((value + step) % wrap)
  }

  const dec = () => {
    dirRef.current = -1
    onChange((value - step + wrap) % wrap)
  }

  const display = String(value).padStart(2, "0")

  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* Up button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.85 }}
        transition={spring}
        onClick={inc}
        className="w-8 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        aria-label={`Increase ${label}`}
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </motion.button>

      {/* Animated number */}
      <div className="h-10 w-10 relative overflow-hidden flex items-center justify-center select-none">
        <AnimatePresence mode="popLayout" custom={dirRef.current}>
          <motion.span
            key={value}
            custom={dirRef.current}
            variants={numVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.14, ease }}
            className="absolute text-xl font-semibold tabular-nums tracking-tight"
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Down button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.85 }}
        transition={spring}
        onClick={dec}
        className="w-8 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        aria-label={`Decrease ${label}`}
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </motion.button>

      {/* Unit label */}
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mt-0.5">
        {label}
      </span>
    </div>
  )
}

// ── Time picker ──────────────────────────────────────────────────────────────

interface TimePickerProps {
  value: string       // "HH:MM"
  onChange: (v: string) => void
  label: string
}

function TimePicker({ value, onChange, label }: TimePickerProps) {
  const parts = value.split(":")
  const h = parseInt(parts[0] ?? "0", 10)
  const m = parseInt(parts[1] ?? "0", 10)

  const setH = (newH: number) =>
    onChange(`${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}`)

  const setM = (newM: number) =>
    onChange(`${String(h).padStart(2, "0")}:${String(newM).padStart(2, "0")}`)

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="inline-flex items-end gap-1 px-4 py-3 bg-muted/40 border border-border/70 rounded-2xl">
        <TimeUnit value={h} wrap={24} step={1} label="hr"  onChange={setH} />
        {/* Colon separator */}
        <div className="flex flex-col items-center pb-[1.625rem] px-0.5">
          <span className="text-xl font-semibold text-muted-foreground leading-none">:</span>
        </div>
        <TimeUnit value={m} wrap={60} step={5} label="min" onChange={setM} />
      </div>
    </div>
  )
}

// ── Shared row component ─────────────────────────────────────────────────────

interface PrefRowProps {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  title: string
  description: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  disabled?: boolean
  badge?: React.ReactNode
}

function PrefRow({
  icon: Icon, iconBg, iconColor, title, description,
  checked, onCheckedChange, disabled, badge,
}: PrefRowProps) {
  return (
    <motion.div
      layout
      className={`flex items-center justify-between gap-4 transition-opacity ${
        disabled ? "opacity-40 pointer-events-none" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{title}</p>
            {badge}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </motion.div>
  )
}

function SoonBadge() {
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
      Soon
    </span>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h3 className="font-medium mb-0.5">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function Notifications() {
  const { prefs, isLoading, updatePrefs } = useNotificationPreferences()

  function set<K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) {
    updatePrefs({ [key]: value })
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* ── Delivery channels ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease }}
      >
        <Card>
          <CardContent className="p-6">
            <SectionHeader
              title="Delivery"
              description="Choose where your notifications appear. These settings only affect you."
            />
            <div className="space-y-5">
              <PrefRow
                icon={Bell}
                iconBg="bg-primary/10"
                iconColor="text-primary"
                title="In-app"
                description="Notification bell, badge count, and panel"
                checked={prefs.in_app_enabled}
                onCheckedChange={(v) => set("in_app_enabled", v)}
              />
              <PrefRow
                icon={Monitor}
                iconBg="bg-muted"
                iconColor="text-muted-foreground"
                title="macOS notifications"
                description="Pop up in the corner of your screen"
                checked={prefs.macos_enabled}
                onCheckedChange={(v) => set("macos_enabled", v)}
              />
              <PrefRow
                icon={Smartphone}
                iconBg="bg-muted"
                iconColor="text-muted-foreground"
                title="iOS"
                description="Push notifications on your iPhone"
                checked={false}
                onCheckedChange={() => {}}
                disabled
                badge={<SoonBadge />}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Notification types ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05, ease }}
      >
        <Card>
          <CardContent className="p-6">
            <SectionHeader
              title="What you hear about"
              description="Control which activity from your household triggers a notification."
            />
            <div className="space-y-5">
              <PrefRow
                icon={CheckCircle2}
                iconBg="bg-primary/10"
                iconColor="text-primary"
                title="Chores"
                description="When your partner completes or is assigned a chore"
                checked={prefs.chores_enabled}
                onCheckedChange={(v) => set("chores_enabled", v)}
              />
              <PrefRow
                icon={Receipt}
                iconBg="bg-[#e6a563]/10"
                iconColor="text-[#e6a563]"
                title="Expenses"
                description="When a new expense is logged by your partner"
                checked={prefs.expenses_enabled}
                onCheckedChange={(v) => set("expenses_enabled", v)}
              />
              <PrefRow
                icon={ShoppingCart}
                iconBg="bg-secondary/20"
                iconColor="text-secondary-foreground"
                title="Shopping list"
                description="When items are added to or removed from the list"
                checked={prefs.shopping_enabled}
                onCheckedChange={(v) => set("shopping_enabled", v)}
              />
              <PrefRow
                icon={Handshake}
                iconBg="bg-[#7fa087]/10"
                iconColor="text-[#7fa087]"
                title="Settlements"
                description="When a balance is settled between you"
                checked={prefs.settlements_enabled}
                onCheckedChange={(v) => set("settlements_enabled", v)}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Quiet hours ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1, ease }}
      >
        <Card>
          <CardContent className="p-6">
            <SectionHeader
              title="Quiet hours"
              description="Silence macOS notifications during these hours. In-app notifications are unaffected."
            />
            <div className="space-y-5">
              <PrefRow
                icon={Moon}
                iconBg="bg-muted"
                iconColor="text-muted-foreground"
                title="Enable quiet hours"
                description="macOS notifications will be suppressed during the window below"
                checked={prefs.quiet_hours_enabled}
                onCheckedChange={(v) => set("quiet_hours_enabled", v)}
              />

              {/* Time pickers — animate in when quiet hours enabled */}
              <AnimatePresence initial={false}>
                {prefs.quiet_hours_enabled && (
                  <motion.div
                    key="time-pickers"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 flex items-start gap-6 flex-wrap">
                      <TimePicker
                        label="From"
                        value={prefs.quiet_hours_start}
                        onChange={(v) => set("quiet_hours_start", v)}
                      />
                      <TimePicker
                        label="To"
                        value={prefs.quiet_hours_end}
                        onChange={(v) => set("quiet_hours_end", v)}
                      />
                      <p className="text-xs text-muted-foreground self-end pb-2 max-w-xs">
                        Overnight ranges work — e.g. 22:00 to 08:00 silences notifications through the night.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

    </div>
  )
}
