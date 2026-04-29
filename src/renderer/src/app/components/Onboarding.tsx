import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { useOnboarding } from "../context/OnboardingContext";

interface OnboardingStep {
  target?: string;
  title: string;
  description: string;
  route: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  offset?: { x: number; y: number };
}

const steps: OnboardingStep[] = [
  // Step 0 — Welcome
  {
    title: "Welcome to Roost! 🏡",
    description: "Let's take a quick tour to show you how to manage your household together. This will only take a minute!",
    route: "/dashboard",
    placement: "center",
  },
  // Step 1 — Balance card (dashboard)
  {
    target: "[data-onboarding='balance-card']",
    title: "Track your balance",
    description: "See who owes what at a glance. Roost automatically calculates balances from your shared expenses.",
    route: "/dashboard",
    placement: "top",
  },
  // Step 2 — Quick actions
  {
    target: "[data-onboarding='quick-actions']",
    title: "Quick actions",
    description: "Add items, expenses, and chores instantly from anywhere in the app with these handy buttons.",
    route: "/dashboard",
    placement: "bottom",
  },
  // Step 3 — Notifications
  {
    target: "[data-onboarding-trigger='notifications']",
    title: "Stay in sync",
    description: "Your notification bell shows everything happening in your household in real-time — expenses added, chores completed, and more.",
    route: "/dashboard",
    placement: "bottom",
  },
  // Step 4 — Shopping
  {
    target: "[data-onboarding='nav-shopping']",
    title: "Shopping lists",
    description: "Create shared shopping lists that sync between you and your partner. Never forget the milk again!",
    route: "/shopping",
    placement: "top",
  },
  // Step 5 — Money hub (replaces old Expense tracking + Manage expenses steps)
  {
    target: "[data-onboarding='nav-budget']",
    title: "Money",
    description: "Money is your household financial hub. Log what you spend, set budgets, track bills, and save toward goals — together.",
    route: "/money",
    placement: "top",
  },
  // Step 6 — Balance card on Money (NEW)
  {
    target: "[data-onboarding='money-balance-card']",
    title: "Who's paid more?",
    description: "The balance card shows who's paid more this month. Tap Settle up when you're ready to square things off.",
    route: "/money",
    placement: "top",
  },
  // Step 7 — Bills & Goals (NEW)
  {
    target: "[data-onboarding='money-bills-goals']",
    title: "Bills & Goals",
    description: "Add your regular bills like rent and broadband. Roost puts them in a calendar so nothing sneaks up on you.",
    route: "/money",
    placement: "top",
  },
  // Step 8 — Chores
  {
    target: "[data-onboarding='nav-chores']",
    title: "Chore management",
    description: "Assign and track household chores. Everyone knows what needs to be done!",
    route: "/chores",
    placement: "top",
  },
  // Step 9 — Calendar
  {
    target: "[data-onboarding='nav-calendar']",
    title: "Shared calendar",
    description: "Keep track of important dates, upcoming bills, and your next shop — all in one place.",
    route: "/calendar",
    placement: "top",
  },
  // Step 10 — Profile / settings
  {
    target: "[data-onboarding-trigger='profile']",
    title: "Customise your experience",
    description: "Update your profile, manage your household, invite your partner, and adjust preferences from the profile menu.",
    route: "/dashboard",
    placement: "bottom",
  },
  // Step 11 — Done
  {
    title: "You're all set! 🎉",
    description: "You now know the basics of Roost. Start managing your household together and make life a little easier!",
    route: "/dashboard",
    placement: "center",
  },
];

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Tooltip dimensions (fixed width, estimated max height)
const TOOLTIP_W = 400;
const TOOLTIP_H = 230; // conservative max — ensures vertical clamping never under-corrects
const EDGE_MARGIN = 16;
const PAD = 12;

