import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  value: Date | null | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  align?: "start" | "center" | "end";
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  align = "start",
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const label = value ? format(value, "d MMM yyyy") : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={`w-full justify-start gap-3 rounded-xl border-transparent bg-background px-3.5 text-left font-normal shadow-none hover:bg-accent/30 hover:border-transparent ${!value ? "text-muted-foreground" : "text-foreground"} ${className ?? ""}`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarIcon className="h-4 w-4" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Date
            </span>
            <span className="truncate">{label}</span>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-2xl border-border/80 p-2 shadow-2xl" align={align}>
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
