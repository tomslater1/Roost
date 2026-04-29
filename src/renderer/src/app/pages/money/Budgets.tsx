import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  differenceInDays,
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Target,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { useExpenses } from "@/hooks/useExpenses";
import { useCurrencyFormat, useHome } from "@/hooks/useHome";
import { useSavingsGoals } from "@/hooks/useSavingsGoals";
import { useMemberNames } from "@/hooks/useMemberNames";
import { useSubscription } from "@/hooks/useSubscription";
import type { BudgetTemplateLine, AddTemplateLineData } from "@/hooks/useBudgetTemplate";
import { supabase } from "@/lib/supabase";
import { getInitials } from "@/lib/utils";
import {
  ease,
  MoneyBackLink,
  MoneyMonthNavigator,
  useMoneyMonthSync,
} from "./MoneyShared";

// ── Rollover history type ──────────────────────────────────────────────────────

interface RolloverHistory {
  id: string;
  home_id: string;
  template_line_id: string;
  month: string; // YYYY-MM-DD (first of month)
  base_amount: number;
  rollover_amount: number;
  effective_amount: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "housing-bills", label: "Housing & bills", type: "fixed" as const },
  { id: "subscriptions-leisure", label: "Subscriptions & leisure", type: "fixed" as const },
  { id: "transport", label: "Transport", type: "fixed" as const },
  { id: "food-drink", label: "Food & drink", type: "envelope" as const },
  { id: "household", label: "Household", type: "envelope" as const },
  { id: "personal", label: "Personal", type: "envelope" as const },
  { id: "savings", label: "Savings allocation", type: "envelope" as const },
] as const;

// Goals section is rendered separately — not user-configurable from Budgets
const GOALS_SECTION = { id: "goals", label: "Goals", type: "fixed" as const };

type SectionId = typeof SECTIONS[number]["id"];

const SUGGESTIONS: Record<SectionId, string[]> = {
  "housing-bills": [
    "Rent",
    "Mortgage",
    "Council Tax",
    "Gas & Electricity",
    "Water",
    "Broadband",
    "Contents Insurance",
    "TV Licence",
    "Phone",
  ],
  "subscriptions-leisure": [
    "Netflix",
    "Spotify",
    "Disney+",
    "Amazon Prime",
    "Gym",
    "Game Pass",
    "iCloud",
    "Other subscriptions",
  ],
  transport: [
    "Public transport",
    "Fuel",
    "Car insurance",
    "Parking",
    "Taxi/Uber",
    "Rail season ticket",
  ],
  "food-drink": [
    "Groceries",
    "Eating out",
    "Takeaways",
    "Coffee & cafés",
    "Work lunches",
  ],
  household: [
    "Cleaning & toiletries",
    "Small home items",
    "Household repairs",
  ],
  personal: [
    "Personal spending",
    "Clothing",
    "Haircuts",
    "Gifts",
    "Health & wellbeing",
  ],
  savings: [
    "Emergency fund",
    "Holiday fund",
    "ISA savings",
    "Other savings",
  ],
};

// Section border / tint colours
const SECTION_STYLE: Record<"fixed" | "envelope", { border: string; bg: string }> = {
  fixed: { border: "#c75146", bg: "rgba(199,81,70,0.04)" },
  envelope: { border: "#534ab7", bg: "rgba(83,74,183,0.04)" },
};

// ── Colour helpers ─────────────────────────────────────────────────────────────

function envelopeColour(spent: number, budget: number): string {
  if (budget <= 0) return "#7fa087";
  const pct = (spent / budget) * 100;
  if (pct > 100) return "#a32d2d";
  if (pct >= 80) return "#854f0b";
  return "#3b6d11";
}

function remainingColour(remaining: number, budget: number): string {
  if (remaining < 0) return "#a32d2d";
  if (budget > 0 && remaining / budget <= 0.2) return "#854f0b";
  return "#3b6d11";
}

function unallocatedColour(unallocated: number): string {
  if (unallocated < 0) return "#a32d2d";
  if (unallocated <= 50) return "#854f0b";
  return "#3b6d11";
}

// ── Grid column helper ─────────────────────────────────────────────────────────

function colTemplate(type: "fixed" | "envelope", viewMode: "household" | "split"): string {
  if (type === "fixed") {
    // LINE ITEM | DATE | BUDGETED | [split cols] | split bar
    return viewMode === "split"
      ? "1fr 60px 90px 90px 90px 44px"
      : "1fr 60px 90px 44px";
  }
  return viewMode === "split" ? "1fr 90px 90px 90px 44px" : "1fr 90px 80px 80px 44px";
}

function grandColTemplate(viewMode: "household" | "split"): string {
  return viewMode === "split" ? "1fr 90px 90px 90px 44px" : "1fr 90px 80px 80px 44px";
}

// ── Avatar circle ──────────────────────────────────────────────────────────────

function AvatarCircle({ name, color }: { name: string; color: string }) {
  const initials = getInitials(name).slice(0, 2);
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 8, fontWeight: 600, color: "#fff", lineHeight: 1 }}>
        {initials}
      </span>
    </div>
  );
}

// ── Split bar ──────────────────────────────────────────────────────────────────

function SplitBar({
  mePct,
  meColor,
  partnerColor,
  meName,
  partnerName,
}: {
  mePct: number;
  meColor: string;
  partnerColor: string;
  meName: string;
  partnerName: string;
}) {
  const clampedPct = Math.max(0, Math.min(100, mePct));
  return (
    <div
      title={`${meName} ${Math.round(clampedPct)}% · ${partnerName} ${Math.round(100 - clampedPct)}%`}
      style={{
        width: 36,
        height: 4,
        borderRadius: 2,
        overflow: "hidden",
        display: "flex",
        flexShrink: 0,
        cursor: "default",
      }}
    >
      <div style={{ width: `${clampedPct}%`, background: meColor, height: "100%" }} />
      <div style={{ width: `${100 - clampedPct}%`, background: partnerColor, height: "100%" }} />
    </div>
  );
}

// ── Split slider (edit mode) ───────────────────────────────────────────────────

function SplitSlider({
  lineId,
  mePct,
  meColor,
  partnerColor,
  meName,
  partnerName,
  onCommit,
}: {
  lineId: string;
  mePct: number;
  meColor: string;
  partnerColor: string;
  meName: string;
  partnerName: string;
  onCommit: (id: string, pct: number) => void;
}) {
  const [localPct, setLocalPct] = useState(mePct);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalPct(mePct);
  }, [mePct]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setLocalPct(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onCommit(lineId, v), 400);
  }

  const partnerPct = 100 - localPct;
  const labelText =
    localPct === 50 ? "Equal" : localPct === 100 ? `${meName} pays all` : localPct === 0 ? `${partnerName} pays all` : null;

  return (
    <div style={{ paddingLeft: 8, paddingRight: 8, paddingBottom: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <AvatarCircle name={meName} color={meColor} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#3d3229",
            minWidth: 28,
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          {localPct}%
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={localPct}
          onChange={handleChange}
          style={{ flex: 1, accentColor: meColor, cursor: "pointer" }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#3d3229",
            minWidth: 28,
            textAlign: "left",
            flexShrink: 0,
          }}
        >
          {partnerPct}%
        </span>
        <AvatarCircle name={partnerName} color={partnerColor} />
      </div>
      {labelText && (
        <p style={{ textAlign: "center", fontSize: 10, color: "#9db19f", marginTop: 2 }}>
          {labelText}
        </p>
      )}
    </div>
  );
}

// ── Inline name input ──────────────────────────────────────────────────────────

function InlineNameInput({
  lineId,
  initialValue,
  onCommit,
  onCancel,
}: {
  lineId: string;
  initialValue: string;
  onCommit: (id: string, name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  function commit() {
    const trimmed = value.trim();
    if (trimmed && trimmed !== initialValue) {
      onCommit(lineId, trimmed);
    } else {
      onCancel();
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") onCancel();
      }}
      style={{
        fontSize: 13,
        width: "100%",
        padding: "2px 6px",
        borderRadius: 6,
        border: "1.5px solid #d4795e",
        background: "#f2ebe0",
        color: "#3d3229",
        outline: "none",
      }}
    />
  );
}

// ── ContextMenu ────────────────────────────────────────────────────────────────

interface ContextMenuState {
  lineId: string;
  x: number;
  y: number;
}

interface ContextMenuProps {
  state: ContextMenuState;
  line: BudgetTemplateLine;
  onClose: () => void;
  onEditNote: (id: string) => void;
  onDuplicate: (line: BudgetTemplateLine) => void;
  onMoveToSection: (id: string, newSection: SectionId) => void;
  onRemove: (id: string) => void;
}

function ContextMenu({
  state,
  line,
  onClose,
  onEditNote,
  onDuplicate,
  onMoveToSection,
  onRemove,
}: ContextMenuProps) {
  const [showMoveSub, setShowMoveSub] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleOutside, true);
    return () => document.removeEventListener("mousedown", handleOutside, true);
  }, [onClose]);

  const moveSections = SECTIONS.filter((s) => s.id !== line.section_group);

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      style={{ top: state.y, left: state.x }}
      className="fixed z-50"
    >
      <div
        style={{
          background: "#f2ebe0",
          border: "0.5px solid rgba(61,50,41,0.2)",
          borderRadius: 10,
          padding: 4,
          minWidth: 180,
          boxShadow: "0 4px 16px rgba(61,50,41,0.12)",
        }}
      >
        <MenuItem
          label="Edit notes"
          onClick={() => {
            onEditNote(line.id);
            onClose();
          }}
        />
        <MenuItem
          label="Duplicate row"
          onClick={() => {
            onDuplicate(line);
            onClose();
          }}
        />
        <div
          className="relative"
          onMouseEnter={() => setShowMoveSub(true)}
          onMouseLeave={() => setShowMoveSub(false)}
        >
          <MenuItem label="Move to section →" onClick={() => setShowMoveSub((v) => !v)} />
          <AnimatePresence>
            {showMoveSub && (
              <motion.div
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: "100%",
                  marginLeft: 4,
                  background: "#f2ebe0",
                  border: "0.5px solid rgba(61,50,41,0.2)",
                  borderRadius: 10,
                  padding: 4,
                  minWidth: 200,
                  boxShadow: "0 4px 16px rgba(61,50,41,0.12)",
                }}
              >
                {moveSections.map((s) => (
                  <MenuItem
                    key={s.id}
                    label={s.label}
                    onClick={() => {
                      onMoveToSection(line.id, s.id);
                      onClose();
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div style={{ height: "0.5px", background: "rgba(61,50,41,0.1)", margin: "2px 4px" }} />
        <MenuItem
          label="Remove row"
          danger
          onClick={() => {
            onRemove(line.id);
            onClose();
          }}
        />
      </div>
    </motion.div>
  );
}

function MenuItem({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "7px 12px",
        fontSize: 13,
        color: danger ? "#a32d2d" : "#3d3229",
        background: hover
          ? danger
            ? "#fcebeb"
            : "rgba(61,50,41,0.06)"
          : "transparent",
        border: "none",
        borderRadius: 7,
        cursor: "pointer",
        transition: "background 0.1s",
      }}
    >
      {label}
    </button>
  );
}

// ── DayOfMonthPicker ───────────────────────────────────────────────────────────

function DayOfMonthPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (d: number) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          className={`flex-shrink-0 w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
            value === d
              ? "bg-primary text-primary-foreground"
              : "bg-muted/60 text-foreground hover:bg-muted"
          }`}
        >
          {d}
        </button>
      ))}
    </div>
  );
}

