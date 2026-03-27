import { useRef } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown, ChevronUp } from "lucide-react"

const ease = [0.16, 1, 0.3, 1] as const
const spring = { type: "spring" as const, stiffness: 400, damping: 17 }

const numVariants = {
  enter: (dir: number) => ({ y: dir * 14, opacity: 0, scale: 0.85 }),
  center: { y: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ y: dir * -14, opacity: 0, scale: 0.85 }),
}

interface TimeUnitProps {
  value: number
  wrap: number
  step: number
  label: string
  onChange: (v: number) => void
}

function TimeUnit({ value, wrap, step, label, onChange }: TimeUnitProps) {
  const dirRef = useRef(0)

  const inc = () => {
    dirRef.current = 1
    onChange((value + step) % wrap)
  }

  const dec = () => {
    dirRef.current = -1
    onChange((value - step + wrap) % wrap)
  }

  const display = String(value).padStart(2, "0")

  return (
    <div className="flex flex-col items-center gap-0.5">
      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.88 }}
        transition={spring}
        onClick={inc}
        className="flex h-7 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        aria-label={`Increase ${label}`}
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </motion.button>

      <div className="relative flex h-10 w-10 select-none items-center justify-center overflow-hidden rounded-xl bg-background/70">
        <AnimatePresence mode="popLayout" custom={dirRef.current}>
          <motion.span
            key={value}
            custom={dirRef.current}
            variants={numVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.14, ease }}
            className="absolute text-xl font-semibold tracking-tight tabular-nums"
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>

      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.88 }}
        transition={spring}
        onClick={dec}
        className="flex h-7 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        aria-label={`Decrease ${label}`}
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </motion.button>

      <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

export interface TimePickerProps {
  value: string
  onChange: (v: string) => void
  label?: string
  minuteStep?: number
  className?: string
}

export function TimePicker({
  value,
  onChange,
  label,
  minuteStep = 5,
  className,
}: TimePickerProps) {
  const [rawH = "0", rawM = "0"] = value.split(":")
  const h = Number.parseInt(rawH, 10) || 0
  const m = Number.parseInt(rawM, 10) || 0

  const setH = (newH: number) =>
    onChange(`${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}`)

  const setM = (newM: number) =>
    onChange(`${String(h).padStart(2, "0")}:${String(newM).padStart(2, "0")}`)

  return (
    <div className={["flex flex-col items-center gap-2", className].filter(Boolean).join(" ")}>
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
      <div className="inline-flex items-end gap-1 rounded-[1.25rem] border border-border/70 bg-muted/35 px-4 py-3 shadow-sm">
        <TimeUnit value={h} wrap={24} step={1} label="hr" onChange={setH} />
        <div className="flex flex-col items-center px-0.5 pb-[1.625rem]">
          <span className="text-xl font-semibold leading-none text-muted-foreground">:</span>
        </div>
        <TimeUnit value={m} wrap={60} step={minuteStep} label="min" onChange={setM} />
      </div>
    </div>
  )
}