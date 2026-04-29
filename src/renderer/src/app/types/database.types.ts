export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          home_id: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          home_id: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          home_id?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_rollover_history: {
        Row: {
          base_amount: number
          created_at: string | null
          effective_amount: number
          home_id: string
          id: string
          month: string
          rollover_amount: number
          template_line_id: string
        }
        Insert: {
          base_amount: number
          created_at?: string | null
          effective_amount: number
          home_id: string
          id?: string
          month: string
          rollover_amount?: number
          template_line_id: string
        }
        Update: {
          base_amount?: number
          created_at?: string | null
          effective_amount?: number
          home_id?: string
          id?: string
          month?: string
          rollover_amount?: number
          template_line_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_rollover_history_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_rollover_history_template_line_id_fkey"
            columns: ["template_line_id"]
            isOneToOne: false
            referencedRelation: "budget_template_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_template_lines: {
        Row: {
          amount: number
          amount_changed_at: string | null
          annual_amount: number | null
          budget_type: string
          created_at: string | null
          day_of_month: number | null
          home_id: string
          id: string
          is_active: boolean
          is_annual: boolean
          last_amount: number | null
          member1_percentage: number
          name: string
          note: string | null
          ownership: string
          rollover_enabled: boolean
          section_group: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          amount_changed_at?: string | null
          annual_amount?: number | null
          budget_type?: string
          created_at?: string | null
          day_of_month?: number | null
          home_id: string
          id?: string
          is_active?: boolean
          is_annual?: boolean
          last_amount?: number | null
          member1_percentage?: number
          name: string
          note?: string | null
          ownership?: string
          rollover_enabled?: boolean
          section_group: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          amount_changed_at?: string | null
          annual_amount?: number | null
          budget_type?: string
          created_at?: string | null
          day_of_month?: number | null
          home_id?: string
          id?: string
          is_active?: boolean
          is_annual?: boolean
          last_amount?: number | null
          member1_percentage?: number
          name?: string
          note?: string | null
          ownership?: string
          rollover_enabled?: boolean
          section_group?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_template_lines_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          budget_type: string
          category: string
          created_at: string
          day_of_month: number | null
          home_id: string
          id: string
          month: string
          updated_at: string
        }
        Insert: {
          amount: number
          budget_type?: string
          category: string
          created_at?: string
          day_of_month?: number | null
          home_id: string
          id?: string
          month: string
          updated_at?: string
        }
        Update: {
          amount?: number
          budget_type?: string
          category?: string
          created_at?: string
          day_of_month?: number | null
          home_id?: string
          id?: string
          month?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      chores: {
        Row: {
          assigned_to: string | null
          completed_by: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          frequency: string | null
          home_id: string
          id: string
          last_completed_at: string | null
          room: string | null
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          frequency?: string | null
          home_id: string
          id?: string
          last_completed_at?: string | null
          room?: string | null
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          frequency?: string | null
          home_id?: string
          id?: string
          last_completed_at?: string | null
          room?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chores_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_splits: {
        Row: {
          amount: number
          expense_id: string
          id: string
          settled: boolean | null
          settled_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          expense_id: string
          id?: string
          settled?: boolean | null
          settled_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          expense_id?: string
          id?: string
          settled?: boolean | null
          settled_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_splits_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          date: string
          home_id: string
          id: string
          is_recurring: boolean | null
          notes: string | null
          paid_by: string
          recurrence_interval: string | null
          split_type: string
          title: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          date?: string
          home_id: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          paid_by: string
          recurrence_interval?: string | null
          split_type?: string
          title: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          date?: string
          home_id?: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          paid_by?: string
          recurrence_interval?: string | null
          split_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      home_custom_categories: {
        Row: {
          color: string
          created_at: string
          emoji: string
          home_id: string
          id: string
          name: string
        }
        Insert: {
          color: string
          created_at?: string
          emoji: string
          home_id: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          emoji?: string
          home_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_custom_categories_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      home_members: {
        Row: {
          avatar_color: string | null
          avatar_icon: string | null
          display_name: string | null
          home_id: string
          id: string
          income_set_at: string | null
          income_visible_to_partner: boolean
          joined_at: string | null
          personal_income: number | null
          role: string
          user_id: string
        }
        Insert: {
          avatar_color?: string | null
          avatar_icon?: string | null
          display_name?: string | null
          home_id: string
          id?: string
          income_set_at?: string | null
          income_visible_to_partner?: boolean
          joined_at?: string | null
          personal_income?: number | null
          role?: string
          user_id: string
        }
        Update: {
          avatar_color?: string | null
          avatar_icon?: string | null
          display_name?: string | null
          home_id?: string
          id?: string
          income_set_at?: string | null
          income_visible_to_partner?: boolean
          joined_at?: string | null
          personal_income?: number | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_members_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      home_room_groups: {
        Row: {
          created_at: string
          home_id: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          home_id: string
          icon?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          home_id?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_room_groups_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      home_rooms: {
        Row: {
          created_at: string
          home_id: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          home_id: string
          icon?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          home_id?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_rooms_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      homes: {
        Row: {
          budget_carry_forward: string
          calendar_last_fetched_at: string | null
          calendar_token: string
          created_at: string | null
          current_period_ends_at: string | null
          default_expense_split: number
          has_used_trial: boolean
          id: string
          invite_code: string
          name: string
          next_shop_date: string | null
          overspend_alert_threshold: number
          scramble_mode: boolean
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          subscription_tier: string
          trial_ends_at: string | null
        }
        Insert: {
          budget_carry_forward?: string
          calendar_last_fetched_at?: string | null
          calendar_token?: string
          created_at?: string | null
          current_period_ends_at?: string | null
          default_expense_split?: number
          has_used_trial?: boolean
          id?: string
          invite_code?: string
          name?: string
          next_shop_date?: string | null
          overspend_alert_threshold?: number
          scramble_mode?: boolean
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          subscription_tier?: string
          trial_ends_at?: string | null
        }
        Update: {
          budget_carry_forward?: string
          calendar_last_fetched_at?: string | null
          calendar_token?: string
          created_at?: string | null
          current_period_ends_at?: string | null
          default_expense_split?: number
          has_used_trial?: boolean
          id?: string
          invite_code?: string
          name?: string
          next_shop_date?: string | null
          overspend_alert_threshold?: number
          scramble_mode?: boolean
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          subscription_tier?: string
          trial_ends_at?: string | null
        }
        Relationships: []
      }
      household_income: {
        Row: {
          combined_amount: number
          created_at: string | null
          home_id: string
          id: string
          month: string
          notes: string | null
          partner_amount: number | null
          tom_amount: number | null
          updated_at: string | null
        }
        Insert: {
          combined_amount: number
          created_at?: string | null
          home_id: string
          id?: string
          month: string
          notes?: string | null
          partner_amount?: number | null
          tom_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          combined_amount?: number
          created_at?: string | null
          home_id?: string
          id?: string
          month?: string
          notes?: string | null
          partner_amount?: number | null
          tom_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "household_income_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          chores_enabled: boolean
          expenses_enabled: boolean
          in_app_enabled: boolean
          macos_enabled: boolean
          quiet_hours_enabled: boolean
          quiet_hours_end: string
          quiet_hours_start: string
          settlements_enabled: boolean
          shopping_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          chores_enabled?: boolean
          expenses_enabled?: boolean
          in_app_enabled?: boolean
          macos_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          settlements_enabled?: boolean
          shopping_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          chores_enabled?: boolean
          expenses_enabled?: boolean
          in_app_enabled?: boolean
          macos_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          settlements_enabled?: boolean
          shopping_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          home_id: string
          id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          home_id: string
          id?: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          home_id?: string
          id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      pinboard_note_acknowledgements: {
        Row: {
          note_id: string
          seen_at: string
          user_id: string
        }
        Insert: {
          note_id: string
          seen_at?: string
          user_id: string
        }
        Update: {
          note_id?: string
          seen_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinboard_note_acknowledgements_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "pinboard_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      pinboard_notes: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          expires_at: string | null
          home_id: string
          id: string
          link_label: string | null
          link_type: string | null
          linked_entity_id: string | null
          notify_on_create: boolean
          target_scope: string
          target_user_id: string | null
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          expires_at?: string | null
          home_id: string
          id?: string
          link_label?: string | null
          link_type?: string | null
          linked_entity_id?: string | null
          notify_on_create?: boolean
          target_scope?: string
          target_user_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          expires_at?: string | null
          home_id?: string
          id?: string
          link_label?: string | null
          link_type?: string | null
          linked_entity_id?: string | null
          notify_on_create?: boolean
          target_scope?: string
          target_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinboard_notes_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          max_redemptions: number
          redeemed_at: string | null
          redeemed_by_home_id: string | null
          redemption_count: number
          type: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          max_redemptions?: number
          redeemed_at?: string | null
          redeemed_by_home_id?: string | null
          redemption_count?: number
          type?: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          max_redemptions?: number
          redeemed_at?: string | null
          redeemed_by_home_id?: string | null
          redemption_count?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_redeemed_by_home_id_fkey"
            columns: ["redeemed_by_home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_bills: {
        Row: {
          amount: number
          category: string | null
          colour: string | null
          created_at: string | null
          day_of_month: number
          home_id: string
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          colour?: string | null
          created_at?: string | null
          day_of_month: number
          home_id: string
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          colour?: string | null
          created_at?: string | null
          day_of_month?: number
          home_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_bills_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      room_group_members: {
        Row: {
          group_id: string
          room_id: string
        }
        Insert: {
          group_id: string
          room_id: string
        }
        Update: {
          group_id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "home_room_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_group_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "home_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          budget_line_id: string | null
          colour: string | null
          completed_at: string | null
          contribution_day: number | null
          created_at: string | null
          current_amount: number
          home_id: string
          icon: string | null
          id: string
          is_complete: boolean | null
          monthly_contribution: number | null
          name: string
          sort_order: number | null
          target_amount: number
          target_date: string | null
          updated_at: string | null
        }
        Insert: {
          budget_line_id?: string | null
          colour?: string | null
          completed_at?: string | null
          contribution_day?: number | null
          created_at?: string | null
          current_amount?: number
          home_id: string
          icon?: string | null
          id?: string
          is_complete?: boolean | null
          monthly_contribution?: number | null
          name: string
          sort_order?: number | null
          target_amount: number
          target_date?: string | null
          updated_at?: string | null
        }
        Update: {
          budget_line_id?: string | null
          colour?: string | null
          completed_at?: string | null
          contribution_day?: number | null
          created_at?: string | null
          current_amount?: number
          home_id?: string
          icon?: string | null
          id?: string
          is_complete?: boolean | null
          monthly_contribution?: number | null
          name?: string
          sort_order?: number | null
          target_amount?: number
          target_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_template_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_goals_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          amount: number
          created_at: string | null
          home_id: string
          id: string
          note: string | null
          paid_by: string
          paid_to: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          home_id: string
          id?: string
          note?: string | null
          paid_by: string
          paid_to: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          home_id?: string
          id?: string
          note?: string | null
          paid_by?: string
          paid_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_items: {
        Row: {
          added_by: string | null
          category: string | null
          checked: boolean | null
          checked_by: string | null
          created_at: string | null
          home_id: string
          id: string
          name: string
          quantity: string | null
          updated_at: string | null
        }
        Insert: {
          added_by?: string | null
          category?: string | null
          checked?: boolean | null
          checked_by?: string | null
          created_at?: string | null
          home_id: string
          id?: string
          name: string
          quantity?: string | null
          updated_at?: string | null
        }
        Update: {
          added_by?: string | null
          category?: string | null
          checked?: boolean | null
          checked_by?: string | null
          created_at?: string | null
          home_id?: string
          id?: string
          name?: string
          quantity?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          event_type: string
          home_id: string | null
          id: string
          payload: Json
          processed_at: string | null
          stripe_customer_id: string | null
          stripe_event_id: string
          stripe_subscription_id: string | null
        }
        Insert: {
          event_type: string
          home_id?: string | null
          id?: string
          payload: Json
          processed_at?: string | null
          stripe_customer_id?: string | null
          stripe_event_id: string
          stripe_subscription_id?: string | null
        }
        Update: {
          event_type?: string
          home_id?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          stripe_customer_id?: string | null
          stripe_event_id?: string
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          currency: string
          date_format: string
          time_format: string
          updated_at: string
          user_id: string
          week_starts: string
        }
        Insert: {
          currency?: string
          date_format?: string
          time_format?: string
          updated_at?: string
          user_id: string
          week_starts?: string
        }
        Update: {
          currency?: string
          date_format?: string
          time_format?: string
          updated_at?: string
          user_id?: string
          week_starts?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_home_for_user: {
        Args: { display_name?: string; home_name?: string }
        Returns: string
      }
      delete_account: { Args: never; Returns: undefined }
      generate_lifetime_promo_codes: {
        Args: {
          code_count?: number
          code_description?: string
          code_expires_at?: string
          code_max_redemptions?: number
          code_prefix?: string
        }
        Returns: {
          promo_code: string
          promo_created_at: string
          promo_description: string
          promo_expires_at: string
          promo_id: string
          promo_max_redemptions: number
        }[]
      }
      get_home_by_invite_code: { Args: { code: string }; Returns: string }
      get_monthly_summary: {
        Args: { p_home_id: string; p_month: string }
        Returns: Json
      }
      get_user_home_id: { Args: never; Returns: string }
      join_home_by_invite_code: {
        Args: { code: string; display_name?: string }
        Returns: string
      }
      leave_home: { Args: never; Returns: undefined }
      settle_up: {
        Args: {
          p_amount: number
          p_creditor_id: string
          p_debtor_id: string
          p_home_id: string
          p_note?: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
