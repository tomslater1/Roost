import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Check,
  ChevronDown,
  Crown,
  CreditCard,
  HeartHandshake,
  LineChart,
  Shield,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useSubscription } from '@/hooks/useSubscription'
import { useSubscriptionUi } from '@/context/SubscriptionUiContext'
import { useRedeemPromo } from '@/hooks/useRedeemPromo'
import { stripePricesResponseSchema, type StripePricesResponse } from '@/lib/schemas/subscription'

const INCLUDED = [
  {
    icon: LineChart,
    title: 'A clearer picture of your home money',
    body: 'See your full expense history, month-to-month budget movement, and the patterns that are hard to spot at a glance.',
  },
  {
    icon: WandSparkles,
    title: 'Hazel gets more helpful',
    body: 'Nest unlocks Hazel’s expense categorisation, budget insights, and warmer financial guidance across your shared home life.',
  },
  {
    icon: HeartHandshake,
    title: 'Built for both of you together',
    body: 'One Nest subscription covers the whole household, so both of you get the complete Roost experience without extra setup.',
  },
  {
    icon: Shield,
    title: 'Your history stays safe either way',
    body: 'Nothing disappears if you pause or cancel. Nest simply reveals more of the home you’ve already built together inside Roost.',
  },
]

const FREE_INCLUDED = [
  'Shared shopping, chores, pinboard, and activity',
  'Current month budget snapshot only',
  'Latest 30 days of expenses',
  'Manual household planning basics',
]

const NEST_INCLUDED = [
  'All-time expense history for the household',
  'Budget trends and richer month-to-month planning',
  'Hazel expense categorisation and budget insights',
  'Recurring chores, streaks, and deeper household rhythm',
]

const SALES_POINTS = [
  'See the full story of your household money, not just the latest month.',
  'Let Hazel do more of the thinking for you with richer categorisation and insight.',
  'Keep the rhythm of your home with recurring chores, streaks, and better planning.',
  'Unlock the version of Roost that feels complete for both of you.',
]

