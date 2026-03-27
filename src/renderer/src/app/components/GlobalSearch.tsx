import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { Search, ArrowUpRight, CornerDownLeft, Command, X } from "lucide-react"
import { Input } from "./ui/input"
import { useGlobalSearch } from "../hooks/useGlobalSearch"

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { results, suggestion } = useGlobalSearch(query)

  useEffect(() => {
    if (!open) {
      setQuery("")
      setSelectedIndex(0)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }

    window.addEventListener("mousedown", handlePointerDown)
    return () => window.removeEventListener("mousedown", handlePointerDown)
  }, [open, onOpenChange])

  const groupedResults = useMemo(() => {
    const groups = new Map<string, typeof results>()
    for (const result of results) {
      groups.set(result.section, [...(groups.get(result.section) ?? []), result])
    }
    return Array.from(groups.entries())
  }, [results])

  const flatResults = useMemo(() => groupedResults.flatMap(([, items]) => items), [groupedResults])

  const acceptSuggestion = () => {
    if (!suggestion) return
    setQuery((value) => value + suggestion)
  }

  const handleSelect = (index: number) => {
    const item = flatResults[index]
    if (!item) return
    navigate(item.route)
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div ref={containerRef} className="relative w-[28rem] max-w-[42vw]">
      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 z-10" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setSelectedIndex((current) => Math.min(current + 1, Math.max(flatResults.length - 1, 0)))
            }
            if (e.key === "ArrowUp") {
              e.preventDefault()
              setSelectedIndex((current) => Math.max(current - 1, 0))
            }
            if (e.key === "Enter") {
              e.preventDefault()
              handleSelect(selectedIndex)
            }
            if (e.key === "Tab" && suggestion) {
              e.preventDefault()
              acceptSuggestion()
            }
            if (e.key === "Escape") {
              e.preventDefault()
              onOpenChange(false)
            }
          }}
          placeholder="Search Roost"
          className="h-11 rounded-xl border-border/80 bg-background/85 pl-11 pr-20 text-sm font-normal"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground px-2">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {query && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-[calc(100%+0.5rem)] left-0 right-0 rounded-[1.1rem] border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="max-h-[28rem] overflow-y-auto px-2 py-2">
              <AnimatePresence mode="popLayout">
                {groupedResults.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-4 py-10 text-center"
                  >
                    <p className="text-sm font-medium mb-1">Nothing matched that</p>
                    <p className="text-sm text-muted-foreground">Try a page name, person, note, category, or item you’ve already added.</p>
                  </motion.div>
                ) : (
                  groupedResults.map(([section, items]) => (
                    <motion.div
                      key={section}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="py-1"
                    >
                      <div className="px-3 pb-1 pt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                        {section}
                      </div>
                      <div className="space-y-1">
                        {items.map((item) => {
                          const index = flatResults.findIndex((result) => result.id === item.id)
                          const Icon = item.icon
                          const isSelected = index === selectedIndex

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onMouseEnter={() => setSelectedIndex(index)}
                              onClick={() => handleSelect(index)}
                              className={[
                                "w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                                isSelected ? "bg-primary/10" : "hover:bg-muted/50",
                              ].join(" ")}
                            >
                              <div className={[
                                "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                                isSelected ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground",
                              ].join(" ")}>
                                <Icon className="w-4 h-4" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium truncate">{item.title}</p>
                                </div>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
                              </div>

                              <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
                                {isSelected ? <CornerDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-border/70 px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground bg-background/50">
              <div className="flex items-center gap-4">
                <span>↑↓ move</span>
                <span>↩ open</span>
                {suggestion && <span>tab complete</span>}
              </div>
              <span>Searches the whole app</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