export function Onboarding() {
  const { isOnboardingActive, currentStep, totalSteps, skipOnboarding, nextStep, prevStep } =
    useOnboarding();
  const navigate = useNavigate();
  const location = useLocation();

  const step = steps[currentStep];

  const [targetPos, setTargetPos] = useState<TargetRect | null>(null);

  // ── Navigate & measure target ───────────────────────────────────────────
  useEffect(() => {
    if (!isOnboardingActive || !step) {
      setTargetPos(null);
      return;
    }

    setTargetPos(null);

    if (location.pathname !== step.route) {
      navigate(step.route);
      return;
    }

    if (!step.target) return;

    let raf2: number;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const el = document.querySelector(step.target!) as HTMLElement | null;
        if (!el) return;

        el.scrollIntoView({ behavior: "instant", block: "nearest" });

        requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          setTargetPos({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });
        });
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [currentStep, isOnboardingActive, location.pathname, step, navigate]);

  // ── Tooltip position — fully pre-clamped, no transforms on non-center steps ──
  // We avoid transform: translateX(-50%) on targeted steps because Framer Motion
  // overrides the `transform` property when animating scale/y, discarding the
  // centering offset. Instead we compute the exact clamped pixel position upfront.
  const getTooltipStyle = (): React.CSSProperties => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const base: React.CSSProperties = { position: "fixed", zIndex: 10001 };

    // Center placement (and no-target fallback): use CSS centering.
    // Framer Motion only animates opacity here so it won't touch `transform`.
    if (step?.placement === "center" || !targetPos) {
      return {
        ...base,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: "500px",
        width: "calc(100% - 32px)",
      };
    }

    const { offset = { x: 0, y: 0 } } = step ?? {};

    // Horizontal: centre over target's midpoint, clamped to viewport
    const cx = targetPos.left + targetPos.width / 2 + offset.x;
    const left = Math.max(
      EDGE_MARGIN,
      Math.min(vw - TOOLTIP_W - EDGE_MARGIN, cx - TOOLTIP_W / 2)
    );

    switch (step?.placement) {
      case "bottom": {
        const top = Math.min(
          vh - TOOLTIP_H - EDGE_MARGIN,
          targetPos.top + targetPos.height + PAD + offset.y
        );
        return { ...base, width: `${TOOLTIP_W}px`, top: `${Math.max(EDGE_MARGIN, top)}px`, left: `${left}px` };
      }

      case "top": {
        // Tooltip sits above the target — compute top of tooltip
        const top = Math.max(
          EDGE_MARGIN,
          targetPos.top - PAD - TOOLTIP_H + offset.y
        );
        return { ...base, width: `${TOOLTIP_W}px`, top: `${top}px`, left: `${left}px` };
      }

      case "left": {
        const right = Math.max(
          EDGE_MARGIN,
          vw - targetPos.left + PAD - offset.x
        );
        const top = Math.max(
          EDGE_MARGIN,
          Math.min(vh - TOOLTIP_H - EDGE_MARGIN, targetPos.top + targetPos.height / 2 - TOOLTIP_H / 2 + offset.y)
        );
        return { ...base, width: `${TOOLTIP_W}px`, right: `${right}px`, top: `${top}px` };
      }

      case "right": {
        const leftR = Math.min(
          vw - TOOLTIP_W - EDGE_MARGIN,
          targetPos.left + targetPos.width + PAD + offset.x
        );
        const top = Math.max(
          EDGE_MARGIN,
          Math.min(vh - TOOLTIP_H - EDGE_MARGIN, targetPos.top + targetPos.height / 2 - TOOLTIP_H / 2 + offset.y)
        );
        return { ...base, width: `${TOOLTIP_W}px`, left: `${leftR}px`, top: `${top}px` };
      }

      default:
        return {
          ...base,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          maxWidth: "500px",
          width: "calc(100% - 32px)",
        };
    }
  };

  if (!isOnboardingActive) return null;

  return (
    <AnimatePresence>
      {isOnboardingActive && (
        <>
          {/* Dark overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50"
            style={{ zIndex: 9999 }}
            onClick={skipOnboarding}
          />

          {/* Spotlight */}
          {targetPos && (
            <motion.div
              key={`spotlight-${currentStep}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed pointer-events-none"
              style={{
                top: targetPos.top - 8,
                left: targetPos.left - 8,
                width: targetPos.width + 16,
                height: targetPos.height + 16,
                zIndex: 10000,
                borderRadius: 10,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                outline: "2px solid rgba(255,255,255,0.55)",
              }}
            />
          )}

          {/* Tooltip — opacity-only animation avoids Framer Motion overriding
              the `transform` property and breaking pixel-clamped positioning */}
          <motion.div
            key={`tooltip-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={getTooltipStyle()}
            className="bg-background border-2 border-primary rounded-xl shadow-2xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{step?.title}</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mt-1 -mr-1"
                onClick={skipOnboarding}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-muted-foreground mb-6">{step?.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentStep
                        ? "w-6 bg-primary"
                        : i < currentStep
                        ? "w-1.5 bg-primary/50"
                        : "w-1.5 bg-muted"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <Button variant="outline" size="sm" onClick={prevStep}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                <Button size="sm" onClick={nextStep}>
                  {currentStep === totalSteps - 1 ? (
                    "Get started"
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
