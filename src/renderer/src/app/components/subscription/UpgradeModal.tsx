import { useEffect, useMemo, useState } from 'react'
import { Check, Crown, Loader2, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { modalVariants } from '@/utils/animations'
import { useSubscription } from '@/hooks/useSubscription'
import { useSubscriptionUi } from '@/context/SubscriptionUiContext'
import { useHome } from '@/hooks/useHome'
import { useAuthContext } from '@/context/AuthContext'
import { stripePricesResponseSchema, type StripePricesResponse } from '@/lib/schemas/subscription'

type BillingInterval = 'annual' | 'monthly'

const FEATURES = [
  'Full expense history, all time',
  'Budget trends and Hazel insights',
  'Chore recurrence and streaks',
  'One subscription for both of you',
]

export function UpgradeModal() {
  const { upgradeOpen, closeUpgrade } = useSubscriptionUi()
  const { home } = useHome()
  const { user } = useAuthContext()
  const { hasUsedTrial, stripeCustomerId } = useSubscription()
  const [selected, setSelected] = useState<BillingInterval>('annual')
  const [prices, setPrices] = useState<StripePricesResponse | null>(null)
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!upgradeOpen) {
      setCheckingOut(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoadingPrices(true)
    setError(null)

    window.api
      .stripeGetPrices()
      .then((result) => {
        if (cancelled) return
        setPrices(stripePricesResponseSchema.parse(result))
      })
      .catch(() => {
        if (cancelled) return
        setError('We couldn’t load the latest Nest plans right now. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoadingPrices(false)
      })

    return () => {
      cancelled = true
    }
  }, [upgradeOpen])

  const selectedPlan = useMemo(() => {
    if (!prices) return null
    return selected === 'annual' ? prices.annual : prices.monthly
  }, [prices, selected])

  const handleCheckout = async () => {
    if (!selectedPlan || !home?.id || !user?.email) return
    setCheckingOut(true)
    setError(null)

    try {
      const session = await window.api.stripeCreateCheckoutSession({
        priceId: selectedPlan.id,
        homeId: home.id,
        customerEmail: user.email,
        stripeCustomerId: stripeCustomerId ?? undefined,
        hasUsedTrial,
      })

      const opened = await window.api.openExternal(session.url)
      if (opened?.error) {
        throw new Error(opened.error)
      }

      closeUpgrade()
    } catch {
      setError('Something went wrong opening Stripe checkout. Please try again.')
      setCheckingOut(false)
    }
  }

  return (
    <Dialog open={upgradeOpen} onOpenChange={(open) => (open ? undefined : closeUpgrade())}>
      <DialogContent className="max-w-xl overflow-hidden rounded-3xl border-border/70 bg-card p-0">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="p-6 sm:p-7"
        >
          <DialogHeader className="mb-5 text-left">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                <Crown className="w-3.5 h-3.5 mr-1.5" />
                Roost Nest
              </Badge>
            </div>
            <DialogTitle className="text-2xl font-semibold">Upgrade to Roost Nest</DialogTitle>
            <DialogDescription className="text-sm leading-6">
              The complete experience for your home.
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait" initial={false}>
            {checkingOut ? (
              <motion.div
                key="redirecting"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center"
              >
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"
                >
                  <Loader2 className="w-6 h-6 animate-spin" />
                </motion.div>
                <div className="space-y-1.5">
                  <p className="text-lg font-medium">Opening Stripe checkout...</p>
                  <p className="text-sm text-muted-foreground">You’ll finish choosing your Nest plan in your browser.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="plans" variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                <div className="inline-flex rounded-2xl border border-border/70 bg-muted/35 p-1">
                  {([
                    { value: 'annual', label: 'Annual' },
                    { value: 'monthly', label: 'Monthly' },
                  ] as const).map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setSelected(item.value)}
                      className={[
                        'rounded-xl px-4 py-2 text-sm transition-colors',
                        selected === item.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                      ].join(' ')}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="grid gap-2.5">
                  {FEATURES.map((feature) => (
                    <div key={feature} className="flex items-center gap-2.5 rounded-2xl bg-muted/25 px-3.5 py-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary/30 text-secondary-foreground">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <PlanCard
                    selected={selected === 'monthly'}
                    title="Monthly"
                    price={prices?.monthly.formattedAmount ?? '£4.99'}
                    sub="Flexible — cancel any time"
                    interval="month"
                    loading={loadingPrices}
                    onSelect={() => setSelected('monthly')}
                  />
                  <PlanCard
                    selected={selected === 'annual'}
                    title="Annual"
                    price={prices?.annual.formattedAmount ?? '£39.99'}
                    sub="Two months free over the year"
                    interval="year"
                    loading={loadingPrices}
                    badge="2 months free"
                    highlighted
                    onSelect={() => setSelected('annual')}
                  />
                </div>

                <div className="space-y-2">
                  <Button className="w-full h-11 text-base" onClick={handleCheckout} disabled={!selectedPlan || loadingPrices}>
                    {hasUsedTrial ? 'Upgrade to Nest' : 'Start 14 days free'}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    {hasUsedTrial ? 'Your new plan will begin straight away.' : 'No card charged until day 15. Cancel any time.'}
                  </p>
                  <button
                    type="button"
                    onClick={closeUpgrade}
                    className="block w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Maybe later
                  </button>
                </div>

                {error && (
                  <div className="rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-foreground">
                    <div className="flex items-center justify-between gap-3">
                      <span>{error}</span>
                      <Button variant="ghost" size="sm" className="h-7" onClick={() => setError(null)}>
                        Try again
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

function PlanCard({
  selected,
  title,
  price,
  sub,
  interval,
  loading,
  badge,
  highlighted = false,
  onSelect,
}: {
  selected: boolean
  title: string
  price: string
  sub: string
  interval: string
  loading: boolean
  badge?: string
  highlighted?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'rounded-3xl border p-4 text-left transition-all',
        selected ? 'border-primary bg-primary/8 shadow-sm' : 'border-border/70 bg-background hover:bg-muted/20',
        highlighted ? 'ring-1 ring-primary/15' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        </div>
        {badge && (
          <Badge variant="secondary" className="bg-secondary/30 text-secondary-foreground hover:bg-secondary/30">
            <Sparkles className="w-3 h-3 mr-1" />
            {badge}
          </Badge>
        )}
      </div>
      <div className="flex items-end gap-1">
        <p className="text-2xl font-semibold">{loading ? '...' : price}</p>
        <span className="text-sm text-muted-foreground">/{interval}</span>
      </div>
    </button>
  )
}