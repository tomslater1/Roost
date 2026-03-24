import { useState } from "react";
import { Sparkles, ShoppingCart, Receipt, ListChecks, Wallet, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { isHazelEnabled, setHazelEnabled, type HazelContext } from "@/lib/normalizeInput";

interface SectionToggleProps {
  icon: React.ElementType;
  label: string;
  description: string;
  context: HazelContext;
  enabled: boolean;
  onToggle: (context: HazelContext, enabled: boolean) => void;
}

function SectionToggle({ icon: Icon, label, description, context, enabled, onToggle }: SectionToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-border last:border-0">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        onClick={() => onToggle(context, !enabled)}
        className={`relative flex-shrink-0 mt-0.5 w-11 h-6 rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 ${
          enabled ? "bg-primary" : "bg-muted-foreground/30"
        }`}
        aria-label={`${enabled ? "Disable" : "Enable"} Hazel for ${label}`}
      >
        <motion.span
          className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"
          animate={{ x: enabled ? 18 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 32, mass: 0.8 }}
        />
      </button>
    </div>
  );
}

const SECTIONS: Array<{
  context: HazelContext;
  icon: React.ElementType;
  label: string;
  description: string;
}> = [
  {
    context: "shopping",
    icon: ShoppingCart,
    label: "Shopping list",
    description: "Fixes item names and fills in the right category so your list stays neat without any effort.",
  },
  {
    context: "expense",
    icon: Receipt,
    label: "Expenses",
    description: "Cleans up what you typed and matches the expense to a budget category automatically.",
  },
  {
    context: "chore",
    icon: ListChecks,
    label: "Chores",
    description: "Turns shorthand into clear action phrases so everyone knows exactly what needs doing.",
  },
  {
    context: "budget",
    icon: Wallet,
    label: "Budget",
    description: "Tidies custom category names so your budget headings are consistent and easy to scan.",
  },
];

const EXAMPLES: Array<{
  icon: React.ElementType;
  label: string;
  before: string;
  after: string;
}> = [
  { icon: ShoppingCart, label: "Shopping", before: "oat milk 2l", after: "Oat Milk · Dairy & Eggs" },
  { icon: Receipt,      label: "Expense",  before: "netflix sub", after: "Netflix · Entertainment" },
  { icon: ListChecks,   label: "Chore",    before: "bathrooms",   after: "Clean the bathrooms" },
  { icon: Wallet,       label: "Budget",   before: "eating out",  after: "Dining Out" },
];

export function Hazel() {
  const [toggles, setToggles] = useState<Record<HazelContext, boolean>>(() => ({
    shopping: isHazelEnabled("shopping"),
    expense: isHazelEnabled("expense"),
    chore: isHazelEnabled("chore"),
    budget: isHazelEnabled("budget"),
  }));

  const handleToggle = (context: HazelContext, enabled: boolean) => {
    setHazelEnabled(context, enabled);
    setToggles((prev) => ({ ...prev, [context]: enabled }));
  };

  const enabledCount = Object.values(toggles).filter(Boolean).length;

  return (
    <div className="max-w-2xl space-y-6">

      {/* ── Identity card ── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Hazel</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Powered by Claude · Anthropic</p>
              </div>
            </div>
            <Badge variant={enabledCount > 0 ? "default" : "secondary"} className="mt-1">
              {enabledCount > 0 ? `Active in ${enabledCount} area${enabledCount > 1 ? "s" : ""}` : "Paused"}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Every time you save something in Roost, Hazel takes a quick look at what you typed and
            cleans it up before it's stored — fixing capitalisation, filling in categories, and
            turning shorthand into something both of you will actually recognise later.
          </p>

          <div className="flex flex-wrap gap-2">
            {[
              "Fixes formatting",
              "Auto-categorises",
              "Works silently",
              "Never interrupts",
            ].map((chip) => (
              <span
                key={chip}
                className="text-xs px-2.5 py-1 rounded-full bg-primary/8 text-primary font-medium"
              >
                {chip}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Examples card ── */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium mb-1">See it in action</h3>
          <p className="text-sm text-muted-foreground mb-5">
            Hazel intercepts your text the moment you hit save and returns a cleaner version — you never see the process, just the result.
          </p>

          <div className="space-y-3">
            {EXAMPLES.map(({ icon: Icon, label, before, after }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-3 min-w-0">
                  <span className="text-sm font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded-md truncate">
                    {before}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium px-2.5 py-1 rounded-md bg-primary/8 text-primary truncate">
                    {after}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Section toggles ── */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium mb-1">Where Hazel works</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Turn Hazel on or off for each section independently. Changes apply from your next entry.
          </p>
          <div>
            {SECTIONS.map((section) => (
              <SectionToggle
                key={section.context}
                icon={section.icon}
                label={section.label}
                description={section.description}
                context={section.context}
                enabled={toggles[section.context]}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Privacy note ── */}
      <p className="text-xs text-muted-foreground leading-relaxed px-1">
        When Hazel is active, the text you submit is briefly sent to Claude to be normalised, then saved as usual. Nothing is retained by Hazel outside your home. She never reads existing data, sends messages, or takes any action beyond cleaning up your input at the moment you submit it.
      </p>

    </div>
  );
}
