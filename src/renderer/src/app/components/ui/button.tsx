import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-150 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px] focus-visible:ring-offset-0 focus-visible:shadow-[0_0_0_1px_rgba(212,121,94,0.16)] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] active:scale-[0.985] will-change-transform",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/94 hover:shadow-[0_14px_30px_rgba(61,50,41,0.14),inset_0_1px_0_rgba(255,255,255,0.18)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/94 hover:shadow-[0_12px_24px_rgba(199,81,70,0.18),inset_0_1px_0_rgba(255,255,255,0.1)] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-border/70 bg-background/72 text-foreground hover:bg-background/92 hover:border-border/95 hover:shadow-[0_10px_22px_rgba(61,50,41,0.08),inset_0_1px_0_rgba(255,255,255,0.16)] dark:bg-input/25 dark:border-input dark:hover:bg-input/45",
        secondary:
          "bg-secondary/90 text-secondary-foreground hover:bg-secondary hover:shadow-[0_10px_20px_rgba(61,50,41,0.1)]",
        ghost:
          "border border-transparent bg-transparent shadow-none hover:border-border/45 hover:bg-background/58 hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3.5",
        sm: "h-8 rounded-xl gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-[14px] px-6 has-[>svg]:px-4.5",
        icon: "size-9 rounded-[14px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button(
  {
    className,
    variant,
    size,
    asChild = false,
    ...props
  }: React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    },
  ref: React.Ref<HTMLButtonElement>
) {
  const shared = {
    "data-slot": "button",
    className: cn(buttonVariants({ variant, size, className })),
    ref,
    ...props,
  } as React.ComponentProps<"button">;

  if (asChild) {
    // Slot merges props into the child element — never pass motion props here
    // or they leak onto the underlying DOM node (e.g. <a>) and React warns.
    return <Slot {...shared} />;
  }

  return (
    <motion.button
      {...shared}
      whileHover={{ scale: 1.008, y: -1 }}
      whileTap={{ scale: 0.987, y: 0 }}
      transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}

const ForwardedButton = React.forwardRef(Button);

export { ForwardedButton as Button, buttonVariants };