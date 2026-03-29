import { LucideIcon } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "motion/react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.04, duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] border border-border/60 bg-background/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
      >
        <Icon className="w-7 h-7 text-muted-foreground" />
      </motion.div>
      <h3 className="mb-2 text-lg font-medium tracking-tight">{title}</h3>
      <p className="mb-6 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline" className="gap-2">
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
