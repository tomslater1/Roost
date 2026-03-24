import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Check, Handshake } from "lucide-react";

function PayPalLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="#009cde" d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 4.643-5.813 4.643H12.46c-.524 0-.968.382-1.05.9l-1.12 7.106-.31 1.964a.641.641 0 0 1-.633.74H5.75l-.087.557a.535.535 0 0 0 .528.628h3.699c.435 0 .806-.317.874-.748l.036-.188.694-4.404.045-.24a.882.882 0 0 1 .874-.748h.55c3.565 0 6.354-1.448 7.169-5.637.34-1.748.165-3.21-.91-4.087z" />
    </svg>
  )
}

function MonzoLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="#FF3B30" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.8 16.2L14.4 9.6l-2.4 3.6-2.4-3.6-2.4 6.6H4.8L7.2 7.8l2.4 3.6 2.4-3.6 2.4 3.6 2.4-3.6 2.4 8.4h-2.4z" />
    </svg>
  )
}
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useApp } from "../context/AppContext";

const ease = [0.43, 0.13, 0.23, 0.96] as const
const spring = { type: "spring" as const, stiffness: 400, damping: 17 }

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
  return (
    <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-medium text-primary">{initials}</span>
    </div>
  )
}

type PaymentMethod = "manual"

export function SettleUpModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { getBalance, addSettlement, currentUser, partnerName } = useApp()
  const balance = getBalance()

  const [amount, setAmount] = useState(balance.amount.toFixed(2))
  const [note, setNote] = useState("")
  const [method, setMethod] = useState<PaymentMethod>("manual")
  const [settled, setSettled] = useState(false)

  const payer = balance.oweType === "owes" ? currentUser : partnerName
  const payee = balance.oweType === "owes" ? partnerName : currentUser
  const settledAmount = parseFloat(amount) || 0

  const handleSettle = () => {
    if (settledAmount <= 0) return
    addSettlement({ from: payer, to: payee, amount: settledAmount, date: new Date(), note: note || undefined })
    setSettled(true)
    setTimeout(() => {
      setSettled(false)
      setAmount(balance.amount.toFixed(2))
      setNote("")
      onOpenChange(false)
    }, 1800)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!settled) onOpenChange(v) }}>
      <DialogContent className="max-w-sm">
        <AnimatePresence mode="wait">
          {settled ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex flex-col items-center justify-center py-10 gap-4"
            >
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                className="w-16 h-16 rounded-full bg-[#7fa087]/20 border-2 border-[#7fa087]/30 flex items-center justify-center"
              >
                <Check className="w-7 h-7 text-[#7fa087]" strokeWidth={2.5} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3, ease }}
                className="text-center"
              >
                <p className="font-medium text-lg">All settled up!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  £{settledAmount.toFixed(2)} recorded between {payer} and {payee}
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <DialogHeader>
                <DialogTitle>Settle up</DialogTitle>
              </DialogHeader>

              {/* Transfer summary */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.05, ease }}
                className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <Avatar name={payer} />
                  <p className="text-xs text-muted-foreground">{payer}</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ x: -8, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3, ease: "easeOut" }}
                  >
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                  <p className="text-sm font-medium text-primary">£{balance.amount.toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <Avatar name={payee} />
                  <p className="text-xs text-muted-foreground">{payee}</p>
                </div>
              </motion.div>

              {/* Amount */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.1, ease }}
                className="space-y-2"
              >
                <Label htmlFor="settle-amount">Amount (£)</Label>
                <Input
                  id="settle-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
              </motion.div>

              {/* Payment method */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.15, ease }}
                className="space-y-2"
              >
                <Label>How did you pay?</Label>

                {/* Manual — available */}
                <button
                  type="button"
                  onClick={() => setMethod("manual")}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-primary bg-primary/8 text-primary transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Handshake className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Record as settled</p>
                    <p className="text-xs text-muted-foreground">Mark the balance as paid manually</p>
                  </div>
                </button>

                {/* Coming soon row */}
                <div className="grid grid-cols-2 gap-2">
                  {/* PayPal */}
                  <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-background opacity-50 cursor-not-allowed select-none">
                    <div className="w-8 h-8 rounded-lg bg-[#003087]/10 flex items-center justify-center flex-shrink-0">
                      <PayPalLogo className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">PayPal</p>
                      <p className="text-xs text-muted-foreground">Coming soon</p>
                    </div>
                  </div>

                  {/* Monzo */}
                  <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-background opacity-50 cursor-not-allowed select-none">
                    <div className="w-8 h-8 rounded-lg bg-[#FF3B30]/10 flex items-center justify-center flex-shrink-0">
                      <MonzoLogo className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Monzo</p>
                      <p className="text-xs text-muted-foreground">Coming soon</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Note */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.2, ease }}
                className="space-y-2"
              >
                <Label htmlFor="settle-note">
                  Note{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="settle-note"
                  placeholder="e.g. Bank transfer, cash…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.25, ease }}
                className="flex gap-2 justify-end pt-1"
              >
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring}>
                  <Button onClick={handleSettle} disabled={settledAmount <= 0}>
                    Confirm £{settledAmount > 0 ? settledAmount.toFixed(2) : "0.00"}
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
