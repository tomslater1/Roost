import { useState, useEffect } from "react";
import { Plus, Trash2, Check, Sparkles as SparklesIcon } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { CategoryIcon } from "../../components/CategoryIcon";
import { useBudget } from "@/hooks/useBudget";
import {
  BUILT_IN_CATEGORIES,
  OPTIONAL_PRESET_CATEGORIES,
  CUSTOM_CATEGORY_COLORS,
  CUSTOM_CATEGORY_ICON_NAMES,
  COLOR_CLASSES,
  type Category,
} from "@/lib/categories";

// ── Inline limit input ──────────────────────────────────────────────────────

interface LimitInputProps {
  categoryName: string;
  currentLimit: number | null;
  onSave: (amount: number) => void;
  onClear: () => void;
}

function LimitInput({ categoryName: _categoryName, currentLimit, onSave, onClear }: LimitInputProps) {
  const [value, setValue] = useState(currentLimit != null ? currentLimit.toFixed(2) : "");

  // Sync when external data changes (e.g. realtime update from partner)
  useEffect(() => {
    setValue(currentLimit != null ? currentLimit.toFixed(2) : "");
  }, [currentLimit]);

  const commit = () => {
    const n = parseFloat(value);
    if (!isNaN(n) && n > 0) {
      onSave(n);
    } else if (value === "" && currentLimit != null) {
      onClear();
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm text-muted-foreground">£</span>
      <Input
        type="number"
        placeholder="No limit"
        min="0.01"
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.currentTarget.blur(); }
          if (e.key === "Escape") { setValue(currentLimit != null ? currentLimit.toFixed(2) : ""); e.currentTarget.blur(); }
        }}
        className="w-28 h-8 text-sm"
      />
      <span className="text-xs text-muted-foreground">/mo</span>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export function BudgetCategories() {
  const budgetHook = useBudget({ expenses: [] });
  const customCategories = budgetHook.customCategories;

  const [customName, setCustomName] = useState("");
  const [customIcon, setCustomIcon] = useState(CUSTOM_CATEGORY_ICON_NAMES[0]);
  const [customColor, setCustomColor] = useState(CUSTOM_CATEGORY_COLORS[0]);

  // Current month key (YYYY-MM-01) — settings always operates on the current month
  const currentMonthKey = format(startOfMonth(new Date()), "yyyy-MM-dd");

  // Build a map of category name → { amount, id } for the current month
  const currentLimits: Record<string, { amount: number; id: string }> = {};
  for (const b of budgetHook.rawBudgets) {
    if (b.month === currentMonthKey) {
      currentLimits[b.category] = { amount: Number(b.amount), id: b.id };
    }
  }

  // All categories that should show in the limits section: built-ins + user's custom
  const allEditableCategories: Category[] = [
    ...BUILT_IN_CATEGORIES,
    ...customCategories.map((c) => ({
      name: c.name,
      emoji: c.emoji,
      color: c.color,
      isCustom: true as const,
    })),
  ];

  const allExistingNames = new Set(allEditableCategories.map((c) => c.name.toLowerCase()));

  const handleSaveLimit = (categoryName: string, amount: number) => {
    budgetHook.upsertBudget.mutate({ category: categoryName, amount, month: currentMonthKey });
  };

  const handleClearLimit = (categoryName: string) => {
    const entry = currentLimits[categoryName];
    if (entry) budgetHook.deleteBudget.mutate({ id: entry.id });
  };

  const handleAddPreset = (cat: Category) => {
    budgetHook.addCustomCategory.mutate({ name: cat.name, emoji: cat.emoji, color: cat.color });
  };

  const handleDeleteCustom = (id: string) => {
    budgetHook.deleteCustomCategory.mutate({ id });
  };

  const handleAddCustom = () => {
    const name = customName.trim();
    if (!name || allExistingNames.has(name.toLowerCase())) return;
    budgetHook.addCustomCategory.mutate({ name, emoji: "⭐", color: customColor });
    setCustomName("");
    setCustomIcon(CUSTOM_CATEGORY_ICON_NAMES[0]);
    setCustomColor(CUSTOM_CATEGORY_COLORS[0]);
  };

  const currentMonthLabel = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="max-w-2xl space-y-6">

      {/* Monthly budget limits */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div>
            <h3 className="font-medium mb-1">Monthly budget limits</h3>
            <p className="text-sm text-muted-foreground">
              Set how much you plan to spend in each category this month. Leave blank for no limit.
              Changes here update the Budget page immediately.
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{currentMonthLabel}</p>
          </div>

          <div className="space-y-1">
            {allEditableCategories.map((cat) => {
              const colors = COLOR_CLASSES[cat.color] ?? COLOR_CLASSES.slate;
              const entry = currentLimits[cat.name];
              return (
                <div
                  key={cat.name}
                  className="flex items-center justify-between gap-4 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colors.bg}`}>
                      <CategoryIcon category={cat} className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <span className="font-medium text-sm truncate">{cat.name}</span>
                    {entry && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        limit set
                      </span>
                    )}
                  </div>
                  <LimitInput
                    categoryName={cat.name}
                    currentLimit={entry?.amount ?? null}
                    onSave={(amount) => handleSaveLimit(cat.name, amount)}
                    onClear={() => handleClearLimit(cat.name)}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Optional presets */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-2">
            <SparklesIcon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <h3 className="font-medium mb-1">Add more categories</h3>
              <p className="text-sm text-muted-foreground">
                Common categories for most households. Mortgage replaces Rent for homeowners.
                Added categories appear in your limits above and in the expenses dropdown.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {OPTIONAL_PRESET_CATEGORIES.map((cat) => {
              const alreadyAdded = allExistingNames.has(cat.name.toLowerCase());
              const colors = COLOR_CLASSES[cat.color] ?? COLOR_CLASSES.slate;
              return (
                <div
                  key={cat.name}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                    alreadyAdded
                      ? "bg-muted/30 border-border opacity-60"
                      : "bg-card border-border hover:border-primary/30 hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colors.bg}`}>
                      <CategoryIcon category={cat} className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <span className="font-medium text-sm truncate">{cat.name}</span>
                  </div>
                  {alreadyAdded ? (
                    <Check className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => handleAddPreset(cat)}
                      disabled={budgetHook.addCustomCategory.isPending}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Custom categories you've added */}
      {customCategories.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-medium mb-1">Your added categories</h3>
              <p className="text-sm text-muted-foreground">
                Remove categories you no longer need. Any budget limits set for them will also be removed.
              </p>
            </div>
            <div className="space-y-1">
              {customCategories.map((cat) => {
                const builtInMatch = OPTIONAL_PRESET_CATEGORIES.find(
                  (p) => p.name.toLowerCase() === cat.name.toLowerCase()
                );
                const displayCat: Category = builtInMatch ?? {
                  name: cat.name,
                  emoji: cat.emoji,
                  color: cat.color,
                  isCustom: true,
                };
                const colors = COLOR_CLASSES[displayCat.color] ?? COLOR_CLASSES.slate;
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/40 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg}`}>
                        <CategoryIcon category={displayCat} className={`w-4 h-4 ${colors.text}`} />
                      </div>
                      <span className="font-medium text-sm">{cat.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteCustom(cat.id)}
                      disabled={budgetHook.deleteCustomCategory.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create a fully custom category */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div>
            <h3 className="font-medium mb-1">Create a custom category</h3>
            <p className="text-sm text-muted-foreground">
              Name it anything. Pick an icon and colour that feels right.
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">Name</label>
            <Input
              placeholder="e.g., Date nights, Baby, Hobbies"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
              className="bg-background"
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">Icon</label>
            <div className="flex flex-wrap gap-2">
              {CUSTOM_CATEGORY_ICON_NAMES.map((iconName) => {
                const fakeCat: Category = { name: "", emoji: "", iconName, color: customColor };
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setCustomIcon(iconName)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      customIcon === iconName
                        ? "bg-primary/15 ring-2 ring-primary/40 scale-110"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <CategoryIcon category={fakeCat} className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colour picker */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">Colour</label>
            <div className="flex gap-2 flex-wrap">
              {CUSTOM_CATEGORY_COLORS.map((color) => {
                const colors = COLOR_CLASSES[color] ?? COLOR_CLASSES.slate;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCustomColor(color)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${colors.bg} ${
                      customColor === color
                        ? "ring-2 ring-offset-1 ring-foreground/25 scale-110"
                        : "hover:scale-105"
                    }`}
                  >
                    <span className={`text-xs font-medium ${colors.text}`}>
                      {color.slice(0, 2).toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview + save */}
          <div className="flex items-center gap-3 pt-1">
            {customName.trim() && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${(COLOR_CLASSES[customColor] ?? COLOR_CLASSES.slate).bg}`}>
                <CategoryIcon
                  category={{ name: customName, emoji: "", iconName: customIcon, color: customColor }}
                  className={`w-4 h-4 ${(COLOR_CLASSES[customColor] ?? COLOR_CLASSES.slate).text}`}
                />
                <span className={`text-sm font-medium ${(COLOR_CLASSES[customColor] ?? COLOR_CLASSES.slate).text}`}>
                  {customName.trim()}
                </span>
              </div>
            )}
            <Button
              onClick={handleAddCustom}
              disabled={
                !customName.trim() ||
                allExistingNames.has(customName.trim().toLowerCase()) ||
                budgetHook.addCustomCategory.isPending
              }
              className="gap-2 ml-auto"
            >
              <Plus className="w-4 h-4" />
              Add category
            </Button>
          </div>

          {customName.trim() && allExistingNames.has(customName.trim().toLowerCase()) && (
            <p className="text-xs text-destructive -mt-2">A category with this name already exists.</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
