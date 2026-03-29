import type { ReactNode } from 'react'
import { Crown, Lock } from 'lucide-react'
import { Card, CardContent } from './card'
import { Button } from './button'
import { Badge } from './badge'
import { useSubscription } from '@/hooks/useSubscription'
import { useSubscriptionUi } from '@/context/SubscriptionUiContext'
import type { NestFeature } from '@/lib/schemas/subscription'

interface NestGateProps {
  feature: NestFeature
  variant?: 'soft' | 'hard' | 'hidden'
  children: ReactNode
  promptText?: string
  promptCta?: string
}

const FEATURE_COPY: Record<NestFeature, string> = {
  expense_history: 'Your full expense history lives in Roost Nest. Your data is safe — upgrade to see everything.',
  budget_insights: 'Hazel can spot trends in your spending with Roost Nest.',
  hazel_categorisation: 'Hazel categorises expenses automatically with Roost Nest.',
  chore_recurrence: 'Recurring chores are part of Roost Nest.',
  calendar_sync: 'Apple Calendar sync is part of Roost Nest.',
  hazel_budget_insights: 'Hazel can spot trends in your spending with Roost Nest.',
}

export function NestGate({
  feature,
  variant = 'soft',
  children,
  promptText,
  promptCta,
}: NestGateProps) {
  const { canAccess, isTrial, isExpired } = useSubscription()
  const { openUpgrade } = useSubscriptionUi()

  if (canAccess(feature)) return <>{children}</>
  if (variant === 'hidden') return null

  const ctaLabel = promptCta ?? (isTrial || isExpired ? 'Upgrade to Nest' : 'Try Nest free for 14 days')
  const body = promptText ?? FEATURE_COPY[feature]

  const prompt = (
    <Card className="border-primary/20 bg-primary/10 shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary text-primary-foreground hover:bg-primary">
            <Crown className="w-3.5 h-3.5 mr-1.5" />
            Roost Nest
          </Badge>
          <Lock className="w-3.5 h-3.5 text-primary/60" />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm leading-6 text-muted-foreground">{body}</p>
        </div>
        <div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={openUpgrade}>
            {ctaLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (variant === 'hard') return prompt

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-55 blur-[2px] saturate-75">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md">{prompt}</div>
      </div>
    </div>
  )
}