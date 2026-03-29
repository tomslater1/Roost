import { useState } from "react"
import { useNavigate } from "react-router"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { motion, AnimatePresence } from "motion/react"
import { Home, Users, LogOut } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuthContext } from "@/context/AuthContext"
import appIcon from "@/assets/app-icon.png"

type Mode = "create" | "join"

const ease = [0.43, 0.13, 0.23, 0.96] as const
const spring = { type: "spring" as const, stiffness: 400, damping: 17 }

export function Setup() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthContext()
  const pendingCode = (() => {
    const code = localStorage.getItem('roost_pending_invite_code')
    if (code) localStorage.removeItem('roost_pending_invite_code')
    return code
  })()

  const [mode, setMode] = useState<Mode | null>(pendingCode ? 'join' : null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const suggestedName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mode) return
    setIsLoading(true)
    setError(null)
    const form = e.currentTarget as HTMLFormElement
    const displayName = (form.querySelector("#name") as HTMLInputElement)?.value.trim() || "User"

    try {
      if (mode === "create") {
        const homeName = (form.querySelector("#homeName") as HTMLInputElement)?.value.trim() || "Our Home"
        const { error } = await supabase.rpc("create_home_for_user", {
          home_name: homeName,
          display_name: displayName,
        })
        if (error) throw error
      } else {
        const inviteCode = (form.querySelector("#inviteCode") as HTMLInputElement)?.value.trim().toUpperCase()
        if (!inviteCode) throw new Error("Please enter an invite code")
        const { error } = await supabase.rpc("join_home_by_invite_code", {
          code: inviteCode,
          display_name: displayName,
        })
        if (error) throw new Error(error.message.includes("Invalid invite code") ? "That invite code doesn't match any home" : error.message)
      }

      await queryClient.invalidateQueries({ queryKey: ["home"] })
      navigate("/dashboard")
    } catch (e: any) {
      setError(e.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex justify-center mb-6"
        >
          <img src={appIcon} alt="Roost" className="w-14 h-14 rounded-xl object-cover shadow-md select-none" />
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl font-medium text-foreground">Almost there</h1>
          <p className="text-sm text-muted-foreground mt-1">Just a couple of details to get started</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18, ease }}
          className="bg-card border border-border rounded-xl shadow-sm p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25, ease }}
              className="space-y-2"
            >
              <Label htmlFor="name">What should we call you?</Label>
              <Input
                id="name"
                placeholder="Your name"
                defaultValue={suggestedName}
                autoComplete="given-name"
                required
              />
              <p className="text-xs text-muted-foreground">
                This is how your partner will see you in the app
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.3, ease }}
              className="h-px bg-border"
            />

            {/* Mode picker */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.32, ease }}
              className="space-y-2"
            >
              <Label>Your household</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "create" as Mode, icon: Home, label: "Create new", sub: "Start fresh" },
                  { value: "join" as Mode, icon: Users, label: "Join existing", sub: "Have a code?" },
                ].map(({ value, icon: Icon, label, sub }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    className={[
                      "flex flex-col items-center gap-2 p-4 rounded-lg border text-center transition-all duration-200",
                      mode === value
                        ? "border-primary bg-primary/8 text-primary"
                        : "border-border bg-background hover:bg-muted/60 text-foreground",
                    ].join(" ")}
                  >
                    <div className={[
                      "w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-200",
                      mode === value ? "bg-primary/15" : "bg-muted",
                    ].join(" ")}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Conditional fields */}
            <AnimatePresence mode="wait">
              {mode === "create" && (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease }}
                  className="space-y-2"
                >
                  <Label htmlFor="homeName">
                    Name your home{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input id="homeName" placeholder="e.g. The Smith House" />
                  <p className="text-xs text-muted-foreground">You can always rename it later in Settings</p>
                </motion.div>
              )}

              {mode === "join" && (
                <motion.div
                  key="join"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease }}
                  className="space-y-2"
                >
                  <Label htmlFor="inviteCode">Invite code</Label>
                  <Input
                    id="inviteCode"
                    placeholder="e.g. A1B2C3D4"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    className="font-mono tracking-widest uppercase"
                    defaultValue={pendingCode ?? ''}
                    onChange={e => { e.target.value = e.target.value.toUpperCase() }}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Your partner can find this in Settings → Household → Invite code
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive overflow-hidden"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {mode && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.2, ease }}
                >
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring}>
                    <Button type="submit" className="w-full h-11" disabled={isLoading}>
                      {isLoading
                        ? mode === "create" ? "Setting up…" : "Joining…"
                        : mode === "create" ? "Create my home" : "Join household"
                      }
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </form>
        </motion.div>

        {/* Sign out escape hatch */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="mt-6 text-center"
        >
          <button
            onClick={() => supabase.auth.signOut()}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Sign out
          </button>
        </motion.div>

      </div>
    </div>
  )
}
