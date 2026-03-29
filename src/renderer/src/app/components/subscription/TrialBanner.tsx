import { Crown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { useSubscription } from '@/hooks/useSubscription'
import { useSubscriptionUi } from '@/context/SubscriptionUiContext'

export function TrialBanner() {
  const { isTrial, trialDaysLeft, status, isNest } = useSubscription()
  const { openUpgrade } = useSubscriptionUi()

  const shouldShow =
    (isTrial && trialDaysLeft <= 7) ||
    (status === 'trialing' && !isNest)

  if (!shouldShow) return null

  const text = !isNest && status === 'trialing'
    ? 'Your trial has ended.'
    : trialDaysLeft <= 1
      ? 'Your Nest trial ends tomorrow.'
      : `Your Nest trial ends in ${trialDaysLeft} days.`

  const deeper = trialDaysLeft <= 3 || (!isNest && status === 'trialing')

  return (
    <AnimatePresence initial={false}>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className={[
          'overflow-hidden border-b px-6',
          deeper ? 'border-warning/35 bg-warning/15' : 'border-warning/25 bg-warning/10',
        ].join(' ')}
      >
        <div className="flex min-h-11 items-center justify-between gap-4 py-2.5">
          <div className="flex items-center gap-2.5 text-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-background/65 text-warning">
              <Crown className="w-3.5 h-3.5" />
            </div>
            <span>{text}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-sm text-foreground hover:bg-background/60" onClick={openUpgrade}>
            {trialDaysLeft <= 3 || (!isNest && status === 'trialing') ? 'Keep Nest →' : 'Choose a plan →'}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}