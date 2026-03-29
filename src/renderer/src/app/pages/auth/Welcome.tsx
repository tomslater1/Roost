import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Separator } from "../../components/ui/separator"
import { motion, AnimatePresence } from "motion/react"
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useAuthContext } from "@/context/AuthContext"
import appIcon from "@/assets/app-icon.png"

type View = "main" | "signup"

const ease = [0.43, 0.13, 0.23, 0.96] as const
const spring = { type: "spring" as const, stiffness: 400, damping: 17 }

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export function Welcome() {
  const { loading, googlePending, oauthError, clearOauthError } = useAuthContext()
  const [view, setView] = useState<View>("main")
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [alreadyExists, setAlreadyExists] = useState(false)
  const [notConfirmed, setNotConfirmed] = useState(false)
  const [pendingEmail, setPendingEmail] = useState("")
  const [resentDone, setResentDone] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const { signIn, signUp, signInWithGoogle, resendConfirmation } = useAuth()

  const passwordLongEnough = password.length >= 6
  const passwordsMatch = passwordLongEnough && confirmPassword.length > 0 && password === confirmPassword
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword

  const resetState = () => {
    setError(null)
    setEmailSent(false)
    setAlreadyExists(false)
    setNotConfirmed(false)
    setPendingEmail("")
    setResentDone(false)
    setPassword("")
    setConfirmPassword("")
  }

  const goSignup = () => { resetState(); setView("signup") }
  const goMain   = () => { resetState(); setView("main") }

  const handleGoogleAuth = async () => {
    setGoogleLoading(true)
    clearOauthError()
    setError(null)
    try {
      await signInWithGoogle()
      setGoogleLoading(false)
    } catch (e: any) {
      setError(e.message)
      setGoogleLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setNotConfirmed(false)
    const form = e.currentTarget as HTMLFormElement
    const email = (form.querySelector("#email") as HTMLInputElement).value
    const password = (form.querySelector("#password") as HTMLInputElement).value
    try {
      await signIn(email, password)
    } catch (e: any) {
      if (e.message === 'EMAIL_NOT_CONFIRMED') {
        setPendingEmail(email)
        setNotConfirmed(true)
      } else {
        setError(e.message)
      }
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!pendingEmail) return
    setResentDone(false)
    try {
      await resendConfirmation(pendingEmail)
      setResentDone(true)
    } catch {
      // silent — user can try again
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordsMatch) return
    setIsLoading(true)
    setError(null)
    setAlreadyExists(false)
    const form = e.currentTarget as HTMLFormElement
    const email = (form.querySelector("#su-email") as HTMLInputElement).value
    try {
      await signUp(email, password)
    } catch (e: any) {
      if (e.message === "EMAIL_CONFIRMATION_REQUIRED") {
        setEmailSent(true)
      } else if (e.message.toLowerCase().includes("already")) {
        setAlreadyExists(true)
      } else {
        setError(e.message)
      }
      setIsLoading(false)
    }
  }

  // Show a full-screen loading state while Google OAuth tokens are being
  // processed after the page reload — prevents the sign-in form flashing.
  if (loading || googlePending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          className="flex flex-col items-center gap-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="w-14 h-14 select-none"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <img src={appIcon} alt="Roost" className="w-full h-full" />
          </motion.div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground">
              {googlePending ? "Signing you in…" : "Loading…"}
            </p>
            {googlePending && (
              <p className="text-xs text-muted-foreground">Just a moment while we set things up</p>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">

        {/* Logo — animates once on mount, stays put */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex justify-center mb-6"
        >
          <img src={appIcon} alt="Roost" className="w-14 h-14 select-none" />
        </motion.div>

        {/* Heading — crossfades between views */}
        <div className="text-center mb-6 h-14 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease }}
            >
              {view === "main" ? (
                <>
                  <h1 className="text-2xl font-medium text-foreground">Welcome to Roost</h1>
                  <p className="text-sm text-muted-foreground mt-1">Manage your home together, beautifully</p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-medium text-foreground">Create your account</h1>
                  <p className="text-sm text-muted-foreground mt-1">You'll set up your home right after</p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">

          {/* ── MAIN (sign in) ── */}
          {view === "main" && (
            <motion.div
              key="main"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.3, ease }}
              className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4"
            >
              {/* OAuth error (e.g. Supabase server_error on Google callback) */}
              <AnimatePresence>
                {oauthError && (
                  <motion.p
                    key="oauth-err"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-destructive overflow-hidden"
                  >
                    Google sign-in failed: {oauthError}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Google — primary CTA */}
              <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} transition={spring}>
                <Button
                  variant="outline"
                  className="w-full h-11 gap-2"
                  onClick={handleGoogleAuth}
                  disabled={googleLoading || isLoading}
                >
                  <GoogleIcon />
                  {googleLoading ? "Connecting…" : "Sign in with Google"}
                </Button>
              </motion.div>

              <div className="relative">
                <Separator />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  or
                </span>
              </div>

              {/* Email sign-in form — inline, no extra step */}
              <form onSubmit={handleSignIn} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <AnimatePresence>
                  {error && !notConfirmed && (
                    <motion.p
                      key="err"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-destructive overflow-hidden"
                    >
                      {error}
                    </motion.p>
                  )}
                  {notConfirmed && (
                    <motion.div
                      key="not-confirmed"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-warning/10 border border-warning/20 rounded-lg px-3 py-3 space-y-2">
                        <p className="text-xs font-medium text-foreground">
                          You haven't confirmed your email yet
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Check your inbox for a confirmation link{pendingEmail ? ` sent to ${pendingEmail}` : ""}. Click it, then come back to sign in.
                        </p>
                        <div className="flex items-center gap-3 pt-0.5">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={spring}
                            onClick={handleResend}
                            className="flex items-center gap-1.5 text-xs text-primary font-medium hover:opacity-80 transition-opacity"
                          >
                            <RotateCcw className="w-3 h-3" />
                            {resentDone ? "Sent!" : "Resend email"}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring}>
                  <Button type="submit" className="w-full h-11" disabled={isLoading || googleLoading}>
                    {isLoading ? "Signing in…" : "Sign in"}
                  </Button>
                </motion.div>
              </form>

              {/* Create account — visually smaller, clearly secondary */}
              <div className="pt-1">
                <div className="relative">
                  <Separator />
                </div>
                <div className="pt-4 text-center">
                  <p className="text-xs text-muted-foreground mb-2">Don't have an account?</p>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground hover:text-foreground"
                      onClick={goSignup}
                      disabled={isLoading || googleLoading}
                    >
                      Create a new account
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── SIGN UP ── */}
          {view === "signup" && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.3, ease }}
              className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-5"
            >
              {/* Google — also works for new users */}
              <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} transition={spring}>
                <Button
                  variant="outline"
                  className="w-full h-11 gap-2"
                  onClick={handleGoogleAuth}
                  disabled={googleLoading || isLoading}
                >
                  <GoogleIcon />
                  {googleLoading ? "Connecting…" : "Continue with Google"}
                </Button>
              </motion.div>

              <div className="relative">
                <Separator />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  or
                </span>
              </div>

              <AnimatePresence mode="wait">
                {emailSent ? (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25, ease }}
                    className="text-center py-3 space-y-3"
                  >
                    <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center mx-auto text-xl">
                      ✉️
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-sm">Check your email</p>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        We sent you a confirmation link. Click it, then come back to sign in.
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={spring}
                      onClick={goMain}
                      className="text-sm text-primary underline underline-offset-2 font-medium"
                    >
                      Go to sign in →
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="su-email">Email</Label>
                      <Input
                        id="su-email"
                        type="email"
                        placeholder="your@email.com"
                        autoComplete="email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="su-password">Password</Label>
                      <Input
                        id="su-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                      <AnimatePresence>
                        {password.length > 0 && password.length < 6 && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-xs text-muted-foreground overflow-hidden"
                          >
                            Must be at least 6 characters
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="su-confirm">Confirm password</Label>
                      <div className="relative">
                        <Input
                          id="su-confirm"
                          type="password"
                          autoComplete="new-password"
                          required
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="pr-9"
                        />
                        <AnimatePresence>
                          {confirmPassword.length > 0 && (
                            <motion.div
                              key={passwordsMatch ? "match" : "mismatch"}
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.7 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                            >
                              {passwordsMatch
                                ? <CheckCircle2 className="w-4 h-4 text-[#7fa087]" />
                                : <XCircle className="w-4 h-4 text-muted-foreground" />
                              }
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <AnimatePresence>
                        {passwordMismatch && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-xs text-muted-foreground overflow-hidden"
                          >
                            Passwords don't match yet
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <AnimatePresence>
                      {alreadyExists && (
                        <motion.div
                          key="exists"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-warning/10 border border-warning/20 rounded-lg px-3 py-2.5">
                            <p className="text-xs text-foreground font-medium">
                              Looks like you already have an account.
                            </p>
                            <button
                              type="button"
                              onClick={goMain}
                              className="text-xs text-primary underline underline-offset-2 mt-1 font-medium hover:opacity-80 transition-opacity"
                            >
                              Sign in instead →
                            </button>
                          </div>
                        </motion.div>
                      )}
                      {error && (
                        <motion.p
                          key="err"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-sm text-destructive overflow-hidden"
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring}>
                      <Button type="submit" className="w-full h-11" disabled={isLoading || googleLoading || !passwordsMatch}>
                        {isLoading ? "Creating account…" : "Create account"}
                      </Button>
                    </motion.div>
                  </motion.form>
                )}
              </AnimatePresence>

              {!emailSent && (
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    onClick={goMain}
                    className="text-foreground underline underline-offset-2 hover:text-primary transition-colors font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back link — only on signup view */}
        <div className="mt-6 text-center h-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {view === "signup" && (
              <motion.div
                key="back"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.15, duration: 0.25 } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                <button
                  onClick={goMain}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to sign in
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
