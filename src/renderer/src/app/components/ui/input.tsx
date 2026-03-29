import * as React from "react";

import { cn } from "./utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        ref={ref}
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground/90 selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-10 w-full min-w-0 rounded-xl border border-border/65 px-3.5 py-2 text-base bg-background/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition-[background-color,border-color,box-shadow,color,transform] duration-150 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm supports-[backdrop-filter]:bg-background/64 supports-[backdrop-filter]:backdrop-blur-[8px]",
          "hover:border-border/85 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-ring/35 focus-visible:ring-[3px] focus-visible:shadow-[0_0_0_1px_rgba(212,121,94,0.14),inset_0_1px_0_rgba(255,255,255,0.18)]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className,
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
