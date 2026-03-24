import { useState, useEffect, useId } from "react";
import { Pencil, X, Check, Mail, Globe, Pen, CalendarDays, Clock } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/select";
import { motion, AnimatePresence } from "motion/react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useAuthContext } from "@/context/AuthContext";
import { useHome } from "@/hooks/useHome";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  MemberAvatar,
  AVATAR_COLORS,
  AVATAR_ICON_OPTIONS,
} from "../../components/MemberAvatar";
import { useUserPreferences } from "@/hooks/useUserPreferences";

// ── Avatar picker ─────────────────────────────────────────────────────────────

interface AvatarPickerProps {
  displayName: string;
  selectedColor: string;
  selectedIcon: string | null;
  onColorSelect: (color: string) => void;
  onIconSelect: (icon: string | null) => void;
}

function AvatarPicker({
  displayName,
  selectedColor,
  selectedIcon,
  onColorSelect,
  onIconSelect,
}: AvatarPickerProps) {
  return (
    <div className="space-y-5 pt-4">
      {/* Colour */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2.5">
          Colour
        </p>
        <div className="flex flex-wrap gap-2">
          {AVATAR_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onColorSelect(color)}
              className="relative w-8 h-8 rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              style={{ backgroundColor: color }}
              aria-label={color}
            >
              {selectedColor === color && (
                <motion.span
                  layoutId="color-check"
                  className="absolute inset-0 rounded-full flex items-center justify-center"
                >
                  <Check className="w-3.5 h-3.5 text-white drop-shadow" strokeWidth={3} />
                </motion.span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Icon */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2.5">
          Icon
        </p>
        <div className="flex flex-wrap gap-1.5">
          {AVATAR_ICON_OPTIONS.map((opt) => {
            const isSelected = selectedIcon === opt.id;
            return (
              <button
                key={String(opt.id)}
                type="button"
                onClick={() => onIconSelect(opt.id)}
                title={opt.label}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? "ring-2 ring-primary scale-110"
                    : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
                style={isSelected ? { backgroundColor: selectedColor } : undefined}
              >
                {opt.Icon ? (
                  <opt.Icon
                    className={`w-4 h-4 ${isSelected ? "text-white" : ""}`}
                    strokeWidth={2}
                  />
                ) : (
                  // "Letter" option — show the actual first letter
                  <span
                    className={`text-sm font-semibold ${isSelected ? "text-white" : ""}`}
                  >
                    {(displayName || "?")[0].toUpperCase()}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Segment control ───────────────────────────────────────────────────────────

interface SegmentOption<T extends string> {
  value: T
  label: string
}

interface SegmentControlProps<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (v: T) => void
}

function SegmentControl<T extends string>({ options, value, onChange }: SegmentControlProps<T>) {
  const id = useId()
  return (
    <div className="flex p-0.5 bg-muted rounded-lg gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="relative px-3 py-1 text-sm rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {value === opt.value && (
            <motion.div
              layoutId={`${id}-seg`}
              className="absolute inset-0 bg-background rounded-md shadow-sm"
              transition={{ type: "spring", stiffness: 500, damping: 38 }}
            />
          )}
          <span
            className={`relative z-10 transition-colors duration-150 ${
              value === opt.value ? "text-foreground font-medium" : "text-muted-foreground"
            }`}
          >
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  )
}

// ── Themed select ─────────────────────────────────────────────────────────────

function PrefSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-auto min-w-[7rem] text-sm" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// ── Pref row ──────────────────────────────────────────────────────────────────

function PrefRow({
  icon: Icon,
  iconBg,
  title,
  description,
  control,
}: {
  icon: React.ElementType
  iconBg: string
  title: string
  description: string
  control: React.ReactNode
}) {
  return (
    <motion.div layout className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex-shrink-0">{control}</div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function Profile() {
  const { user } = useAuthContext();
  const { home, members } = useHome();
  const queryClient = useQueryClient();
  const { prefs: userPrefs, updatePrefs: updateUserPrefs } = useUserPreferences();

  const currentMember = members.find((m) => m.user_id === user?.id);
  const displayName =
    currentMember?.display_name ?? user?.email?.split("@")[0] ?? "User";
  const userEmail = user?.email ?? "";

  // ── Name editing ──────────────────────────────────────────────────────
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(displayName);
  const [isSavingName, setIsSavingName] = useState(false);

  // ── Avatar picker ─────────────────────────────────────────────────────
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(
    currentMember?.avatar_color ?? "#7F77DD"
  );
  const [selectedIcon, setSelectedIcon] = useState<string | null>(
    currentMember?.avatar_icon ?? null
  );

  // Sync avatar state when member data loads / refreshes
  useEffect(() => {
    if (currentMember) {
      setSelectedColor(currentMember.avatar_color ?? "#7F77DD");
      setSelectedIcon(currentMember.avatar_icon ?? null);
    }
  }, [currentMember]);

  // ── Save helpers ──────────────────────────────────────────────────────
  const saveAvatar = async (color: string, icon: string | null) => {
    if (!user || !home) return;
    try {
      const { error } = await supabase
        .from("home_members")
        .update({ avatar_color: color, avatar_icon: icon })
        .eq("user_id", user.id)
        .eq("home_id", home.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["home-members", home.id] });
    } catch {
      toast.error("Failed to save avatar");
    }
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    saveAvatar(color, selectedIcon);
  };

  const handleIconSelect = (icon: string | null) => {
    setSelectedIcon(icon);
    saveAvatar(selectedColor, icon);
  };

  const handleSaveName = async () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === displayName) {
      setIsEditingName(false);
      return;
    }
    if (!user || !home) return;
    setIsSavingName(true);
    try {
      const { error } = await supabase
        .from("home_members")
        .update({ display_name: trimmed })
        .eq("user_id", user.id)
        .eq("home_id", home.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["home-members", home.id] });
      toast.success("Name updated");
      setIsEditingName(false);
    } catch {
      toast.error("Failed to save name");
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">

      {/* ── Profile hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5 mb-5 pb-5 border-b border-border">

            {/* Avatar — clickable to open picker */}
            <div className="relative flex-shrink-0">
              <MemberAvatar
                displayName={displayName}
                avatarColor={selectedColor}
                avatarIcon={selectedIcon}
                size="xl"
                shape="square"
              />
              <button
                onClick={() => setIsPickerOpen((o) => !o)}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-background border-2 border-border flex items-center justify-center shadow-sm hover:bg-muted transition-colors"
                aria-label="Customise avatar"
              >
                <Pen className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>

            {/* Name + email */}
            <div className="flex-1 min-w-0 mt-1">
              <AnimatePresence mode="wait" initial={false}>
                {isEditingName ? (
                  <motion.div
                    key="editing"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2 mb-1"
                  >
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="h-9 max-w-xs"
                      autoFocus
                      disabled={isSavingName}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName();
                        if (e.key === "Escape") {
                          setNewName(displayName);
                          setIsEditingName(false);
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-success flex-shrink-0"
                      onClick={handleSaveName}
                      disabled={isSavingName}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => {
                        setNewName(displayName);
                        setIsEditingName(false);
                      }}
                      disabled={isSavingName}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="display"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="group flex items-center gap-2 mb-1"
                  >
                    <p className="text-xl font-semibold truncate">{displayName}</p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => {
                        setNewName(displayName);
                        setIsEditingName(true);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>

          {/* Avatar picker — expands inline */}
          <AnimatePresence initial={false}>
            {isPickerOpen && (
              <motion.div
                key="picker"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden border-b border-border mb-5"
              >
                <AvatarPicker
                  displayName={displayName}
                  selectedColor={selectedColor}
                  selectedIcon={selectedIcon}
                  onColorSelect={handleColorSelect}
                  onIconSelect={handleIconSelect}
                />
                <div className="pb-5" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sign-in method */}
          {user?.app_metadata?.provider === 'google' ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Signed in with Google</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Signed in with email</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>

      {/* ── Preferences ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <h3 className="font-medium mb-0.5">Preferences</h3>
              <p className="text-sm text-muted-foreground">
                Personalise how Roost displays information for you.
              </p>
            </div>

            <div className="space-y-5">
              <PrefRow
                icon={CalendarDays}
                iconBg="bg-muted"
                title="Week starts on"
                description="First day shown in the calendar"
                control={
                  <SegmentControl
                    options={[
                      { value: "monday", label: "Monday" },
                      { value: "sunday", label: "Sunday" },
                    ]}
                    value={userPrefs.week_starts}
                    onChange={(v) => updateUserPrefs({ week_starts: v })}
                  />
                }
              />

              <PrefRow
                icon={Clock}
                iconBg="bg-muted"
                title="Time format"
                description="How times are displayed across the app"
                control={
                  <SegmentControl
                    options={[
                      { value: "12h", label: "12h" },
                      { value: "24h", label: "24h" },
                    ]}
                    value={userPrefs.time_format}
                    onChange={(v) => updateUserPrefs({ time_format: v })}
                  />
                }
              />

              <PrefRow
                icon={Globe}
                iconBg="bg-muted"
                title="Date format"
                description="How dates appear across the app"
                control={
                  <PrefSelect
                    value={userPrefs.date_format}
                    onChange={(v) => updateUserPrefs({ date_format: v })}
                    options={[
                      { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                      { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                      { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                    ]}
                  />
                }
              />

              <PrefRow
                icon={() => (
                  <span className="text-sm font-semibold text-muted-foreground">£</span>
                )}
                iconBg="bg-muted"
                title="Currency"
                description="Used for expenses and budgets"
                control={
                  <PrefSelect
                    value={userPrefs.currency}
                    onChange={(v) => updateUserPrefs({ currency: v })}
                    options={[
                      { value: "GBP", label: "£ GBP" },
                      { value: "USD", label: "$ USD" },
                      { value: "EUR", label: "€ EUR" },
                    ]}
                  />
                }
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
