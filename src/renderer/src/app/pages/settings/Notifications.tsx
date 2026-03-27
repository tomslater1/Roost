import {
  Bell, Monitor, Smartphone, CheckCircle2, Receipt,
  ShoppingCart, Handshake, Moon, Pin, CalendarClock,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent } from "../../components/ui/card"
import { Switch } from "../../components/ui/switch"
import { TimePicker } from "../../components/ui/TimePicker"
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences"
import type { NotificationPrefs } from "@/lib/schemas/notifications"

const ease = [0.16, 1, 0.3, 1] as const

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
              <PrefRow
                icon={Pin}
                iconBg="bg-primary/10"
                iconColor="text-primary"
                title="Pinboard"
                description="When someone leaves you or the home a new note"
                checked={prefs.pinboard_enabled}
                onCheckedChange={(v) => set("pinboard_enabled", v)}
              />
              <PrefRow
                icon={CalendarClock}
                iconBg="bg-[#e6a563]/10"
                iconColor="text-[#e6a563]"
                title="Bill reminders"
                description="Recurring rent, mortgage, and bill due-date nudges"
                checked={prefs.bill_reminders_enabled}
                onCheckedChange={(v) => set("bill_reminders_enabled", v)}
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