export function Subscription() {
  const {
    status,
    isTrial,
    isLifetime,
    trialDaysLeft,
    trialEndsAt,
    currentPeriodEnds,
    stripeCustomerId,
    stripePriceId,
    hasUsedTrial,
  } = useSubscription()
  const { openUpgrade } = useSubscriptionUi()

  const [faqOpen, setFaqOpen] = useState(false)
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [prices, setPrices] = useState<StripePricesResponse | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)
  const { redeem, isLoading: redeemingPromo, error: promoError, success: promoSuccess } = useRedeemPromo()

  useEffect(() => {
    let cancelled = false
    window.api
      .stripeGetPrices()
      .then((result) => {
        if (!cancelled) setPrices(stripePricesResponseSchema.parse(result))
      })
      .catch(() => null)
    return () => {
      cancelled = true
    }
  }, [])

  const currentPlan = useMemo(() => {
    if (!prices || !stripePriceId) return null
    if (prices.monthly.id === stripePriceId) return { label: 'Monthly', price: prices.monthly.formattedAmount }
    if (prices.annual.id === stripePriceId) return { label: 'Annual', price: prices.annual.formattedAmount }
    return null
  }, [prices, stripePriceId])

  const promoErrorCopy = promoError
    ? {
        not_found: "That code doesn’t look right — check it and try again.",
        already_redeemed: 'That code has already been used.',
        expired: 'That code has expired.',
        already_have_lifetime: 'You already have lifetime Nest access — you’re all set.',
        server_error: 'Something went wrong. Try again in a moment.',
      }[promoError]
    : null

  const handlePortal = async () => {
    if (!stripeCustomerId) return
    setLoadingPortal(true)
    try {
      const session = await window.api.stripeCreatePortalSession({ stripeCustomerId })
      const result = await window.api.openExternal(session.url)
      if (result?.error) throw new Error(result.error)
    } finally {
      setLoadingPortal(false)
    }
  }

  const handlePromoRedeem = async () => {
    if (!promoCode.trim()) return
    await redeem(promoCode)
  }

  const promoSection = (
    <Card>
      <CardContent className="p-6 space-y-4">
        <button
          type="button"
          onClick={() => setPromoOpen((v) => !v)}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Have a promo code?
        </button>

        <AnimatePresence initial={false}>
          {promoOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-2">
                {promoSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-2xl bg-secondary/20 px-4 py-3 text-secondary-foreground"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/30">
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">You’re all set — welcome to Roost Nest.</span>
                  </motion.div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Promo code</label>
                      <div className="flex gap-2">
                        <input
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="e.g. ROOST-EARLY-2026"
                          disabled={redeemingPromo}
                          className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60"
                        />
                        <Button className="h-11 px-5" onClick={handlePromoRedeem} disabled={redeemingPromo || !promoCode.trim()}>
                          {redeemingPromo ? 'Applying…' : 'Apply'}
                        </Button>
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                      {promoErrorCopy && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="text-sm text-muted-foreground"
                        >
                          {promoErrorCopy}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )

  if (isLifetime) {
    return (
      <div className="max-w-3xl space-y-6">
        <HeroCard
          badge="Roost Nest"
          icon={Crown}
          title="Roost Nest"
          description="Everything is unlocked, forever"
          body="You have lifetime access to Roost Nest. Everything is unlocked, forever."
          badgeAccent={<Badge className="bg-secondary/30 text-secondary-foreground hover:bg-secondary/30">Lifetime</Badge>}
        >
          <div className="rounded-3xl border border-secondary/30 bg-secondary/15 p-5">
            <p className="text-base font-medium">You have lifetime access to Roost Nest.</p>
            <p className="text-sm text-muted-foreground mt-1.5">Thank you for being part of Roost from the beginning.</p>
          </div>
        </HeroCard>

        {promoSection}
      </div>
    )
  }

  if (isTrial) {
    return (
      <div className="max-w-3xl space-y-6">
        <HeroCard
          badge="Roost Nest"
          icon={Crown}
          title="You’re on Roost Nest"
          description={`Free trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} remaining`}
          body="You’re in the complete version of Roost right now — the deeper money view, the richer Hazel help, and the calmer planning tools built for your home."
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-primary/20 bg-primary/10 p-4">
            <div className="space-y-1">
              <p className="text-base font-medium">Keep the complete Roost experience</p>
              <p className="text-sm text-muted-foreground">Choose a Nest plan now so your home keeps the deeper view when the trial ends.</p>
            </div>
            <Button className="h-12 text-base sm:min-w-[260px]" onClick={openUpgrade}>
              Keep Nest — choose a plan
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Trial progress</span>
              <span>{14 - trialDaysLeft} of 14 days used</span>
            </div>
            <Progress value={((14 - trialDaysLeft) / 14) * 100} className="h-3 bg-muted [&>div]:bg-primary" />
          </div>

          <FeatureGrid items={INCLUDED} />

          <div className="rounded-2xl bg-muted/20 px-4 py-3.5 text-sm leading-6 text-muted-foreground">
            Your trial ends on {trialEndsAt ? format(trialEndsAt, 'd MMMM yyyy') : '—'}. No charge until then, and nothing in your home disappears if you choose not to continue.
          </div>
          <p className="text-sm text-muted-foreground">
            Pick the plan that feels right for your home, any time before the trial ends.
          </p>

          <FaqCard
            open={faqOpen}
            onToggle={() => setFaqOpen((v) => !v)}
            question="What happens when my trial ends?"
            answer="If you decide not to keep Nest, Roost simply returns to the free plan. Your shared history, household data, and everything you’ve already put into Roost stays safe — Nest just reveals more of it."
          />
        </HeroCard>

        {promoSection}
      </div>
    )
  }

  if (status === 'active') {
    return (
      <div className="max-w-3xl space-y-6">
        <HeroCard
          badge="Roost Nest"
          icon={Crown}
          title="Roost Nest"
          description="Your home is on the complete plan"
          body="Nest keeps the deeper parts of Roost open for both of you — full history, richer Hazel help, and the planning layer that makes your home feel more held together over time."
          badgeAccent={<Badge className="bg-secondary/30 text-secondary-foreground hover:bg-secondary/30">Active</Badge>}
        >
          <div className="rounded-3xl border border-primary/20 bg-primary/10 p-4">
            <p className="text-base font-medium">You’re on the complete version of Roost</p>
            <p className="text-sm text-muted-foreground mt-1.5">Nest keeps the thoughtful parts of your shared home visible: the history, the patterns, and the calmer planning layer that grows more useful over time.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoTile
              label="Current plan"
              value={currentPlan ? `${currentPlan.label} · ${currentPlan.price}` : 'Roost Nest'}
              description="One subscription covers the whole household."
            />
            <InfoTile
              label="Next billing"
              value={currentPeriodEnds ? `Renews ${format(currentPeriodEnds, 'd MMMM yyyy')}` : 'Billing date coming soon'}
              description="Managed securely in Stripe."
            />
          </div>

          <FeatureGrid items={INCLUDED.slice(0, 3)} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-muted/20 px-4 py-4">
            <div>
              <p className="text-sm font-medium">Need to update billing details or switch plans?</p>
              <p className="text-sm text-muted-foreground mt-1">You can manage everything safely in Stripe’s customer portal.</p>
            </div>
            <Button className="h-11 sm:min-w-[220px]" onClick={handlePortal} disabled={!stripeCustomerId || loadingPortal}>
              <CreditCard className="w-4 h-4 mr-1.5" />
              {loadingPortal ? 'Opening Stripe…' : 'Manage subscription'}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">Thank you for supporting Roost.</p>
        </HeroCard>

        {promoSection}
      </div>
    )
  }

  if (status === 'past_due') {
    return (
      <div className="max-w-3xl space-y-6">
        <HeroCard
          badge="Roost Nest"
          icon={CreditCard}
          title="Payment issue"
          description="A small billing hiccup, nothing dramatic"
          body="There was a problem with your last payment. Your Nest features are still active while you sort it out, so your home doesn’t suddenly feel interrupted."
          className="border-warning/25 bg-warning/8"
        >
          <div className="rounded-2xl bg-background/60 px-4 py-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Updating your payment method in Stripe should be all it takes. If anything feels off, you can reply to any Stripe receipt email and pick it up from there.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button className="h-11 sm:min-w-[220px]" onClick={handlePortal} disabled={!stripeCustomerId || loadingPortal}>
              Update payment method
            </Button>
            <p className="text-sm text-muted-foreground">Questions? Reply to any receipt email.</p>
          </div>
        </HeroCard>

        {promoSection}
      </div>
    )
  }

  if (status === 'canceled') {
    return (
      <div className="max-w-3xl space-y-6">
        <HeroCard
          badge="Roost Nest"
          icon={HeartHandshake}
          title="Nest subscription ended"
          description="Everything you built is still here"
          body="Your history and household data are all safe. If Nest felt useful, you can come back to it any time and pick up right where you left off."
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-primary/20 bg-primary/10 p-4">
            <div className="space-y-1">
              <p className="text-base font-medium">Bring back the complete view</p>
              <p className="text-sm text-muted-foreground">Resubscribe to reopen your full history, Hazel insights, and deeper household planning.</p>
            </div>
            <Button className="h-12 text-base sm:min-w-[240px]" onClick={openUpgrade}>Resubscribe to Nest</Button>
          </div>

          <FeatureGrid items={INCLUDED.slice(0, 3)} />
          <p className="text-sm text-muted-foreground">Your home is ready whenever you want the deeper view again.</p>
        </HeroCard>

        {promoSection}
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <HeroCard
        badge="Roost"
        icon={Sparkles}
        title="You’re on the free plan"
        description="A lighter version of Roost"
        body="Free keeps the basics moving, but Nest is where Roost becomes the full shared-home experience — the version with memory, rhythm, insight, and a much clearer picture of life together."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-primary/20 bg-primary/10 p-4">
          <div className="space-y-1">
            <p className="text-base font-medium">Upgrade your home to Roost Nest</p>
            <p className="text-sm text-muted-foreground">Unlock the version of Roost that feels complete: full history, richer Hazel help, and deeper planning for both of you.</p>
          </div>
          <Button className="h-12 text-base sm:min-w-[260px]" onClick={openUpgrade}>
            {hasUsedTrial ? 'Upgrade to Nest' : 'Try Nest free for 14 days'}
          </Button>
        </div>

        <div className="grid gap-2.5">
          {SALES_POINTS.map((point) => (
            <div key={point} className="flex items-start gap-2.5 rounded-2xl bg-muted/20 px-3.5 py-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <p className="text-sm leading-6">{point}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <CompareCard
            label="Included on free"
            title="The essentials only"
            items={FREE_INCLUDED}
          />
          <CompareCard
            label="What Nest adds"
            title="The complete shared-home experience"
            items={NEST_INCLUDED}
            accent
          />
        </div>

        <div className="rounded-2xl bg-muted/20 px-4 py-4 text-sm leading-6 text-muted-foreground">
          Nest is for couples who want Roost to do more than hold the basics. It gives your home memory, richer context, and the kind of insight that only becomes more valuable the longer you live with it.
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">No credit card required to start your trial.</p>
          <p className="text-xs text-muted-foreground">One Nest subscription covers both of you in the same home.</p>
        </div>
      </HeroCard>

      {promoSection}
    </div>
  )
}

function HeroCard({
  badge,
  icon: Icon,
  title,
  description,
  body,
  children,
  badgeAccent,
  className = '',
}: {
  badge: string
  icon: React.ElementType
  title: string
  description: string
  body: string
  children: React.ReactNode
  badgeAccent?: React.ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-primary text-primary-foreground hover:bg-primary w-fit">
              <Icon className="w-3.5 h-3.5 mr-1.5" />
              {badge}
            </Badge>
            {badgeAccent}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="text-base text-muted-foreground">{description}</p>
            <p className="text-sm leading-6 text-muted-foreground max-w-2xl">{body}</p>
          </div>
        </div>

        {children}
      </CardContent>
    </Card>
  )
}

function FeatureGrid({
  items,
}: {
  items: Array<{ icon: React.ElementType; title: string; body: string }>
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.title} className="rounded-2xl border border-border/70 bg-background/55 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-secondary/20 text-secondary-foreground">
                <Icon className="w-4 h-4" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-sm leading-6 text-muted-foreground">{item.body}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CompareCard({
  label,
  title,
  items,
  accent = false,
}: {
  label: string
  title: string
  items: string[]
  accent?: boolean
}) {
  return (
    <div
      className={[
        'rounded-3xl border p-5',
        accent ? 'border-primary/25 bg-primary/8' : 'border-border/70 bg-background/60',
      ].join(' ')}
    >
      <div className="space-y-2 mb-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <h3 className="text-lg font-medium">{title}</h3>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2.5">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-secondary/30 text-secondary-foreground mt-0.5">
              <Check className="w-3.5 h-3.5" />
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function FaqCard({
  open,
  onToggle,
  question,
  answer,
}: {
  open: boolean
  onToggle: () => void
  question: string
  answer: string
}) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-medium">{question}</p>
          <p className="text-xs text-muted-foreground mt-0.5">A calm explanation, nothing scary.</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-2xl bg-muted/20 px-4 py-3 text-sm leading-6 text-muted-foreground">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function InfoTile({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      <p className="text-sm font-medium">{value}</p>
      <p className="text-xs text-muted-foreground mt-1.5">{description}</p>
    </div>
  )
}