// ── AddBudgetLineSheet ─────────────────────────────────────────────────────────

interface SheetConfig {
  sectionId: SectionId;
  sectionType: "fixed" | "envelope";
  sectionLabel: string;
}

interface AddBudgetLineSheetProps {
  config: SheetConfig;
  onClose: () => void;
  onSave: (data: AddTemplateLineData) => void;
  isSaving: boolean;
}

function AddBudgetLineSheet({ config, onClose, onSave, isSaving }: AddBudgetLineSheetProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState(1);
  const [note, setNote] = useState("");
  const suggestions = SUGGESTIONS[config.sectionId] ?? [];

  function handleSave() {
    const trimmedName = name.trim();
    const parsedAmount = parseFloat(amount);
    if (!trimmedName) {
      toast.error("Please enter a name");
      return;
    }
    if (!amount || isNaN(parsedAmount) || parsedAmount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    onSave({
      name: trimmedName,
      amount: parsedAmount,
      budget_type: config.sectionType,
      section_group: config.sectionId,
      day_of_month: config.sectionType === "fixed" ? day : null,
      note: note.trim() || null,
    });
  }

  return (
    <AnimatePresence>
      <>
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          key="sheet"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-xl"
        >
          <div className="bg-card rounded-t-[20px] px-6 pt-5 pb-8 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-foreground">
                Add {config.sectionType === "fixed" ? "fixed cost" : config.sectionLabel.toLowerCase() + " line"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Name</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") handleSave();
                }}
                placeholder={
                  config.sectionType === "fixed" ? "e.g. Rent" : `e.g. ${suggestions[0] ?? "Groceries"}`
                }
                className="w-full rounded-xl bg-muted/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 border border-border/40"
              />
              <div className="flex gap-1.5 flex-wrap">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setName(s)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      name === s
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Monthly amount</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") handleSave();
                  }}
                  placeholder="0.00"
                  className="w-full rounded-xl bg-muted/60 pl-8 pr-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 border border-border/40"
                />
              </div>
            </div>

            {config.sectionType === "fixed" && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">
                  Day it goes out — {day}{daySuffix(day)} of each month
                </label>
                <DayOfMonthPicker value={day} onChange={setDay} />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Note (optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 120))}
                placeholder="Add a note (optional)"
                className="w-full rounded-xl bg-muted/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 border border-border/40"
              />
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={isSaving}
              className="w-full rounded-xl bg-primary text-primary-foreground font-medium text-sm py-3 disabled:opacity-60 transition-opacity"
            >
              {isSaving ? "Saving…" : "Save"}
            </motion.button>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}

// ── NoteEditor ─────────────────────────────────────────────────────────────────

function NoteEditor({
  lineId,
  initialValue,
  onSave,
  onClose,
}: {
  lineId: string;
  initialValue: string;
  onSave: (id: string, note: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="mt-1 px-1">
      <textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, 120))}
        onBlur={() => {
          onSave(lineId, value);
          onClose();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSave(lineId, value);
            onClose();
          }
        }}
        rows={2}
        placeholder="Add a note…"
        style={{ fontSize: 12, resize: "none" }}
        className="w-full rounded-lg bg-muted/50 px-2.5 py-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/30 border border-primary/30"
      />
      <p style={{ fontSize: 10, color: "#6b6157", marginTop: 2 }}>{120 - value.length} characters left</p>
    </div>
  );
}

// ── RemoveConfirmation ─────────────────────────────────────────────────────────

function RemoveConfirmation({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      className="overflow-hidden"
    >
      <div className="px-2 py-1.5 flex items-center gap-3">
        <span style={{ fontSize: 11, color: "#6b6157" }}>
          Remove <strong style={{ color: "#3d3229" }}>{name}</strong>? This removes it from your budget permanently.
        </span>
        <button
          type="button"
          onClick={onConfirm}
          style={{ fontSize: 11, color: "#a32d2d", fontWeight: 500, flexShrink: 0 }}
          className="hover:opacity-70 transition-opacity"
        >
          Yes, remove
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ fontSize: 11, color: "#6b6157", flexShrink: 0 }}
          className="hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

// ── InlineAmountInput ──────────────────────────────────────────────────────────

function InlineAmountInput({
  lineId,
  initialValue,
  onCommit,
  onCancel,
  fmt,
}: {
  lineId: string;
  initialValue: number;
  onCommit: (id: string, value: number) => void;
  onCancel: () => void;
  fmt: (v: number) => string;
}) {
  const [value, setValue] = useState(initialValue.toFixed(2));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  function commit() {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      onCommit(lineId, parsed);
    } else {
      onCancel();
    }
  }

  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={{ scale: 1.02 }}
      exit={{ scale: 1 }}
      transition={{ duration: 0.1 }}
      className="flex justify-end"
    >
      <div className="relative">
        <span
          style={{ fontSize: 11, position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", color: "#6b6157", pointerEvents: "none" }}
        >
          £
        </span>
        <input
          ref={inputRef}
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") onCancel();
          }}
          style={{
            fontSize: 12,
            width: 80,
            textAlign: "right",
            paddingLeft: 18,
            paddingRight: 6,
            paddingTop: 3,
            paddingBottom: 3,
            borderRadius: 6,
            border: "1.5px solid #d4795e",
            background: "#f2ebe0",
            color: "#3d3229",
            outline: "none",
          }}
        />
      </div>
    </motion.div>
  );
}

// ── Section type badge ─────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: "fixed" | "envelope" }) {
  if (type === "fixed") {
    return (
      <span style={{ fontSize: 10, fontWeight: 500, background: "#faece7", color: "#712b13", borderRadius: 99, padding: "2px 7px" }}>
        Fixed
      </span>
    );
  }
  return (
    <span style={{ fontSize: 10, fontWeight: 500, background: "#f0eafa", color: "#3c3489", borderRadius: 99, padding: "2px 7px" }}>
      Lifestyle
    </span>
  );
}

// ── Note dot ───────────────────────────────────────────────────────────────────

