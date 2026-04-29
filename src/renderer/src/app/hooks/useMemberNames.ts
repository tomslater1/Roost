import { useApp } from '@/context/AppContext'
import { getInitials } from '@/lib/utils'

export interface MemberNames {
  /** Current user's display name or email prefix */
  me: string
  /** Partner's display name, or "Your partner" if none */
  partner: string
  meInitials: string
  partnerInitials: string
  /** Avatar colour hex for the current user */
  meColour: string
  /** Avatar colour hex for the partner */
  partnerColour: string
  /** True when a partner member exists in the home */
  hasPartner: boolean
}

export function useMemberNames(): MemberNames {
  const { currentUser, partnerName, currentMember, partnerMember } = useApp()

  return {
    me: currentUser,
    partner: partnerName,
    meInitials: getInitials(currentUser),
    partnerInitials: getInitials(partnerName),
    meColour: currentMember?.avatar_color ?? '#d4795e',
    partnerColour: partnerMember?.avatar_color ?? '#9db19f',
    hasPartner: !!partnerMember,
  }
}
