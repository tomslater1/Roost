import { useState, useCallback } from "react";
import { Navigate, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Home, Lock } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { useAuthContext } from "@/context/AuthContext";
import { useHome, useCurrencyFormat } from "@/hooks/useHome";
import { useApp } from "../context/AppContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

// ── Constants ─────────────────────────────────────────────────────────────────

const ease = [0.16, 1, 0.3, 1] as const;
export const INCOME_SETUP_DISMISSED_KEY = "roost-income-setup-dismissed";

// ── Detection utility ─────────────────────────────────────────────────────────

export function shouldShowIncomeSetup(
  hasCompletedOnboarding: boolean,
  hasAnyIncome: boolean
): boolean {
  // Show if: onboarding complete but income never set
  return hasCompletedOnboarding && !hasAnyIncome;
}

// ── Currency symbol helper ────────────────────────────────────────────────────

function getCurrencySymbol(currency: string): string {
  return (
    new Intl.NumberFormat("en-GB", { style: "currency", currency })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? "£"
  );
}

// ── Stagger delays ────────────────────────────────────────────────────────────

const DELAYS = [0, 0.06, 0.12, 0.18, 0.24, 0.30, 0.36, 0.42];

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Currency-prefixed input ───────────────────────────────────────────────────

function CurrencyInput({
  symbol,
  value,
  onChange,
  placeholder,
  id,
}: {
  symbol: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  id: string;
}) {
  return (
    <div className="relative flex items-center">
      <span className="absolute left-3.5 text-muted-foreground text-lg font-normal select-none pointer-events-none">
        {symbol}
      </span>
      <Input
        id={id}
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8 text-lg h-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function IncomeSetup() {
  const navigate = useNavigate();
  const { session } = useAuthContext();
  const { home } = useHome();
  const { setIncome, partnerMember } = useApp();
  const fmt = useCurrencyFormat();

  const currency = home?.currency_symbol ?? "GBP";
  const currencySymbol = getCurrencySymbol(currency);
  const partnerName = partnerMember?.display_name ?? "Your partner";

  const [myIncome, setMyIncome] = useState("");
  const [partnerIncome, setPartnerIncome] = useState("");
  const [keepPrivate, setKeepPrivate] = useState(false);

  // Auth guards — must be rendered as components, not hooks
  if (!session) return <Navigate to="/welcome" replace />;
  if (!home) return <Navigate to="/setup" replace />;

  // Null when the field was never touched; 0 is a valid entered value
  const myAmount = myIncome !== "" ? (parseFloat(myIncome) || 0) : null;
  const partnerAmount = partnerIncome !== "" ? (parseFloat(partnerIncome) || 0) : null;
  const combined = (myAmount ?? 0) + (partnerAmount ?? 0);
  const bothEmpty = myIncome === "" && partnerIncome === "";
  const zeroIncomeNote = !bothEmpty && combined === 0;

  const handleSetUp = useCallback(async () => {
    const month = format(startOfMonth(new Date()), "yyyy-MM-dd");
    await setIncome.mutateAsync({
      month,
      tom_amount: myAmount,
      partner_amount: partnerAmount,
      combined_amount: combined,
      notes: keepPrivate ? "private" : null,
    });
    navigate("/dashboard", { replace: true });
  }, [setIncome, myAmount, partnerAmount, combined, keepPrivate, navigate]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(INCOME_SETUP_DISMISSED_KEY, "true");
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-[440px] space-y-8">

        {/* ── Icon + heading ── */}
        <div className="flex flex-col items-center text-center space-y-4">
          <Reveal delay={DELAYS[0]}>
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, ease }}
              className="w-16 h-16 rounded-[20px] bg-primary/10 flex items-center justify-center"
            >
              <Home className="w-8 h-8 text-primary" />
            </motion.div>
          </Reveal>

          <Reveal delay={DELAYS[1]} className="space-y-2">
            <h1 className="text-2xl font-medium text-foreground">
              Your financial picture, together.
            </h1>
            <p className="text-sm text-muted-foreground max-w-[380px] leading-relaxed">
              Roost works best when it knows your combined monthly take-home.
              Add your income and we'll show you exactly how your household is
              doing — what comes in, what goes out, and what you save.
            </p>
          </Reveal>
        </div>

        {/* ── Income inputs ── */}
        <div className="space-y-4">
          {/* Your income */}
          <Reveal delay={DELAYS[2]} className="space-y-1.5">
            <label
              htmlFor="my-income"
              className="text-sm font-medium text-foreground"
            >
              Your monthly take-home
            </label>
            <CurrencyInput
              id="my-income"
              symbol={currencySymbol}
              value={myIncome}
              onChange={setMyIncome}
              placeholder="e.g. 2500"
            />
          </Reveal>

          {/* Partner income */}
          <Reveal delay={DELAYS[3]} className="space-y-1.5">
            <label
              htmlFor="partner-income"
              className="text-sm font-medium text-foreground"
            >
              {partnerName}&rsquo;s monthly take-home
            </label>
            <CurrencyInput
              id="partner-income"
              symbol={currencySymbol}
              value={partnerIncome}
              onChange={setPartnerIncome}
              placeholder="e.g. 2000"
            />
          </Reveal>

          {/* Combined total */}
          <Reveal delay={DELAYS[4]}>
            <div className="rounded-[16px] bg-muted/50 border border-border/60 px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Combined household income
              </p>
              <motion.p
                key={combined}
                initial={{ opacity: 0.6, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease }}
                className="text-lg font-medium text-foreground tabular-nums"
              >
                {fmt(combined)}
              </motion.p>
            </div>
            {/* Zero-income note — shown when user has typed but combined is 0 */}
            {zeroIncomeNote && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease }}
                className="text-xs text-muted-foreground mt-2 px-1"
              >
                With no income set, Roost will track spending without a surplus calculation.
              </motion.p>
            )}
          </Reveal>

          {/* Privacy toggle */}
          <Reveal delay={DELAYS[5]}>
            <label className="flex items-start gap-3 cursor-pointer group select-none">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={keepPrivate}
                  onChange={(e) => setKeepPrivate(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    keepPrivate
                      ? "bg-primary border-primary"
                      : "bg-background border-border group-hover:border-primary/50"
                  }`}
                >
                  {keepPrivate && (
                    <svg
                      viewBox="0 0 12 12"
                      fill="none"
                      className="w-2.5 h-2.5"
                    >
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  Keep individual amounts private
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Only you will see the breakdown — the app shows your combined
                  total everywhere else
                </p>
              </div>
            </label>
          </Reveal>
        </div>

        {/* ── Actions ── */}
        <div className="space-y-3">
          <Reveal delay={DELAYS[6]}>
            <Button
              className="w-full h-11 text-sm"
              disabled={bothEmpty || setIncome.isPending}
              onClick={handleSetUp}
            >
              {setIncome.isPending ? "Saving…" : "Set up our finances →"}
            </Button>
          </Reveal>

          <Reveal delay={DELAYS[7]} className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              I'll do this later
            </button>
            <p className="text-xs text-muted-foreground/60 text-center">
              Your income data stays private in your home. We never share it.
            </p>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