function NoteDot({ note }: { note: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block ml-1.5">
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#9db19f", verticalAlign: "middle", cursor: "default" }}
      />
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            style={{
              position: "absolute",
              bottom: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              marginBottom: 4,
              background: "#3d3229",
              color: "#f2ebe0",
              fontSize: 11,
              padding: "4px 8px",
              borderRadius: 6,
              whiteSpace: "nowrap",
              maxWidth: 200,
              zIndex: 100,
              pointerEvents: "none",
            }}
          >
            {note}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// ── Budget row ─────────────────────────────────────────────────────────────────

interface BudgetRowProps {
  line: BudgetTemplateLine;
  type: "fixed" | "envelope";
  spentAmount: number;
  fmt: (v: number) => string;
  viewMode: "household" | "split";
  editMode: boolean;
  editingAmountId: string | null;
  editingNoteId: string | null;
  editingDayId: string | null;
  editingNameId: string | null;
  removingId: string | null;
  meColor: string;
  partnerColor: string;
  meName: string;
  partnerName: string;
  onAmountClick: (id: string) => void;
  onAmountCommit: (id: string, value: number) => void;
  onAmountCancel: () => void;
  onNoteClose: () => void;
  onNoteSave: (id: string, note: string) => void;
  onNameClick: (id: string) => void;
  onNameCommit: (id: string, name: string) => void;
  onNameCancel: () => void;
  onMePctCommit: (id: string, pct: number) => void;
  onRemoveConfirm: (id: string) => void;
  onRemoveCancel: () => void;
  onContextMenu: (e: ReactMouseEvent, id: string) => void;
  onDayClick: (id: string) => void;
  onDayCommit: (id: string, day: number) => void;
  onDayCancel: () => void;
  onOwnershipChange: (id: string, ownership: 'shared' | 'member1' | 'member2') => void;
  rolloverAmount?: number; // positive = surplus from last month, negative = deficit
  isNew?: boolean;
}

function BudgetRow({
  line,
  type,
  spentAmount,
  fmt,
  viewMode,
  editMode,
  editingAmountId,
  editingNoteId,
  editingDayId,
  editingNameId,
  removingId,
  meColor,
  partnerColor,
  meName,
  partnerName,
  onAmountClick,
  onAmountCommit,
  onAmountCancel,
  onNoteClose,
  onNoteSave,
  onNameClick,
  onNameCommit,
  onNameCancel,
  onMePctCommit,
  onRemoveConfirm,
  onRemoveCancel,
  onContextMenu,
  onDayClick,
  onDayCommit,
  onDayCancel,
  onOwnershipChange,
  rolloverAmount = 0,
  isNew = false,
}: BudgetRowProps) {
  const [hovered, setHovered] = useState(false);
  const isEditingAmount = editingAmountId === line.id;
  const isEditingNote = editingNoteId === line.id;
  const isEditingName = editingNameId === line.id;
  const isEditingDay = editingDayId === line.id;
  const isRemoving = removingId === line.id;

  // For rollover-enabled lines, effective budget = base + rollover
  const effectiveBudget = (type === "envelope" && line.rollover_enabled)
    ? line.amount + rolloverAmount
    : line.amount;

  const remaining = effectiveBudget - spentAmount;
  const spentPct = effectiveBudget > 0 ? Math.min((spentAmount / effectiveBudget) * 100, 100) : 0;
  const barColour = envelopeColour(spentAmount, effectiveBudget);
  const remainColour = remainingColour(remaining, effectiveBudget);

  const ownership = line.ownership ?? "shared";
  const mePct = line.member1_percentage ?? 50;
  const meAmount = effectiveBudget * (mePct / 100);
  const partnerAmount = effectiveBudget - meAmount;

  const rowPadding = editMode ? "14px 8px" : "10px 8px";

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: -8, backgroundColor: "rgba(212,121,94,0.12)" } : false}
      animate={{ opacity: 1, y: 0, backgroundColor: "rgba(61,50,41,0)" }}
      transition={{ duration: 0.5 }}
      layout
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={editMode ? (e) => { e.preventDefault(); onContextMenu(e, line.id); } : undefined}
      style={{
        backgroundColor: hovered ? "rgba(61,50,41,0.03)" : "transparent",
        borderRadius: 6,
        transition: "background-color 0.15s",
      }}
    >
      {/* Main row grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: colTemplate(type, viewMode),
          alignItems: "center",
          gap: 4,
          padding: rowPadding,
        }}
      >
        {/* Line item name */}
        <div style={{ fontSize: 13, color: "#3d3229", minWidth: 0 }}>
          {isEditingName ? (
            <InlineNameInput
              lineId={line.id}
              initialValue={line.name}
              onCommit={onNameCommit}
              onCancel={onNameCancel}
            />
          ) : editMode ? (
            <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
              <button
                type="button"
                onClick={() => onNameClick(line.id)}
                className="truncate block text-left group"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13, color: "#3d3229", flex: 1, minWidth: 0 }}
              >
                <span style={{ borderBottom: hovered ? "1px dashed rgba(61,50,41,0.3)" : "1px solid transparent", transition: "border-color 0.15s" }}>
                  {line.name}
                </span>
                {line.note && <NoteDot note={line.note} />}
              </button>
              {/* Feature 5: ownership avatar in edit mode for personal lines */}
              {ownership === "member1" && (
                <AvatarCircle name={meName} color={meColor} />
              )}
              {ownership === "member2" && (
                <AvatarCircle name={partnerName} color={partnerColor} />
              )}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
              <span className="truncate block flex-1" style={{ minWidth: 0 }}>
                {line.name}
                {line.note && <NoteDot note={line.note} />}
              </span>
              {/* Feature 5: ownership avatar in read mode for personal lines */}
              {ownership === "member1" && (
                <AvatarCircle name={meName} color={meColor} />
              )}
              {ownership === "member2" && (
                <AvatarCircle name={partnerName} color={partnerColor} />
              )}
            </div>
          )}
        </div>

        {/* Feature 2: DATE column (fixed lines only) */}
        {type === "fixed" && (
          isEditingDay ? (
            <div style={{ gridColumn: "span 1" }}>
              <DayOfMonthPicker
                value={line.day_of_month ?? 1}
                onChange={(d) => onDayCommit(line.id, d)}
              />
            </div>
          ) : editMode ? (
            <button
              type="button"
              onClick={() => onDayClick(line.id)}
              style={{
                fontSize: 12,
                color: line.day_of_month ? "#3d3229" : "#9db19f",
                textAlign: "right",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                borderBottom: hovered ? "1px dashed rgba(61,50,41,0.3)" : "1px solid transparent",
                transition: "border-color 0.15s",
              }}
            >
              {line.day_of_month ? `${line.day_of_month}${daySuffix(line.day_of_month)}` : "—"}
            </button>
          ) : (
            <span style={{ fontSize: 12, color: line.day_of_month ? "#6b6157" : "#9db19f", textAlign: "right" }}>
              {line.day_of_month ? `${line.day_of_month}${daySuffix(line.day_of_month)}` : "—"}
            </span>
          )
        )}

        {/* Budgeted amount (or inline edit) */}
        {isEditingAmount ? (
          <InlineAmountInput
            lineId={line.id}
            initialValue={line.amount}
            onCommit={onAmountCommit}
            onCancel={onAmountCancel}
            fmt={fmt}
          />
        ) : editMode ? (
          <button
            type="button"
            onClick={() => onAmountClick(line.id)}
            style={{
              fontSize: 12,
              color: "#3d3229",
              textAlign: "right",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              borderBottom: hovered ? "1px dashed rgba(61,50,41,0.3)" : "1px solid transparent",
              transition: "border-color 0.15s",
            }}
          >
            <span style={{ display: "block" }}>{fmt(effectiveBudget)}</span>
            {/* Feature 3: annual secondary label */}
            {line.is_annual && line.annual_amount != null && (
              <span style={{ display: "block", fontSize: 10, color: "#9db19f", marginTop: 1 }}>
                {fmt(line.annual_amount)}/yr
              </span>
            )}
            {/* Feature 4: rollover label in edit mode */}
            {type === "envelope" && line.rollover_enabled && rolloverAmount !== 0 && (
              <span style={{
                display: "block", fontSize: 10, marginTop: 1,
                color: rolloverAmount > 0 ? "#4d8057" : "#a32d2d",
              }}>
                {rolloverAmount > 0 ? "+" : ""}{fmt(rolloverAmount)} last mo.
              </span>
            )}
          </button>
        ) : (
          <div style={{ textAlign: "right" }}>
            {/* Amount + month comparison indicator inline */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
              {/* Feature 3: month comparison indicator (read mode only, within 60 days) */}
              {line.last_amount != null &&
                line.amount_changed_at != null &&
                line.last_amount !== line.amount &&
                differenceInDays(new Date(), parseISO(line.amount_changed_at)) <= 60 && (
                <span style={{
                  fontSize: 10,
                  color: line.amount > line.last_amount ? "#854f0b" : "#4d8057",
                  flexShrink: 0,
                }}>
                  {line.amount > line.last_amount ? "↑" : "↓"}{" "}
                  {line.amount > line.last_amount ? "+" : "-"}{fmt(Math.abs(line.amount - line.last_amount))}
                </span>
              )}
              <span style={{ fontSize: 12, color: "#3d3229" }}>
                {fmt(effectiveBudget)}
              </span>
            </div>
            {/* Annual secondary label */}
            {line.is_annual && line.annual_amount != null && (
              <span style={{ fontSize: 10, color: "#9db19f", display: "block", marginTop: 1 }}>
                {fmt(line.annual_amount)}/yr
              </span>
            )}
            {/* Feature 4: rollover label */}
            {type === "envelope" && line.rollover_enabled && rolloverAmount !== 0 && (
              <span style={{
                display: "block", fontSize: 10, marginTop: 1,
                color: rolloverAmount > 0 ? "#4d8057" : "#a32d2d",
              }}>
                {rolloverAmount > 0 ? `+ ${fmt(rolloverAmount)} from last month` : `- ${fmt(Math.abs(rolloverAmount))} from last month`}
              </span>
            )}
          </div>
        )}

        {/* Envelope-only columns or split columns */}
        {viewMode === "split" ? (
          <>
            <span style={{ fontSize: 12, color: "#6b6157", textAlign: "right" }}>{fmt(meAmount)}</span>
            <span style={{ fontSize: 12, color: "#6b6157", textAlign: "right" }}>{fmt(partnerAmount)}</span>
          </>
        ) : type === "envelope" ? (
          <>
            <span style={{ fontSize: 12, color: "#6b6157", textAlign: "right" }}>{fmt(spentAmount)}</span>
            <span style={{ fontSize: 12, fontWeight: 500, textAlign: "right", color: remainColour }}>
              {fmt(remaining)}
            </span>
          </>
        ) : null}

        {/* Split bar */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <SplitBar
            mePct={mePct}
            meColor={meColor}
            partnerColor={partnerColor}
            meName={meName}
            partnerName={partnerName}
          />
        </div>
      </div>

      {/* Envelope progress bar (read mode only — edit mode row already tall enough) */}
      {type === "envelope" && viewMode === "household" && !editMode && (
        <div style={{ paddingLeft: 8, paddingRight: 44, paddingBottom: 4, paddingTop: 0 }}>
          <div
            style={{
              height: 3,
              borderRadius: 99,
              background: "rgba(61,50,41,0.1)",
              overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${spentPct}%` }}
              transition={{ duration: 0.4, ease }}
              style={{ height: "100%", borderRadius: 99, background: barColour }}
            />
          </div>
        </div>
      )}

      {/* Feature 5: ownership pills (edit mode, envelope lines only) */}
      <AnimatePresence initial={false}>
        {editMode && type === "envelope" && (
          <motion.div
            key="ownership-pills"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease }}
            style={{ overflow: "hidden", paddingLeft: 8, paddingRight: 8, paddingBottom: 4 }}
          >
            <div style={{ display: "flex", gap: 5 }}>
              {(["shared", "member1", "member2"] as const).map((opt) => {
                const label = opt === "shared" ? "Shared" : opt === "member1" ? meName : partnerName;
                const active = ownership === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onOwnershipChange(line.id, opt)}
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      padding: "3px 10px",
                      borderRadius: 99,
                      border: active ? "1.5px solid #d4795e" : "1px solid rgba(61,50,41,0.2)",
                      background: active ? "rgba(212,121,94,0.1)" : "transparent",
                      color: active ? "#d4795e" : "#6b6157",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Split slider (edit mode only — hidden for personal lines since split is fixed) */}
      <AnimatePresence initial={false}>
        {editMode && ownership === "shared" && (
          <motion.div
            key="split-slider"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease }}
            style={{ overflow: "hidden" }}
          >
            <SplitSlider
              lineId={line.id}
              mePct={mePct}
              meColor={meColor}
              partnerColor={partnerColor}
              meName={meName}
              partnerName={partnerName}
              onCommit={onMePctCommit}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note editor (inline) */}
      <AnimatePresence>
        {isEditingNote && (
          <NoteEditor
            lineId={line.id}
            initialValue={line.note ?? ""}
            onSave={onNoteSave}
            onClose={onNoteClose}
          />
        )}
      </AnimatePresence>

      {/* Remove confirmation (inline) */}
      <AnimatePresence>
        {isRemoving && (
          <RemoveConfirmation
            name={line.name}
            onConfirm={() => onRemoveConfirm(line.id)}
            onCancel={onRemoveCancel}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── BudgetSection ──────────────────────────────────────────────────────────────

interface BudgetSectionProps {
  sectionId: SectionId;
  sectionIndex: number;
  label: string;
  type: "fixed" | "envelope";
  lines: BudgetTemplateLine[];
  spendByLine: Record<string, number>;
  rolloverByLine?: Record<string, number>;
  fmt: (v: number) => string;
  viewMode: "household" | "split";
  editMode: boolean;
  collapsed: boolean;
  onToggle: (id: SectionId) => void;
  editingAmountId: string | null;
  editingNoteId: string | null;
  editingDayId: string | null;
  editingNameId: string | null;
  removingId: string | null;
  meColor: string;
  partnerColor: string;
  meName: string;
  partnerName: string;
  onAmountClick: (id: string) => void;
  onAmountCommit: (id: string, value: number) => void;
  onAmountCancel: () => void;
  onNoteClose: () => void;
  onNoteSave: (id: string, note: string) => void;
  onNameClick: (id: string) => void;
  onNameCommit: (id: string, name: string) => void;
  onNameCancel: () => void;
  onMePctCommit: (id: string, pct: number) => void;
  onRemoveConfirm: (id: string) => void;
  onRemoveCancel: () => void;
  onContextMenu: (e: ReactMouseEvent, id: string) => void;
  onDayClick: (id: string) => void;
  onDayCommit: (id: string, day: number) => void;
  onDayCancel: () => void;
  onOwnershipChange: (id: string, ownership: 'shared' | 'member1' | 'member2') => void;
  onAddLine: (sectionId: SectionId) => void;
  newLineIds: Set<string>;
}

function BudgetSection({
  sectionId,
  sectionIndex,
  label,
  type,
  lines,
  spendByLine,
  rolloverByLine = {},
  fmt,
  viewMode,
  editMode,
  collapsed,
  onToggle,
  editingAmountId,
  editingNoteId,
  editingDayId,
  editingNameId,
  removingId,
  meColor,
  partnerColor,
  meName,
  partnerName,
  onAmountClick,
  onAmountCommit,
  onAmountCancel,
  onNoteClose,
  onNoteSave,
  onNameClick,
  onNameCommit,
  onNameCancel,
  onMePctCommit,
  onRemoveConfirm,
  onRemoveCancel,
  onContextMenu,
  onDayClick,
  onDayCommit,
  onDayCancel,
  onOwnershipChange,
  onAddLine,
  newLineIds,
}: BudgetSectionProps) {
  // Effective budgeted accounts for rollover on envelope lines
  const totalBudgeted = lines.reduce((s, l) => {
    const rollover = (l.budget_type === "envelope" && l.rollover_enabled) ? (rolloverByLine[l.id] ?? 0) : 0;
    return s + l.amount + rollover;
  }, 0);
  const totalSpent = lines.reduce((s, l) => s + (spendByLine[l.id] ?? 0), 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const totalMeSplit = lines.reduce((s, l) => s + l.amount * ((l.member1_percentage ?? 50) / 100), 0);
  const totalPartnerSplit = totalBudgeted - totalMeSplit;

  const sectionStyle = SECTION_STYLE[type];

  // In read mode, hide sections with no lines
  if (!editMode && lines.length === 0) return null;

  return (
    <div>
      {/* Section header */}
      <button
        type="button"
        onClick={() => onToggle(sectionId)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 12px 12px 8px",
          background: sectionStyle.bg,
          border: "none",
          borderLeft: `3px solid ${sectionStyle.border}`,
          borderRadius: 0,
          cursor: "pointer",
          textAlign: "left",
        }}
        className="hover:brightness-[0.97] transition-all"
      >
        <motion.span
          animate={{ rotate: collapsed ? -90 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: "#6b6157", flexShrink: 0 }}
        >
          <ChevronDown size={14} />
        </motion.span>
        <span style={{ fontSize: 15, fontWeight: 500, color: "#3d3229", flexGrow: 1 }}>{label}</span>
        <TypeBadge type={type} />
      </button>

      {/* Rows */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease }}
            style={{ overflow: "hidden" }}
          >
            {/* Column sub-header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: colTemplate(type, viewMode),
                gap: 4,
                padding: "6px 8px 4px",
              }}
            >
              <span style={{ fontSize: 10, color: "#9db19f", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Line item
              </span>
              {viewMode === "split" && type === "fixed" ? (
                <>
                  <span style={{ fontSize: 10, color: "#9db19f", textAlign: "right", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Date</span>
                  <span style={{ fontSize: 10, color: "#9db19f", textAlign: "right", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Budgeted</span>
                  <span style={{ fontSize: 10, color: "#9db19f", textAlign: "right", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{meName}</span>
                  <span style={{ fontSize: 10, color: "#9db19f", textAlign: "right", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{partnerName}</span>
                </>
              ) : viewMode === "split" ? (
                <>
                  <span style={{ fontSize: 10, color: "#9db19f", textAlign: "right", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Budgeted</span>
                  <span style={{ fontSize: 10, color: "#9db19f", textAlign: "right", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{meName}</span>
                  <span style={{ fontSize: 10, color: "#9db19f", textAlign: "right", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{partnerName}</span>
                </>
              ) : type === "fixed" ? (
                <>
                  <span style={{ fontSize: 10, color: "#9db19f", textAlign: "right", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Date</span>
                  <span style={{ fontSize: 10, color: "#9db19f", textAlign: "right", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Budgeted</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 10, color: "#9db19f", textAlign: "right", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Budgeted</span>
                  <span style={{ fontSize: 10, color: "#9db19f", textAlign: "right", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Spent</span>
                  <span style={{ fontSize: 10, color: "#9db19f", textAlign: "right", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Remaining</span>
                </>
              )}
              {/* Split column header — empty */}
              <span />
            </div>

            {/* Line rows */}
            {lines.length > 0 && (
              <div>
                {lines.map((line) => (
                  <BudgetRow
                    key={line.id}
                    line={line}
                    type={type}
                    spentAmount={spendByLine[line.id] ?? 0}
                    rolloverAmount={rolloverByLine[line.id] ?? 0}
                    fmt={fmt}
                    viewMode={viewMode}
                    editMode={editMode}
                    editingAmountId={editingAmountId}
                    editingNoteId={editingNoteId}
                    editingDayId={editingDayId}
                    editingNameId={editingNameId}
                    removingId={removingId}
                    meColor={meColor}
                    partnerColor={partnerColor}
                    meName={meName}
                    partnerName={partnerName}
                    onAmountClick={onAmountClick}
                    onAmountCommit={onAmountCommit}
                    onAmountCancel={onAmountCancel}
                    onNoteClose={onNoteClose}
                    onNoteSave={onNoteSave}
                    onNameClick={onNameClick}
                    onNameCommit={onNameCommit}
                    onNameCancel={onNameCancel}
                    onMePctCommit={onMePctCommit}
                    onRemoveConfirm={onRemoveConfirm}
                    onRemoveCancel={onRemoveCancel}
                    onContextMenu={onContextMenu}
                    onDayClick={onDayClick}
                    onDayCommit={onDayCommit}
                    onDayCancel={onDayCancel}
                    onOwnershipChange={onOwnershipChange}
                    isNew={newLineIds.has(line.id)}
                  />
                ))}
              </div>
            )}

            {/* Add row button — edit mode only */}
            <AnimatePresence>
              {editMode && (
                <motion.div
                  key="add-btn"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, delay: sectionIndex * 0.05, ease }}
                >
                  <button
                    type="button"
                    onClick={() => onAddLine(sectionId)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      textAlign: "left",
                      fontSize: 12,
                      color: "#9db19f",
                      background: "none",
                      border: "1.5px dashed rgba(157,177,159,0.5)",
                      borderRadius: 8,
                      cursor: "pointer",
                      marginTop: 2,
                      transition: "border-color 0.15s, color 0.15s",
                    }}
                    className="hover:border-secondary hover:text-secondary/90 transition-colors"
                  >
                    <Plus size={11} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                    Add {type === "fixed" ? "fixed cost" : label.toLowerCase() + " line"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Section total row */}
            {lines.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: colTemplate(type, viewMode),
                  gap: 4,
                  padding: "6px 8px",
                  background: "rgba(61,50,41,0.04)",
                  borderRadius: 6,
                  marginTop: 2,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 500, color: "#3d3229" }}>{label} total</span>
                {viewMode === "split" && type === "fixed" ? (
                  <>
                    <span /> {/* DATE spacer */}
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#3d3229", textAlign: "right" }}>{fmt(totalBudgeted)}</span>
                    <span style={{ fontSize: 11, color: "#6b6157", textAlign: "right" }}>{fmt(totalMeSplit)}</span>
                    <span style={{ fontSize: 11, color: "#6b6157", textAlign: "right" }}>{fmt(totalPartnerSplit)}</span>
                  </>
                ) : viewMode === "split" ? (
                  <>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#3d3229", textAlign: "right" }}>{fmt(totalBudgeted)}</span>
                    <span style={{ fontSize: 11, color: "#6b6157", textAlign: "right" }}>{fmt(totalMeSplit)}</span>
                    <span style={{ fontSize: 11, color: "#6b6157", textAlign: "right" }}>{fmt(totalPartnerSplit)}</span>
                  </>
                ) : type === "fixed" ? (
                  <>
                    <span /> {/* DATE spacer */}
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#3d3229", textAlign: "right" }}>{fmt(totalBudgeted)}</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#3d3229", textAlign: "right" }}>{fmt(totalBudgeted)}</span>
                    <span style={{ fontSize: 11, color: "#6b6157", textAlign: "right" }}>{fmt(totalSpent)}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, textAlign: "right", color: remainingColour(totalRemaining, totalBudgeted) }}>
                      {fmt(totalRemaining)}
                    </span>
                  </>
                )}
                <span />
              </div>
            )}

            <div style={{ height: 8 }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SetupFlow ──────────────────────────────────────────────────────────────────

interface SetupFlowProps {
  onSave: (lines: AddTemplateLineData[]) => void;
  isSaving: boolean;
  fmt: (v: number) => string;
  currentUserName: string;
  partnerName: string;
}

function SetupFlow({ onSave, isSaving, currentUserName, partnerName }: SetupFlowProps) {
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  function setAmount(sectionId: string, name: string, value: string) {
    setAmounts((prev) => ({ ...prev, [`${sectionId}:${name}`]: value }));
  }

  function getAmount(sectionId: string, name: string): string {
    return amounts[`${sectionId}:${name}`] ?? "";
  }

  function handleSave() {
    const lines: AddTemplateLineData[] = [];
    for (const section of SECTIONS) {
      for (const suggestion of SUGGESTIONS[section.id]) {
        const raw = amounts[`${section.id}:${suggestion}`];
        if (!raw) continue;
        const parsed = parseFloat(raw);
        if (isNaN(parsed) || parsed <= 0) continue;
        lines.push({
          name: suggestion === "Phone" ? `Phone — ${currentUserName}` : suggestion,
          amount: parsed,
          budget_type: section.type,
          section_group: section.id,
        });
      }
    }
    if (lines.length === 0) {
      toast.error("Enter at least one amount to set up your budget");
      return;
    }
    onSave(lines);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-base font-medium text-foreground mb-1">
          Fill in what applies to your household
        </h2>
        <p className="text-xs text-muted-foreground">
          Leave blank anything you don't have. You can add more later.
        </p>
      </div>

      {SECTIONS.map((section) => (
        <div key={section.id} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{section.label}</span>
            <TypeBadge type={section.type} />
          </div>
          <div className="space-y-1.5">
            {SUGGESTIONS[section.id].map((suggestion) => {
              const displayName = suggestion === "Phone" ? `Phone — ${currentUserName}` : suggestion;
              const val = getAmount(section.id, suggestion);
              return (
                <div key={suggestion} style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: val ? "#3d3229" : "#6b6157" }}>{displayName}</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">£</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={val}
                      onChange={(e) => setAmount(section.id, suggestion, e.target.value)}
                      placeholder="0"
                      style={{ fontSize: 13, paddingLeft: 20, paddingRight: 8, paddingTop: 5, paddingBottom: 5, width: "100%", borderRadius: 8, border: "1px solid rgba(61,50,41,0.2)", background: val ? "#f2ebe0" : "rgba(61,50,41,0.04)", color: "#3d3229", outline: "none" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="pt-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={isSaving}
          className="w-full rounded-xl bg-primary text-primary-foreground font-medium text-sm py-3 disabled:opacity-60 transition-opacity"
        >
          {isSaving ? "Saving budget…" : "Save budget"}
        </motion.button>
        <p className="text-center text-xs text-muted-foreground mt-3">
          You can edit any line at any time — just click the amount.
        </p>
      </div>
    </motion.div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function daySuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}

// ── Income allocation config ───────────────────────────────────────────────────

const ALLOCATION_CONFIG = [
  { key: "housing-bills",           label: "Housing",       color: "#c75146" },
  { key: "subscriptions-leisure",   label: "Subscriptions", color: "#854f0b" },
  { key: "transport",               label: "Transport",     color: "#185fa5" },
  { key: "food-drink",              label: "Food",          color: "#3b6d11" },
  { key: "household",               label: "Household",     color: "#0f6e56" },
  { key: "personal",                label: "Personal",      color: "#534ab7" },
  { key: "goals",                   label: "Goals",         color: "#993356" },
  { key: "savings",                 label: "Savings",       color: "#7fa087" },
] as const;

// ── Bill clash detection ───────────────────────────────────────────────────────

interface BillCluster {
  signature: string;
  minDay: number;
  maxDay: number;
  bills: Array<{ id: string; name: string; amount: number; day: number }>;
  total: number;
}

function detectBillClusters(lines: BudgetTemplateLine[]): BillCluster[] {
  const fixed = lines
    .filter((l) => l.budget_type === "fixed" && l.day_of_month != null && l.amount > 0)
    .sort((a, b) => (a.day_of_month ?? 0) - (b.day_of_month ?? 0));

  const clusters: BillCluster[] = [];
  const used = new Set<string>();

  for (let i = 0; i < fixed.length; i++) {
    if (used.has(fixed[i].id)) continue;

    const startDay = fixed[i].day_of_month ?? 0;
    const group: typeof fixed = [fixed[i]];

    for (let j = i + 1; j < fixed.length; j++) {
      const day = fixed[j].day_of_month ?? 0;
      if (day - startDay <= 3) {
        group.push(fixed[j]);
      } else {
        break;
      }
    }

    if (group.length >= 2) {
      const total = group.reduce((s, l) => s + l.amount, 0);
      if (total >= 200) {
        group.forEach((l) => used.add(l.id));
        clusters.push({
          signature: group.map((l) => `${l.id}:${l.day_of_month}`).sort().join("|"),
          minDay: group[0].day_of_month ?? 0,
          maxDay: group[group.length - 1].day_of_month ?? 0,
          bills: group.map((l) => ({
            id: l.id,
            name: l.name,
            amount: l.amount,
            day: l.day_of_month ?? 0,
          })),
          total,
        });
      }
    }
  }

  return clusters;
}

// ── Budget health score ────────────────────────────────────────────────────────

interface HealthResult {
  score: number;
  rating: string;
  color: string;
}

function computeHealthScore(opts: {
  combinedIncome: number;
  totalBudgeted: number;
  activeGoals: Array<{ monthly_contribution?: number | null }>;
  envelopeLines: BudgetTemplateLine[];
  templateLines: BudgetTemplateLine[];
}): HealthResult {
  const { combinedIncome, totalBudgeted, activeGoals, envelopeLines, templateLines } = opts;

  // Factor 1 — Income coverage (25 pts)
  let f1 = 0;
  if (combinedIncome > 0) {
    const ratio = totalBudgeted / combinedIncome;
    if (ratio >= 0.8 && ratio <= 1.0) f1 = 25;
    else if (ratio >= 0.6) f1 = 15;
    else if (ratio > 1.0) f1 = 10;
    else f1 = 5;
  }

  // Factor 2 — Goals funded (25 pts)
  let f2 = 10;
  if (activeGoals.length > 0) {
    const anyFunded = activeGoals.some((g) => g.monthly_contribution != null && Number(g.monthly_contribution) > 0);
    f2 = anyFunded ? 25 : 15;
  }

  // Factor 3 — Lifestyle coverage (25 pts)
  let f3 = 0;
  if (envelopeLines.length >= 4) f3 = 25;
  else if (envelopeLines.length >= 2) f3 = 15;
  else if (envelopeLines.length === 1) f3 = 5;

  // Factor 4 — Rollover awareness (25 pts)
  let f4 = 0;
  const hasRollover = templateLines.some((l) => l.rollover_enabled);
  if (hasRollover) {
    f4 = 25;
  } else if (templateLines.length > 0) {
    const oldest = templateLines
      .filter((l) => l.created_at)
      .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""))[0];
    if (oldest?.created_at && differenceInDays(new Date(), parseISO(oldest.created_at)) >= 60) {
      f4 = 10;
    }
  }

  const score = f1 + f2 + f3 + f4;

  let rating: string;
  let color: string;
  if (score >= 85) { rating = "Healthy";         color = "#7fa087"; }
  else if (score >= 65) { rating = "Good";        color = "#9db19f"; }
  else if (score >= 45) { rating = "Getting there"; color = "#e6a563"; }
  else if (score >= 25) { rating = "Needs attention"; color = "#854f0b"; }
  else                  { rating = "Just starting"; color = "#6b6157"; }

  return { score, rating, color };
}

function staticHazelLine(score: number): string {
  if (score >= 85) return "Your budget is well structured — income, spending, and goals are all accounted for.";
  if (score >= 65) return "Good foundation. Consider adding a savings goal contribution to strengthen your plan.";
  if (score >= 45) return "A few gaps in your budget. Adding more lifestyle lines will give you better visibility.";
  if (score >= 25) return "Your budget is missing some key areas. Adding income and lifestyle budgets will help Roost work properly.";
  return "Getting started — add your income and first budget lines to see your financial picture.";
}

// ── BudgetHealthCard ───────────────────────────────────────────────────────────

function BudgetHealthCard({
  score,
  rating,
  color,
  hazelLine,
}: {
  score: number;
  rating: string;
  color: string;
  hazelLine: string;
}) {
  return (
    <div className="bg-card/90 rounded-lg p-4 space-y-2" style={{ minWidth: 0 }}>
      <p style={{ fontSize: 10, color: "#9db19f", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Budget health
      </p>
      <p style={{ fontSize: 18, fontWeight: 600, color, lineHeight: 1 }}>{rating}</p>
      {/* Progress bar */}
      <div
        style={{
          height: 4,
          borderRadius: 99,
          background: "rgba(61,50,41,0.1)",
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: "100%", borderRadius: 99, background: color }}
        />
      </div>
      {/* Hazel ambient line */}
      <p style={{ fontSize: 10, color: "#9db19f", fontStyle: "italic", lineHeight: 1.45 }}>
        {hazelLine}
      </p>
    </div>
  );
}

// ── BillClashCard ──────────────────────────────────────────────────────────────

function BillClashCard({
  cluster,
  fmt,
  onDismiss,
}: {
  cluster: BillCluster;
  fmt: (v: number) => string;
  onDismiss: () => void;
}) {
  const displayBills = cluster.bills.slice(0, 3);
  const extraCount = cluster.bills.length - displayBills.length;
  const names = displayBills.map((b) => b.name).join(", ") + (extraCount > 0 ? ` and ${extraCount} more` : "");
  const dayRange =
    cluster.minDay === cluster.maxDay
      ? `the ${cluster.minDay}${daySuffix(cluster.minDay)}`
      : `the ${cluster.minDay}${daySuffix(cluster.minDay)} and ${cluster.maxDay}${daySuffix(cluster.maxDay)}`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: "rgba(186,117,23,0.06)",
        border: "0.5px solid rgba(186,117,23,0.35)",
        borderRadius: 8,
        padding: "10px 14px",
      }}
    >
      {/* Amber dot */}
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#e6a563",
          flexShrink: 0,
          marginTop: 4,
        }}
      />
      <p style={{ flex: 1, fontSize: 12, color: "#6b6157", lineHeight: 1.5 }}>
        <span style={{ color: "#3d3229", fontWeight: 500 }}>{fmt(cluster.total)}</span>
        {" goes out between "}
        {dayRange}
        {" — "}
        {names}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#9db19f",
          fontSize: 14,
          lineHeight: 1,
          padding: "0 2px",
        }}
        className="hover:text-muted-foreground transition-colors"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

// ── IncomeAllocationBar ────────────────────────────────────────────────────────

function IncomeAllocationBar({
  templateLines,
  income,
  fmt,
}: {
  templateLines: BudgetTemplateLine[];
  income: number;
  fmt: (v: number) => string;
}) {
  const [tooltip, setTooltip] = useState<{ key: string; x: number; y: number } | null>(null);

  if (income <= 0) {
    return (
      <p style={{ fontSize: 12, color: "#9db19f", textAlign: "center", padding: "8px 0" }}>
        Set your income to see how it's allocated.
      </p>
    );
  }

  // Compute totals per section group
  const groupTotals: Record<string, number> = {};
  for (const line of templateLines) {
    groupTotals[line.section_group] = (groupTotals[line.section_group] ?? 0) + line.amount;
  }

  const totalBudgeted = Object.values(groupTotals).reduce((s, v) => s + v, 0);
  const unallocated = Math.max(0, income - totalBudgeted);

  // Build segments in spec order
  const segments = ALLOCATION_CONFIG
    .map((c) => ({
      key: c.key,
      label: c.label,
      color: c.color,
      amount: groupTotals[c.key] ?? 0,
      pct: ((groupTotals[c.key] ?? 0) / income) * 100,
    }))
    .filter((s) => s.pct > 0);

  const unallocatedPct = (unallocated / income) * 100;
  if (unallocatedPct > 0.5) {
    segments.push({
      key: "_unallocated",
      label: "Free",
      color: "rgba(61,50,41,0.15)",
      amount: unallocated,
      pct: unallocatedPct,
    });
  }

  function scrollToSection(key: string) {
    const el = document.getElementById(`budget-section-${key}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const activeTooltip = tooltip ? segments.find((s) => s.key === tooltip.key) : null;

  return (
    <div className="space-y-2">
      {/* Bar */}
      <div
        style={{
          height: 12,
          borderRadius: 6,
          overflow: "hidden",
          display: "flex",
          position: "relative",
        }}
      >
        {segments.map((seg, i) => (
          <motion.div
            key={seg.key}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
            style={{
              width: `${seg.pct}%`,
              height: "100%",
              backgroundColor: seg.color,
              transformOrigin: "left",
              cursor: "pointer",
            }}
            onClick={() => scrollToSection(seg.key)}
            onMouseEnter={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              setTooltip({ key: seg.key, x: rect.left + rect.width / 2, y: rect.top - 8 });
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
        {segments.map((seg) => (
          <button
            key={seg.key}
            type="button"
            onClick={() => scrollToSection(seg.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
            className="hover:opacity-70 transition-opacity"
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: seg.color,
                border: seg.key === "_unallocated" ? "1px solid rgba(61,50,41,0.3)" : "none",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, color: "#6b6157" }}>
              {seg.label} {Math.round(seg.pct)}%
            </span>
          </button>
        ))}
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {activeTooltip && tooltip && (
          <motion.div
            key="alloc-tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            style={{
              position: "fixed",
              top: tooltip.y - 40,
              left: tooltip.x,
              transform: "translateX(-50%)",
              zIndex: 200,
              background: "#3d3229",
              color: "#f2ebe0",
              fontSize: 11,
              padding: "5px 9px",
              borderRadius: 7,
              whiteSpace: "nowrap",
              pointerEvents: "none",
            }}
          >
            {activeTooltip.label} · {fmt(activeTooltip.amount)} · {Math.round(activeTooltip.pct)}% of income
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── MiniGoalRing ───────────────────────────────────────────────────────────────

function MiniGoalRing({ pct, color }: { pct: number; color: string }) {
  const size = 16;
  const r = 6;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(pct, 100) / 100);
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={8} cy={8} r={r} fill="none" stroke="rgba(61,50,41,0.1)" strokeWidth={3} />
      <circle
        cx={8} cy={8} r={r} fill="none"
        stroke={color} strokeWidth={3} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ opacity: 0.6 }}
      />
    </svg>
  );
}

// ── GoalsSection ──────────────────────────────────────────────────────────────

interface GoalsSectionProps {
  lines: BudgetTemplateLine[];
  goals: Array<{ id: string; name: string; current_amount: number; target_amount: number; colour?: string | null; budget_line_id?: string | null }>;
  fmt: (v: number) => string;
  viewMode: "household" | "split";
  editMode: boolean;
  collapsed: boolean;
  onToggle: () => void;
  editingAmountId: string | null;
  editingDayId: string | null;
  meColor: string;
  partnerColor: string;
  meName: string;
  partnerName: string;
  onAmountCommit: (id: string, value: number) => void;
  onAmountCancel: () => void;
  onDayCommit: (id: string, day: number) => void;
  onDayCancel: () => void;
  onAmountClick: (id: string) => void;
  onDayClick: (id: string) => void;
  onNavigateToGoals: () => void;
}

function GoalsSection({
  lines,
  goals,
  fmt,
  viewMode,
  editMode,
  collapsed,
  onToggle,
  editingAmountId,
  editingDayId,
  meColor,
  partnerColor,
  meName,
  partnerName,
  onAmountCommit,
  onAmountCancel,
  onDayCommit,
  onDayCancel,
  onAmountClick,
  onDayClick,
  onNavigateToGoals,
}: GoalsSectionProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const sectionStyle = SECTION_STYLE["fixed"];
  const totalBudgeted = lines.reduce((s, l) => s + l.amount, 0);
  const totalMeSplit = lines.reduce((s, l) => s + l.amount * ((l.member1_percentage ?? 50) / 100), 0);
  const totalPartnerSplit = totalBudgeted - totalMeSplit;

  if (lines.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 12px 12px 8px",
          background: sectionStyle.bg,
          border: "none",
          borderLeft: `3px solid ${sectionStyle.border}`,
          borderRadius: 0,
          cursor: "pointer",
          textAlign: "left",
        }}
        className="hover:brightness-[0.97] transition-all"
      >
        <motion.span
          animate={{ rotate: collapsed ? -90 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: "#6b6157", flexShrink: 0 }}
        >
          <ChevronDown size={14} />
        </motion.span>
        <span style={{ fontSize: 15, fontWeight: 500, color: "#3d3229", flexGrow: 1 }}>Goals</span>
        <Target size={13} style={{ color: "#9db19f", flexShrink: 0 }} />
        <TypeBadge type="fixed" />
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease }}
            style={{ overflow: "hidden" }}
          >
            {/* Column sub-header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: colTemplate("fixed", viewMode),
              gap: 4,
              padding: "6px 8px 4px",
            }}>
              <span style={{ fontSize: 10, color: "#9db19f", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Line item</span>
              {viewMode === "split" ? (
                <>
                  <span style={{ fontSize: 10, color: "#9db19f", textAlign: "right", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Date</span>
                  <span style={{ fontSize: 10, color: "#9db19f", textAlign: "right", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Budgeted</span>
                  <span style={{ fontSize: 10, color: "#9db19f", textAlign: "right", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{meName}</span>
                  <span style={{ fontSize: 10, color: "#9db19f", textAlign: "right", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{partnerName}</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 10, color: "#9db19f", textAlign: "right", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Date</span>
                  <span style={{ fontSize: 10, color: "#9db19f", textAlign: "right", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Budgeted</span>
                </>
              )}
              <span />
            </div>

            {lines.map((line) => {
              const goal = goals.find((g) => g.budget_line_id === line.id);
              const progressPct = goal && goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
              const ringColor = goal?.colour ?? "#d4795e";
              const isEditingAmount = editingAmountId === line.id;
              const isEditingDay = editingDayId === line.id;
              const isHovered = hovered === line.id;
              const mePct = line.member1_percentage ?? 50;
              const meAmt = line.amount * (mePct / 100);
              const partnerAmt = line.amount - meAmt;

              return (
                <div
                  key={line.id}
                  onMouseEnter={() => setHovered(line.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    backgroundColor: isHovered ? "rgba(61,50,41,0.03)" : "transparent",
                    borderRadius: 6,
                    transition: "background-color 0.15s",
                  }}
                >
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: colTemplate("fixed", viewMode),
                    alignItems: "center",
                    gap: 4,
                    padding: editMode ? "14px 8px" : "10px 8px",
                  }}>
                    {/* Name + mini ring */}
                    <button
                      type="button"
                      onClick={onNavigateToGoals}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        color: "#3d3229",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        textAlign: "left",
                        minWidth: 0,
                      }}
                    >
                      {goal && <MiniGoalRing pct={progressPct} color={ringColor} />}
                      <span className="truncate">{line.name}</span>
                    </button>

                    {/* DATE cell */}
                    {isEditingDay ? (
                      <DayOfMonthPicker value={line.day_of_month ?? 1} onChange={(d) => onDayCommit(line.id, d)} />
                    ) : editMode ? (
                      <button
                        type="button"
                        onClick={() => onDayClick(line.id)}
                        style={{
                          fontSize: 12,
                          color: line.day_of_month ? "#3d3229" : "#9db19f",
                          textAlign: "right",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          borderBottom: isHovered ? "1px dashed rgba(61,50,41,0.3)" : "1px solid transparent",
                        }}
                      >
                        {line.day_of_month ? `${line.day_of_month}${daySuffix(line.day_of_month)}` : "—"}
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: "#6b6157", textAlign: "right" }}>
                        {line.day_of_month ? `${line.day_of_month}${daySuffix(line.day_of_month)}` : "—"}
                      </span>
                    )}

                    {/* BUDGETED cell */}
                    {isEditingAmount ? (
                      <InlineAmountInput
                        lineId={line.id}
                        initialValue={line.amount}
                        onCommit={onAmountCommit}
                        onCancel={onAmountCancel}
                        fmt={fmt}
                      />
                    ) : editMode ? (
                      <button
                        type="button"
                        onClick={() => onAmountClick(line.id)}
                        style={{
                          fontSize: 12,
                          color: "#3d3229",
                          textAlign: "right",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          borderBottom: isHovered ? "1px dashed rgba(61,50,41,0.3)" : "1px solid transparent",
                        }}
                      >
                        {fmt(line.amount)}
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: "#3d3229", textAlign: "right" }}>{fmt(line.amount)}</span>
                    )}

                    {/* Split columns */}
                    {viewMode === "split" && (
                      <>
                        <span style={{ fontSize: 12, color: "#6b6157", textAlign: "right" }}>{fmt(meAmt)}</span>
                        <span style={{ fontSize: 12, color: "#6b6157", textAlign: "right" }}>{fmt(partnerAmt)}</span>
                      </>
                    )}

                    {/* Split bar */}
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <SplitBar
                        mePct={mePct}
                        meColor={meColor}
                        partnerColor={partnerColor}
                        meName={meName}
                        partnerName={partnerName}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Section total */}
            {lines.length > 1 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: colTemplate("fixed", viewMode),
                gap: 4,
                padding: "6px 8px",
                background: "rgba(61,50,41,0.04)",
                borderRadius: 6,
                marginTop: 2,
              }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: "#3d3229" }}>Goals total</span>
                {viewMode === "split" ? (
                  <>
                    <span />
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#3d3229", textAlign: "right" }}>{fmt(totalBudgeted)}</span>
                    <span style={{ fontSize: 11, color: "#6b6157", textAlign: "right" }}>{fmt(totalMeSplit)}</span>
                    <span style={{ fontSize: 11, color: "#6b6157", textAlign: "right" }}>{fmt(totalPartnerSplit)}</span>
                  </>
                ) : (
                  <>
                    <span />
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#3d3229", textAlign: "right" }}>{fmt(totalBudgeted)}</span>
                  </>
                )}
                <span />
              </div>
            )}

            {/* Manage goals link */}
            <button
              type="button"
              onClick={onNavigateToGoals}
              style={{
                display: "block",
                width: "100%",
                textAlign: "right",
                padding: "4px 8px 6px",
                fontSize: 11,
                color: "#9db19f",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "color 0.15s",
              }}
              className="hover:text-foreground transition-colors"
            >
              Manage goals →
            </button>

            <div style={{ height: 8 }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Budgets component ─────────────────────────────────────────────────────

export function Budgets() {
  const {
    templateLines,
    linesBySection,
    addTemplateLine,
    updateTemplateLine,
    removeTemplateLine,
    migrateTemplate,
    totalBudgeted,
    isTemplateLoading,
    getIncomeForMonth,
    currentUser,
    partnerName,
    budgetCarryForward,
    currentMember,
    partnerMember,
  } = useApp();

  const { home } = useHome();
  const navigate = useNavigate();
  const expensesHook = useExpenses();
  const { activeGoals } = useSavingsGoals();
  const memberNames = useMemberNames();
  const fmt = useCurrencyFormat();
  const queryClient = useQueryClient();
  const { isNest } = useSubscription();

  // ── Member colours ───────────────────────────────────────────────────────────
  const meColor = currentMember?.avatar_color ?? "#d4795e";
  const partnerColor = partnerMember?.avatar_color ?? "#9db19f";

  // ── Month state ──────────────────────────────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  useMoneyMonthSync(selectedMonth, setSelectedMonth);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<"household" | "split">("household");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [sheetConfig, setSheetConfig] = useState<SheetConfig | null>(null);
  const [newLineIds, setNewLineIds] = useState<Set<string>>(new Set());
  const [setupMode, setSetupMode] = useState(false);
  const [setupSaving, setSetupSaving] = useState(false);

  // ── Bill clash dismissed state ────────────────────────────────────────────────
  const [dismissedClashes, setDismissedClashes] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("roost-dismissed-clashes");
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  // ── Health score Hazel insight (Pro: live; free: static) ──────────────────────
  const [hazelHealthInsight, setHazelHealthInsight] = useState<string | null>(null);

  // Exit edit mode: clear all editing state
  function exitEditMode() {
    setEditMode(false);
    setEditingAmountId(null);
    setEditingNoteId(null);
    setEditingDayId(null);
    setEditingNameId(null);
    setRemovingId(null);
    setContextMenu(null);
  }

  // ── Run migration once on first load ─────────────────────────────────────────
  const migrationAttempted = useRef(false);
  useEffect(() => {
    if (!isTemplateLoading && templateLines.length === 0 && !migrationAttempted.current) {
      migrationAttempted.current = true;
      if (budgetCarryForward === "auto") {
        migrateTemplate.mutate();
      }
    }
  }, [isTemplateLoading, templateLines.length, migrateTemplate, budgetCarryForward]);

  // ── Spend calculation ────────────────────────────────────────────────────────
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const monthExpenses = useMemo(
    () =>
      expensesHook.expenses.filter((e) => {
        try {
          return isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd });
        } catch {
          return false;
        }
      }),
    [expensesHook.expenses, monthStart, monthEnd]
  );

  const spendByLine = useMemo((): Record<string, number> => {
    const result: Record<string, number> = {};
    const spendByCategory: Record<string, number> = {};
    for (const e of monthExpenses) {
      const key = (e.category ?? "").toLowerCase();
      spendByCategory[key] = (spendByCategory[key] ?? 0) + Number(e.amount);
    }
    for (const line of templateLines) {
      const key = line.name.toLowerCase();
      result[line.id] = spendByCategory[key] ?? 0;
    }
    return result;
  }, [templateLines, monthExpenses]);

  const totalSpent = useMemo(
    () => Object.values(spendByLine).reduce((s, v) => s + v, 0),
    [spendByLine]
  );

  // ── Feature 4: Rollover history ───────────────────────────────────────────────
  const monthKey = format(monthStart, "yyyy-MM-dd");
  const prevMonthKey = format(startOfMonth(subMonths(selectedMonth, 1)), "yyyy-MM-dd");

  const rolloverQuery = useQuery({
    queryKey: ["rollover-history", home?.id, monthKey],
    enabled: !!home?.id,
    queryFn: async (): Promise<RolloverHistory[]> => {
      const { data, error } = await supabase
        .from("budget_rollover_history")
        .select("*")
        .eq("home_id", home!.id)
        .eq("month", monthKey);
      if (error) throw error;
      return (data ?? []) as RolloverHistory[];
    },
  });

  // Build rolloverByLine: lineId → rollover_amount (from prev month's underspend)
  const rolloverByLine = useMemo((): Record<string, number> => {
    const result: Record<string, number> = {};
    for (const row of rolloverQuery.data ?? []) {
      result[row.template_line_id] = Number(row.rollover_amount);
    }
    return result;
  }, [rolloverQuery.data]);

  // Compute and store rollover records for the current month if missing
  useEffect(() => {
    if (!home?.id) return;
    const rolloverLines = templateLines.filter((l) => l.rollover_enabled && l.budget_type === "envelope");
    if (rolloverLines.length === 0) return;
    const existingIds = new Set((rolloverQuery.data ?? []).map((r) => r.template_line_id));
    const missing = rolloverLines.filter((l) => !existingIds.has(l.id));
    if (missing.length === 0) return;

    // Fetch previous month's rollover history and previous month's spend
    async function computeMissingRollover() {
      const { data: prevHistory } = await supabase
        .from("budget_rollover_history")
        .select("*")
        .eq("home_id", home!.id)
        .eq("month", prevMonthKey);

      const prevEffective: Record<string, number> = {};
      for (const row of prevHistory ?? []) {
        prevEffective[row.template_line_id as string] = Number(row.effective_amount);
      }

      // Previous month's actual spend by line
      const prevStart = startOfMonth(subMonths(selectedMonth, 1));
      const prevEnd = endOfMonth(subMonths(selectedMonth, 1));
      const prevExpenses = expensesHook.expenses.filter((e) => {
        try { return isWithinInterval(parseISO(e.date), { start: prevStart, end: prevEnd }); }
        catch { return false; }
      });
      const prevSpendByCategory: Record<string, number> = {};
      for (const e of prevExpenses) {
        const key = (e.category ?? "").toLowerCase();
        prevSpendByCategory[key] = (prevSpendByCategory[key] ?? 0) + Number(e.amount);
      }

      const inserts = missing.map((line) => {
        const baseAmount = line.amount;
        const prevEffAmt = prevEffective[line.id] ?? baseAmount;
        const prevSpend = prevSpendByCategory[line.name.toLowerCase()] ?? 0;
        const rolloverAmount = prevEffAmt - prevSpend;
        const effectiveAmount = baseAmount + rolloverAmount;
        return {
          home_id: home!.id,
          template_line_id: line.id,
          month: monthKey,
          base_amount: baseAmount,
          rollover_amount: rolloverAmount,
          effective_amount: effectiveAmount,
        };
      });

      if (inserts.length > 0) {
        await supabase.from("budget_rollover_history").upsert(inserts, { onConflict: "template_line_id,month" });
        queryClient.invalidateQueries({ queryKey: ["rollover-history", home!.id, monthKey] });
      }
    }

    computeMissingRollover();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [home?.id, monthKey, templateLines.map(l => l.id).join(","), rolloverQuery.data]);

  // ── Goals template lines ──────────────────────────────────────────────────────
  const goalLines = useMemo(
    () => templateLines.filter((l) => l.section_group === "goals"),
    [templateLines]
  );

  // ── Income & summary cards ────────────────────────────────────────────────────
  const incomeRow = getIncomeForMonth(selectedMonth);
  const combinedIncome = incomeRow?.combined_amount ?? 0;
  const unallocated = combinedIncome - totalBudgeted;
  const spentPct = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  // ── Grand total split ─────────────────────────────────────────────────────────
  const totalMeBudgeted = useMemo(
    () => templateLines.reduce((s, l) => s + l.amount * ((l.member1_percentage ?? 50) / 100), 0),
    [templateLines]
  );
  const totalPartnerBudgeted = totalBudgeted - totalMeBudgeted;
  const grandMePct = totalBudgeted > 0 ? (totalMeBudgeted / totalBudgeted) * 100 : 50;

  const allTotalRemaining = templateLines
    .filter((l) => l.budget_type === "envelope")
    .reduce((s, l) => {
      const rollover = l.rollover_enabled ? (rolloverByLine[l.id] ?? 0) : 0;
      return s + (l.amount + rollover - (spendByLine[l.id] ?? 0));
    }, 0);
  const allTotalBudgetedEnv = templateLines
    .filter((l) => l.budget_type === "envelope")
    .reduce((s, l) => {
      const rollover = l.rollover_enabled ? (rolloverByLine[l.id] ?? 0) : 0;
      return s + l.amount + rollover;
    }, 0);

  // ── Health score ──────────────────────────────────────────────────────────────

  const envelopeLines = useMemo(
    () => templateLines.filter((l) => l.budget_type === "envelope"),
    [templateLines]
  );

  const { score: healthScore, rating: healthRating, color: healthColor } = useMemo(
    () =>
      computeHealthScore({
        combinedIncome,
        totalBudgeted,
        activeGoals,
        envelopeLines,
        templateLines,
      }),
    [combinedIncome, totalBudgeted, activeGoals, envelopeLines, templateLines]
  );

  // Pro Hazel insight: call window.api.budgetInsights; fall back to static
  useEffect(() => {
    if (!isNest || templateLines.length === 0) {
      setHazelHealthInsight(null);
      return;
    }
    const topCategories = envelopeLines.slice(0, 5).map((l) => ({
      name: l.name,
      spend: spendByLine[l.id] ?? 0,
      limit: l.amount,
      pct: l.amount > 0 ? Math.round(((spendByLine[l.id] ?? 0) / l.amount) * 100) : 0,
      recurringTotal: 0,
    }));
    window.api
      .budgetInsights({
        input: {
          monthLabel: format(selectedMonth, "MMMM yyyy"),
          totalSpent,
          totalBudget: totalBudgeted,
          projectedMonthEnd: totalSpent,
          remaining: allTotalRemaining,
          overspend: Math.max(0, totalSpent - totalBudgeted),
          topCategories,
        },
        isNest: true,
      })
      .then((res) => {
        if (res.success) setHazelHealthInsight(res.data.summary);
      })
      .catch(() => {/* fall back to static */});
  // Only recalculate when month or budget composition changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNest, monthKey, templateLines.length, combinedIncome]);

  const hazelLine = hazelHealthInsight ?? staticHazelLine(healthScore);

  // ── Bill clash clusters ───────────────────────────────────────────────────────

  const clashClusters = useMemo(
    () =>
      detectBillClusters(templateLines).filter(
        (c) => !dismissedClashes.has(c.signature)
      ),
    // Re-run when templateLines change (day values may have changed → new signatures)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [templateLines, dismissedClashes]
  );

  function dismissClash(signature: string) {
    const next = new Set(dismissedClashes);
    next.add(signature);
    setDismissedClashes(next);
    try {
      localStorage.setItem("roost-dismissed-clashes", JSON.stringify([...next]));
    } catch {/* ignore */}
  }

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const toggleSection = useCallback((id: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleContextMenu = useCallback((e: ReactMouseEvent, lineId: string) => {
    e.preventDefault();
    setContextMenu({ lineId, x: e.clientX, y: e.clientY });
  }, []);

  const handleAmountCommit = useCallback(
    (id: string, value: number) => {
      updateTemplateLine.mutate({ id, data: { amount: value } });
      setEditingAmountId(null);
    },
    [updateTemplateLine]
  );

  const handleNoteSave = useCallback(
    (id: string, note: string) => {
      updateTemplateLine.mutate({ id, data: { note: note || null } });
      setEditingNoteId(null);
    },
    [updateTemplateLine]
  );

  const handleNameCommit = useCallback(
    (id: string, name: string) => {
      updateTemplateLine.mutate({ id, data: { name } });
      setEditingNameId(null);
    },
    [updateTemplateLine]
  );

  const handleMePctCommit = useCallback(
    (id: string, pct: number) => {
      updateTemplateLine.mutate({ id, data: { member1_percentage: pct } });
    },
    [updateTemplateLine]
  );

  const handleRemoveConfirm = useCallback(
    (id: string) => {
      removeTemplateLine.mutate({ id });
      setRemovingId(null);
      toast.success("Line removed");
    },
    [removeTemplateLine]
  );

  const handleDuplicate = useCallback(
    (line: BudgetTemplateLine) => {
      addTemplateLine.mutate(
        {
          name: `${line.name} (copy)`,
          amount: line.amount,
          budget_type: line.budget_type,
          section_group: line.section_group,
          day_of_month: line.day_of_month,
          note: line.note,
        },
        {
          onSuccess: () => {
            toast.success("Row duplicated");
          },
        }
      );
    },
    [addTemplateLine]
  );

  const handleMoveToSection = useCallback(
    (id: string, newSection: SectionId) => {
      const section = SECTIONS.find((s) => s.id === newSection);
      if (!section) return;
      updateTemplateLine.mutate({
        id,
        data: {
          section_group: newSection,
          budget_type: section.type,
        },
      });
      toast.success(`Moved to ${section.label}`);
    },
    [updateTemplateLine]
  );

  const handleAddLine = useCallback((sectionId: SectionId) => {
    const section = SECTIONS.find((s) => s.id === sectionId);
    if (!section) return;
    setSheetConfig({
      sectionId,
      sectionType: section.type,
      sectionLabel: section.label,
    });
  }, []);

  const handleSheetSave = useCallback(
    (data: AddTemplateLineData) => {
      addTemplateLine.mutate(data, {
        onSuccess: () => {
          setSheetConfig(null);
          toast.success("Line added");
        },
      });
    },
    [addTemplateLine]
  );

  const handleSetupSave = useCallback(
    async (lines: AddTemplateLineData[]) => {
      setSetupSaving(true);
      try {
        for (const line of lines) {
          await addTemplateLine.mutateAsync(line);
        }
        setSetupMode(false);
        toast.success(`Budget set up with ${lines.length} line${lines.length !== 1 ? "s" : ""}`);
      } catch {
        toast.error("Something went wrong saving your budget");
      } finally {
        setSetupSaving(false);
      }
    },
    [addTemplateLine]
  );

  // ── Day handlers (Feature 2) ──────────────────────────────────────────────────

  const handleDayCommit = useCallback(
    (id: string, day: number) => {
      updateTemplateLine.mutate({ id, data: { day_of_month: day } });
      setEditingDayId(null);
    },
    [updateTemplateLine]
  );

  // ── Ownership handler (Feature 5) ─────────────────────────────────────────────

  const handleOwnershipChange = useCallback(
    (id: string, ownership: "shared" | "member1" | "member2") => {
      updateTemplateLine.mutate({ id, data: { ownership } });
    },
    [updateTemplateLine]
  );

  // ── Context menu line lookup ──────────────────────────────────────────────────

  const contextLine = useMemo(
    () => templateLines.find((l) => l.id === contextMenu?.lineId) ?? null,
    [templateLines, contextMenu?.lineId]
  );

  // ── Empty state ───────────────────────────────────────────────────────────────

  const isEmpty = !isTemplateLoading && templateLines.length === 0;

  if (isEmpty && !setupMode) {
    return (
      <AnimatedPage className="max-w-3xl mx-auto p-6">
        <div className="mb-4">
          <MoneyBackLink />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="flex flex-col items-center justify-center text-center py-20 space-y-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h2 className="text-xl font-medium text-foreground">Set up your household budget</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Add what you spend money on each month. Fixed costs go out automatically.
              Lifestyle budgets are allowances you spend down as the month goes on.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 mt-2">
            {budgetCarryForward === "manual" && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                <Button
                  onClick={() => migrateTemplate.mutate()}
                  disabled={migrateTemplate.isPending}
                  variant="outline"
                  size="lg"
                  className="px-8"
                >
                  {migrateTemplate.isPending ? "Carrying forward…" : "Carry forward last month"}
                </Button>
              </motion.div>
            )}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
              <Button
                onClick={() => setSetupMode(true)}
                className="bg-primary text-primary-foreground px-8"
                size="lg"
              >
                Set up budget
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatedPage>
    );
  }

  if (setupMode) {
    return (
      <AnimatedPage className="max-w-xl mx-auto p-6">
        <div className="mb-5">
          <MoneyBackLink />
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={() => setSetupMode(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Back"
            >
              <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} />
            </button>
            <h1 style={{ fontSize: 22, fontWeight: 500, color: "#3d3229" }}>Set up budget</h1>
          </div>
        </div>
        <SetupFlow
          onSave={handleSetupSave}
          isSaving={setupSaving}
          fmt={fmt}
          currentUserName={currentUser}
          partnerName={partnerName}
        />
      </AnimatedPage>
    );
  }

  // ── Main table view ───────────────────────────────────────────────────────────

  return (
    <AnimatedPage className="max-w-3xl mx-auto p-6 space-y-5">
      {/* Page header */}
      <div className="space-y-3">
        <MoneyBackLink />
        <div className="flex items-center justify-between gap-3">
          <h1 style={{ fontSize: 22, fontWeight: 500, color: "#3d3229", margin: 0 }}>Budgets</h1>
          <div className="flex items-center gap-3">
            <MoneyMonthNavigator selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />

            {/* Per-person toggle */}
            <div
              style={{
                display: "flex",
                background: "rgba(61,50,41,0.06)",
                borderRadius: 9,
                padding: 2,
                gap: 1,
              }}
            >
              {(["household", "split"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    padding: "4px 10px",
                    borderRadius: 7,
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.15s, color 0.15s",
                    background: viewMode === mode ? "#f2ebe0" : "transparent",
                    color: viewMode === mode ? "#3d3229" : "#6b6157",
                    boxShadow: viewMode === mode ? "0 1px 3px rgba(61,50,41,0.1)" : "none",
                  }}
                >
                  {mode === "household" ? "Household" : `${currentUser} / ${partnerName}`}
                </button>
              ))}
            </div>

            {/* Edit / Done button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={editMode ? exitEditMode : () => setEditMode(true)}
              style={{
                fontSize: 13,
                fontWeight: 500,
                padding: "5px 12px",
                borderRadius: 8,
                border: editMode ? "none" : "1px solid rgba(61,50,41,0.2)",
                background: editMode ? "#d4795e" : "transparent",
                color: editMode ? "#f2ebe0" : "#3d3229",
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s, border-color 0.15s",
              }}
            >
              {editMode ? "Done" : "Edit"}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Edit mode banner */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            key="edit-banner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              background: "rgba(230,165,99,0.08)",
              border: "1px solid rgba(230,165,99,0.2)",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 11,
              color: "#6b6157",
            }}
          >
            Editing your budget — changes save automatically
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary cards — 5 columns on wide screens */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="border-0 shadow-none bg-card/90">
          <CardContent className="p-4 space-y-1.5">
            <p className="text-xs text-muted-foreground">Combined income</p>
            {combinedIncome > 0 ? (
              <p className="text-lg font-semibold text-foreground">{fmt(combinedIncome)}</p>
            ) : (
              <div className="space-y-0.5">
                <p className="text-lg font-semibold text-muted-foreground">Not set</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-none bg-card/90">
          <CardContent className="p-4 space-y-1.5">
            <p className="text-xs text-muted-foreground">Total budgeted</p>
            <p className="text-lg font-semibold text-foreground">{fmt(totalBudgeted)}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-none bg-card/90">
          <CardContent className="p-4 space-y-1.5">
            <p className="text-xs text-muted-foreground">Unallocated</p>
            {combinedIncome > 0 ? (
              <>
                <p className="text-lg font-semibold" style={{ color: unallocatedColour(unallocated) }}>
                  {fmt(Math.abs(unallocated))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {unallocated < 0 ? "Over-allocated" : "Available for savings"}
                </p>
              </>
            ) : (
              <p className="text-lg font-semibold text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-none bg-card/90">
          <CardContent className="p-4 space-y-1.5">
            <p className="text-xs text-muted-foreground">Spent so far</p>
            <p className="text-lg font-semibold text-foreground">{fmt(totalSpent)}</p>
            {totalBudgeted > 0 && (
              <p className="text-xs text-muted-foreground">{spentPct}% of budget</p>
            )}
          </CardContent>
        </Card>

        {/* Feature 1: Budget health card */}
        <BudgetHealthCard
          score={healthScore}
          rating={healthRating}
          color={healthColor}
          hazelLine={hazelLine}
        />
      </div>

      {/* Feature 4: Income allocation bar */}
      {templateLines.length > 0 && (
        <IncomeAllocationBar
          templateLines={templateLines}
          income={combinedIncome}
          fmt={fmt}
        />
      )}

      {/* Feature 2: Bill clash detection */}
      {clashClusters.length > 0 && (
        <div className="space-y-1.5">
          {clashClusters.map((cluster) => (
            <BillClashCard
              key={cluster.signature}
              cluster={cluster}
              fmt={fmt}
              onDismiss={() => dismissClash(cluster.signature)}
            />
          ))}
        </div>
      )}

      {/* Budget table */}
      <div
        style={{
          background: "#f2ebe0",
          borderRadius: 14,
          border: "1px solid rgba(61,50,41,0.1)",
          overflow: "hidden",
        }}
      >
        <div className="p-3 space-y-1">
          {SECTIONS.map((section, sectionIndex) => {
            const lines = (linesBySection[section.id] ?? []).filter((l) => l.is_active);
            return (
              <div key={section.id} id={`budget-section-${section.id}`}>
              <BudgetSection
                key={section.id}
                sectionId={section.id}
                sectionIndex={sectionIndex}
                label={section.label}
                type={section.type}
                lines={lines}
                spendByLine={spendByLine}
                rolloverByLine={rolloverByLine}
                fmt={fmt}
                viewMode={viewMode}
                editMode={editMode}
                collapsed={collapsedSections.has(section.id)}
                onToggle={toggleSection}
                editingAmountId={editingAmountId}
                editingNoteId={editingNoteId}
                editingDayId={editingDayId}
                editingNameId={editingNameId}
                removingId={removingId}
                meColor={meColor}
                partnerColor={partnerColor}
                meName={currentUser}
                partnerName={partnerName}
                onAmountClick={(id) => {
                  setEditingNoteId(null);
                  setEditingNameId(null);
                  setRemovingId(null);
                  setEditingAmountId(id);
                }}
                onAmountCommit={handleAmountCommit}
                onAmountCancel={() => setEditingAmountId(null)}
                onNoteClose={() => setEditingNoteId(null)}
                onNoteSave={handleNoteSave}
                onNameClick={(id) => {
                  setEditingAmountId(null);
                  setEditingNoteId(null);
                  setRemovingId(null);
                  setEditingNameId(id);
                }}
                onNameCommit={handleNameCommit}
                onNameCancel={() => setEditingNameId(null)}
                onDayClick={(id) => {
                  setEditingAmountId(null);
                  setEditingNameId(null);
                  setEditingDayId(id);
                }}
                onDayCommit={handleDayCommit}
                onDayCancel={() => setEditingDayId(null)}
                onOwnershipChange={handleOwnershipChange}
                onMePctCommit={handleMePctCommit}
                onRemoveConfirm={handleRemoveConfirm}
                onRemoveCancel={() => setRemovingId(null)}
                onContextMenu={handleContextMenu}
                onAddLine={handleAddLine}
                newLineIds={newLineIds}
              />
              </div>
            );
          })}
          {goalLines.length > 0 && (
            <GoalsSection
              lines={goalLines}
              goals={activeGoals}
              fmt={fmt}
              viewMode={viewMode}
              editMode={editMode}
              collapsed={collapsedSections.has("goals")}
              onToggle={() => toggleSection("goals")}
              editingAmountId={editingAmountId}
              editingDayId={editingDayId}
              meColor={meColor}
              partnerColor={partnerColor}
              meName={currentUser}
              partnerName={partnerName}
              onAmountClick={(id) => {
                setEditingNoteId(null);
                setEditingNameId(null);
                setRemovingId(null);
                setEditingAmountId(id);
              }}
              onAmountCommit={handleAmountCommit}
              onAmountCancel={() => setEditingAmountId(null)}
              onDayClick={(id) => {
                setEditingAmountId(null);
                setEditingNameId(null);
                setEditingDayId(id);
              }}
              onDayCommit={handleDayCommit}
              onDayCancel={() => setEditingDayId(null)}
              onNavigateToGoals={() => navigate("/money/goals")}
            />
          )}
        </div>

        {/* Grand total row */}
        <div
          style={{
            borderTop: "1px solid rgba(61,50,41,0.15)",
            padding: "10px 20px",
            display: "grid",
            gridTemplateColumns: grandColTemplate(viewMode),
            gap: 4,
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 500, color: "#3d3229" }}>Total budgeted</span>
          {viewMode === "split" ? (
            <>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#3d3229", textAlign: "right" }}>{fmt(totalBudgeted)}</span>
              <span style={{ fontSize: 12, color: "#6b6157", textAlign: "right" }}>{fmt(totalMeBudgeted)}</span>
              <span style={{ fontSize: 12, color: "#6b6157", textAlign: "right" }}>{fmt(totalPartnerBudgeted)}</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#3d3229", textAlign: "right" }}>{fmt(totalBudgeted)}</span>
              <span style={{ fontSize: 12, color: "#6b6157", textAlign: "right" }}>{fmt(totalSpent)}</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  textAlign: "right",
                  color: remainingColour(allTotalRemaining, allTotalBudgetedEnv),
                }}
              >
                {fmt(allTotalRemaining)}
              </span>
            </>
          )}
          {/* Grand total split bar */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <SplitBar
              mePct={grandMePct}
              meColor={meColor}
              partnerColor={partnerColor}
              meName={currentUser}
              partnerName={partnerName}
            />
          </div>
        </div>
      </div>

      {/* Context menu (edit mode only) */}
      <AnimatePresence>
        {editMode && contextMenu && contextLine && (
          <ContextMenu
            state={contextMenu}
            line={contextLine}
            onClose={() => setContextMenu(null)}
            onEditNote={(id) => setEditingNoteId(id)}
            onDuplicate={handleDuplicate}
            onMoveToSection={handleMoveToSection}
            onRemove={(id) => setRemovingId(id)}
          />
        )}
      </AnimatePresence>

      {/* Add budget line sheet */}
      <AnimatePresence>
        {sheetConfig && (
          <AddBudgetLineSheet
            config={sheetConfig}
            onClose={() => setSheetConfig(null)}
            onSave={handleSheetSave}
            isSaving={addTemplateLine.isPending}
          />
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}
