/**
 * useMoneySettings — manages all money-related settings for the current user and home.
 *
 * Reads:
 * - home_members (current user's row): personal_income, income_visible_to_partner, income_set_at
 * - home_members (partner's row): income_visible_to_partner, personal_income (only if both consented)
 * - homes: default_expense_split, budget_carry_forward, scramble_mode, overspend_alert_threshold
 *
 * Exposes mutations for each setting with optimistic updates.
 */

import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { translateError } from '@/lib/errors'
import { toast } from 'sonner'
import { useHome } from './useHome'
import { useAuthContext } from '@/context/AuthContext'

// ── Derived values from the hook ──────────────────────────────────────────────

export interface MoneySettingsValues {
  // Income
  myIncome: number | null
  myIncomeVisibleToPartner: boolean
  incomeSetAt: Date | null
  partnerIncomeVisible: boolean      // partner has consented to share
  partnerIncome: number | null       // only non-null when both have consented
  combinedIncome: number             // sum when both set, else just mine
  // Home preferences
  defaultSplit: number               // member 1's % (0–100)
  budgetCarryForward: 'auto' | 'manual'
  scrambleMode: boolean
  overspendAlertThreshold: number    // 50–100
}

export interface MoneySettingsMutations {
  setMyIncome: (amount: number) => Promise<void>
  setIncomeVisibility: (visible: boolean) => Promise<void>
  updateHomeSetting: <K extends keyof HomeMoneySettings>(key: K, value: HomeMoneySettings[K]) => Promise<void>
  toggleScrambleMode: () => Promise<void>
}

interface HomeMoneySettings {
  default_expense_split: number
  budget_carry_forward: 'auto' | 'manual'
  scramble_mode: boolean
  overspend_alert_threshold: number
}

export function useMoneySettings(): MoneySettingsValues & MoneySettingsMutations {
  const { user } = useAuthContext()
  const { home, members } = useHome()
  const queryClient = useQueryClient()

  const currentMember = members.find((m) => m.user_id === user?.id)
  const partnerMember = members.find((m) => m.user_id !== user?.id)

  // ── Derived income values ─────────────────────────────────────────────────

  const myIncome: number | null = currentMember?.personal_income ?? null
  const myIncomeVisibleToPartner: boolean = currentMember?.income_visible_to_partner ?? false
  const incomeSetAt: Date | null = currentMember?.income_set_at
    ? new Date(currentMember.income_set_at)
    : null

  const partnerIncomeVisible: boolean = partnerMember?.income_visible_to_partner ?? false
  // Partner income is only revealed when both parties have consented
  const partnerIncome: number | null =
    myIncomeVisibleToPartner && partnerIncomeVisible
      ? (partnerMember?.personal_income ?? null)
      : null

  const combinedIncome: number =
    (myIncome ?? 0) + (partnerIncome ?? 0)

  // ── Derived home settings ─────────────────────────────────────────────────

  const defaultSplit: number = home?.default_expense_split ?? 50
  const budgetCarryForward: 'auto' | 'manual' =
    (home?.budget_carry_forward as 'auto' | 'manual') ?? 'auto'
  const scrambleMode: boolean = home?.scramble_mode ?? false
  const overspendAlertThreshold: number = home?.overspend_alert_threshold ?? 80

  // ── Mutations ─────────────────────────────────────────────────────────────

  const invalidateMembers = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['home-members', home?.id] }),
    [queryClient, home?.id]
  )
  const invalidateHome = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['home', user?.id] }),
    [queryClient, user?.id]
  )

  const setMyIncomeMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!currentMember?.id) throw new Error('Member not loaded')
      const { error } = await supabase
        .from('home_members')
        .update({
          personal_income: amount,
          income_set_at: new Date().toISOString(),
        })
        .eq('id', currentMember.id)
      if (error) throw error
    },
    onSuccess: () => {
      invalidateMembers()
    },
    onError: (err) => {
      toast.error(translateError(err))
    },
  })

  const setIncomeVisibilityMutation = useMutation({
    mutationFn: async (visible: boolean) => {
      if (!currentMember?.id) throw new Error('Member not loaded')
      const { error } = await supabase
        .from('home_members')
        .update({ income_visible_to_partner: visible })
        .eq('id', currentMember.id)
      if (error) throw error
    },
    onSuccess: () => {
      invalidateMembers()
    },
    onError: (err) => {
      toast.error(translateError(err))
    },
  })

  const updateHomeSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      if (!home?.id) throw new Error('Home not loaded')
      const { error } = await supabase
        .from('homes')
        .update({ [key]: value })
        .eq('id', home.id)
      if (error) throw error
    },
    onSuccess: () => {
      invalidateHome()
    },
    onError: (err) => {
      toast.error(translateError(err))
    },
  })

  const setMyIncome = useCallback(
    (amount: number) => setMyIncomeMutation.mutateAsync(amount),
    [setMyIncomeMutation]
  )

  const setIncomeVisibility = useCallback(
    (visible: boolean) => setIncomeVisibilityMutation.mutateAsync(visible),
    [setIncomeVisibilityMutation]
  )

  const updateHomeSetting = useCallback(
    <K extends keyof HomeMoneySettings>(key: K, value: HomeMoneySettings[K]) =>
      updateHomeSettingMutation.mutateAsync({ key, value }),
    [updateHomeSettingMutation]
  )

  const toggleScrambleMode = useCallback(
    () => updateHomeSetting('scramble_mode', !scrambleMode),
    [updateHomeSetting, scrambleMode]
  )

  return {
    // Income
    myIncome,
    myIncomeVisibleToPartner,
    incomeSetAt,
    partnerIncomeVisible,
    partnerIncome,
    combinedIncome,
    // Home preferences
    defaultSplit,
    budgetCarryForward,
    scrambleMode,
    overspendAlertThreshold,
    // Mutations
    setMyIncome,
    setIncomeVisibility,
    updateHomeSetting,
    toggleScrambleMode,
  }
}
