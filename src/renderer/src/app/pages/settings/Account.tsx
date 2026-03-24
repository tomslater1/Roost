import { useState } from "react";
import {
  LogOut, DoorOpen, Trash2, AlertTriangle, Sparkles, ChevronRight, X,
  Mail, Lock, Shield, Eye, EyeOff, Send, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useOnboarding } from "../../context/OnboardingContext";
import { useAuthContext } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type ConfirmState = "leave" | "delete" | null;
type SecureStep = "idle" | "sending" | "awaiting" | "submitting";

const ease = [0.16, 1, 0.3, 1] as const;
const spring = { type: "spring" as const, stiffness: 400, damping: 17 };

// ── Shared OTP + field panel ──────────────────────────────────────────────────

interface SecurePanelProps {
  step: SecureStep;
  otp: string;
  onOtpChange: (v: string) => void;
  onSendCode: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  error: string | null;
  userEmail: string;
  children: React.ReactNode; // the new value field(s)
  submitLabel: string;
}

function SecurePanel({
  step, otp, onOtpChange, onSendCode, onCancel, onSubmit,
  error, userEmail, children, submitLabel,
}: SecurePanelProps) {
  const isBusy = step === "sending" || step === "submitting";

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease }}
      className="overflow-hidden"
    >
      <div className="pt-4 space-y-4">
        {/* Step 1: send code */}
        <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Verify it's you first</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step === "idle" || step === "sending"
                  ? `We'll send a 6-digit code to ${userEmail}`
                  : `Enter the 6-digit code sent to ${userEmail}`}
              </p>
            </div>
            {(step === "idle" || step === "sending") && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring}>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 flex-shrink-0"
                  onClick={onSendCode}
                  disabled={isBusy}
                >
                  {step === "sending" ? (
                    <motion.span
                      style={{ display: "flex" }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </motion.span>
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {step === "sending" ? "Sending…" : "Send code"}
                </Button>
              </motion.div>
            )}
          </div>

          {/* OTP input — appears once code is sent */}
          <AnimatePresence>
            {(step === "awaiting" || step === "submitting") && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease }}
                className="flex items-center gap-2"
              >
                <Input
                  value={otp}
                  onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit code"
                  inputMode="numeric"
                  maxLength={6}
                  className="h-9 max-w-[140px] text-center tracking-[0.35em] font-mono text-base"
                  autoFocus
                  disabled={step === "submitting"}
                  onKeyDown={(e) => { if (e.key === "Enter" && otp.length === 6) onSubmit() }}
                />
                <button
                  onClick={onSendCode}
                  disabled={isBusy}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                >
                  Resend
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step 2: new value fields */}
        <AnimatePresence>
          {(step === "awaiting" || step === "submitting") && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease, delay: 0.04 }}
              className="space-y-3"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
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

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {(step === "awaiting" || step === "submitting") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                size="sm"
                className="h-8"
                onClick={onSubmit}
                disabled={step === "submitting" || otp.length !== 6}
              >
                {step === "submitting" ? "Saving…" : submitLabel}
              </Button>
            </motion.div>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-muted-foreground"
            onClick={onCancel}
            disabled={isBusy}
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function Account() {
  const { user } = useAuthContext();
  const { startOnboarding } = useOnboarding();
  const { signOut, leaveHome, deleteAccount } = useAuth();

  const isEmailUser = user?.app_metadata?.provider !== "google";
  const userEmail = user?.email ?? "";

  // ── Confirm state (leave / delete) ────────────────────────────────────────
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [isActioning, setIsActioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Change email ──────────────────────────────────────────────────────────
  const [emailStep, setEmailStep] = useState<SecureStep>("idle");
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  // ── Change password ────────────────────────────────────────────────────────
  const [passwordStep, setPasswordStep] = useState<SecureStep>("idle");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordOtp, setPasswordOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const sendCode = async (action: "email" | "password") => {
    const setStep = action === "email" ? setEmailStep : setPasswordStep;
    const setError = action === "email" ? setEmailError : setPasswordError;
    setStep("sending");
    setError(null);
    const { error } = await supabase.auth.reauthenticate();
    if (error) {
      setError(error.message);
      setStep("idle");
      return;
    }
    setStep("awaiting");
    toast.success("Verification code sent — check your email");
  };

  const resetEmail = () => {
    setEmailStep("idle");
    setEmailOpen(false);
    setEmailOtp("");
    setNewEmail("");
    setEmailError(null);
  };

  const resetPassword = () => {
    setPasswordStep("idle");
    setPasswordOpen(false);
    setPasswordOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setShowPassword(false);
  };

  const submitEmailChange = async () => {
    setEmailError(null);
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailError("Enter a valid email address");
      return;
    }
    if (newEmail.trim() === userEmail) {
      setEmailError("That's already your email address");
      return;
    }
    if (emailOtp.length !== 6) {
      setEmailError("Enter the full 6-digit code");
      return;
    }
    setEmailStep("submitting");
    const { error } = await supabase.auth.updateUser({
      email: newEmail.trim(),
      nonce: emailOtp,
    });
    if (error) {
      setEmailError(
        error.message.toLowerCase().includes("nonce")
          ? "Incorrect code — try again or resend"
          : error.message
      );
      setEmailStep("awaiting");
      return;
    }
    toast.success("Confirmation links sent — check both your current and new email to complete the change");
    resetEmail();
  };

  const submitPasswordChange = async () => {
    setPasswordError(null);
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return;
    }
    if (passwordOtp.length !== 6) {
      setPasswordError("Enter the full 6-digit code");
      return;
    }
    setPasswordStep("submitting");
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      nonce: passwordOtp,
    });
    if (error) {
      setPasswordError(
        error.message.toLowerCase().includes("nonce")
          ? "Incorrect code — try again or resend"
          : error.message
      );
      setPasswordStep("awaiting");
      return;
    }
    toast.success("Password updated");
    resetPassword();
  };

  const handleLeave = async () => {
    setIsActioning(true);
    setActionError(null);
    try {
      await leaveHome();
    } catch (e: any) {
      setActionError(e.message);
      setConfirmState(null);
    } finally {
      setIsActioning(false);
    }
  };

  const handleDelete = async () => {
    setIsActioning(true);
    setActionError(null);
    try {
      await deleteAccount();
    } catch (e: any) {
      setActionError(e.message);
      setConfirmState(null);
      setIsActioning(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">

      {/* ── Security ── */}
      <Card>
        <CardContent className="p-6 space-y-0">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Security</h3>
          </div>

          {!isEmailUser ? (
            // Google user — no password credentials to manage
            <div className="flex items-start gap-3 py-1">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Signed in with Google</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Your email and password are managed by Google — visit your Google account to make changes.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-border/60">

              {/* Change email row */}
              <div className="pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium mb-0.5">Change email</p>
                      <p className="text-sm text-muted-foreground">
                        Currently <span className="font-medium text-foreground">{userEmail}</span>
                      </p>
                    </div>
                  </div>
                  <AnimatePresence mode="wait" initial={false}>
                    {!emailOpen ? (
                      <motion.div
                        key="open-btn"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0 mt-0.5"
                          onClick={() => setEmailOpen(true)}
                        >
                          Change
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="close-indicator"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                      >
                        <span className="text-xs text-muted-foreground mt-2 block">Verifying</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {emailOpen && (
                    <SecurePanel
                      step={emailStep}
                      otp={emailOtp}
                      onOtpChange={setEmailOtp}
                      onSendCode={() => sendCode("email")}
                      onCancel={resetEmail}
                      onSubmit={submitEmailChange}
                      error={emailError}
                      userEmail={userEmail}
                      submitLabel="Update email"
                    >
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          New email address
                        </label>
                        <Input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="new@email.com"
                          className="h-9 max-w-xs"
                          disabled={emailStep === "submitting"}
                          onKeyDown={(e) => { if (e.key === "Enter") submitEmailChange() }}
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
                          You'll need to confirm the change from both your current and new email.
                        </p>
                      </div>
                    </SecurePanel>
                  )}
                </AnimatePresence>
              </div>

              {/* Change password row */}
              <div className="pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium mb-0.5">Change password</p>
                      <p className="text-sm text-muted-foreground">
                        Choose a strong password of at least 8 characters.
                      </p>
                    </div>
                  </div>
                  <AnimatePresence mode="wait" initial={false}>
                    {!passwordOpen ? (
                      <motion.div
                        key="open-btn"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0 mt-0.5"
                          onClick={() => setPasswordOpen(true)}
                        >
                          Change
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="close-indicator"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                      >
                        <span className="text-xs text-muted-foreground mt-2 block">Verifying</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {passwordOpen && (
                    <SecurePanel
                      step={passwordStep}
                      otp={passwordOtp}
                      onOtpChange={setPasswordOtp}
                      onSendCode={() => sendCode("password")}
                      onCancel={resetPassword}
                      onSubmit={submitPasswordChange}
                      error={passwordError}
                      userEmail={userEmail}
                      submitLabel="Update password"
                    >
                      <div className="space-y-2.5 max-w-xs">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                            New password
                          </label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="At least 8 characters"
                              className="h-9 pr-9"
                              disabled={passwordStep === "submitting"}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((s) => !s)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              tabIndex={-1}
                            >
                              {showPassword
                                ? <EyeOff className="w-3.5 h-3.5" />
                                : <Eye className="w-3.5 h-3.5" />
                              }
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                            Confirm new password
                          </label>
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat your new password"
                            className="h-9"
                            disabled={passwordStep === "submitting"}
                            onKeyDown={(e) => { if (e.key === "Enter") submitPasswordChange() }}
                          />
                        </div>
                      </div>
                    </SecurePanel>
                  )}
                </AnimatePresence>
              </div>

            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Tour ── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium mb-0.5">Take the tour again</p>
                <p className="text-sm text-muted-foreground">
                  Replay the guided walkthrough any time — useful if you want to rediscover a feature or show someone how Roost works.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 mt-0.5"
              onClick={startOnboarding}
            >
              Start
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Session ── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <LogOut className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium mb-0.5">Sign out</p>
                <p className="text-sm text-muted-foreground">
                  Sign out of your account on this device. Your data stays safe and you can sign back in any time.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 mt-0.5"
              onClick={() => signOut()}
            >
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Danger zone ── */}
      <Card className="border-destructive/20">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h3 className="font-medium text-destructive text-sm">Danger zone</h3>
          </div>

          {/* Leave household */}
          <div className="space-y-3 pb-5 border-b border-border">
            <div>
              <p className="text-sm font-medium mb-0.5">Leave household</p>
              <p className="text-sm text-muted-foreground">
                Remove yourself from this household. Your partner will remain as the owner and keep all shared data.
              </p>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {confirmState === "leave" ? (
                <motion.div
                  key="confirm-leave"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-amber-700 dark:text-amber-400 flex-1">
                      Are you sure? You'll lose access to this household immediately.
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => setConfirmState(null)}>
                        <X className="w-3.5 h-3.5 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={handleLeave}
                        disabled={isActioning}
                      >
                        <DoorOpen className="w-3.5 h-3.5 mr-1.5" />
                        {isActioning ? "Leaving…" : "Leave"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="btn-leave"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-600 border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-800 dark:hover:bg-amber-950"
                    onClick={() => setConfirmState("leave")}
                    disabled={isActioning}
                  >
                    <DoorOpen className="w-4 h-4 mr-2" />
                    Leave household
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action error */}
          <AnimatePresence>
            {actionError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-destructive overflow-hidden"
              >
                {actionError}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Delete account */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-0.5">Delete account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This cannot be undone — there is no recovery.
              </p>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {confirmState === "delete" ? (
                <motion.div
                  key="confirm-delete"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive flex-1">
                      This is permanent. Your account and all data will be deleted forever.
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => setConfirmState(null)}>
                        <X className="w-3.5 h-3.5 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8"
                        onClick={handleDelete}
                        disabled={isActioning}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        {isActioning ? "Deleting…" : "Delete forever"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="btn-delete"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setConfirmState("delete")}
                    disabled={isActioning}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete my account
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
