import { Utensils, ArrowRight, Clock, Users, Zap } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { AnimatedPage } from "../components/AnimatedPage";

const features = [
  {
    icon: Zap,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    title: "Meal plan sync",
    description:
      "When you plan a meal in DishBoard, its ingredients appear instantly in your Roost shopping list.",
  },
  {
    icon: Users,
    iconBg: "bg-secondary/20",
    iconColor: "text-secondary-foreground",
    title: "Smart deduplication",
    description:
      "Already have milk on the list? DishBoard won't add it twice — it intelligently merges quantities.",
  },
  {
    icon: Clock,
    iconBg: "bg-accent/60",
    iconColor: "text-muted-foreground",
    title: "Real-time across devices",
    description:
      "Plan dinner on your phone in DishBoard, see the shopping list update in Roost immediately.",
  },
];

export function DishBoard() {
  return (
    <AnimatedPage className="max-w-2xl mx-auto p-6 flex items-center justify-center min-h-[calc(100vh-11rem)]">
      <div className="w-full space-y-8">

        {/* Icon treatment */}
        <motion.div
          className="flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center">
            <Utensils className="w-10 h-10 text-muted-foreground" />
          </div>
          <ArrowRight className="w-6 h-6 text-muted-foreground/50" />
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center">
            <span className="text-3xl font-bold text-primary-foreground">R</span>
          </div>
        </motion.div>

        {/* Badge */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <Badge variant="secondary" className="gap-2 px-3 py-1">
            <div className="w-1.5 h-1.5 bg-warning rounded-full animate-pulse" />
            In development
          </Badge>
        </motion.div>

        {/* Heading */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35, ease: "easeOut" }}
        >
          <h1 className="text-3xl font-semibold">DishBoard integration</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Plan your meals in DishBoard and watch ingredients appear automatically in your Roost shopping list — no manual copying, no duplicate items.
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid gap-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.3, ease: "easeOut" }}
            >
              <Card>
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${f.iconBg}`}>
                      <f.icon className={`w-4 h-4 ${f.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">{f.title}</h3>
                      <p className="text-sm text-muted-foreground">{f.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.p
          className="text-xs text-muted-foreground text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.3 }}
        >
          This tab is a placeholder while the integration is built. It will be a first-class feature when DishBoard is ready.
        </motion.p>
      </div>
    </AnimatedPage>
  );
}
