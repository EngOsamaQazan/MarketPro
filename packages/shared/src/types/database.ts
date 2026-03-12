export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          name_en: string | null
          slug: string
          type: 'agency' | 'brand'
          logo_url: string | null
          website: string | null
          plan: 'free' | 'starter' | 'pro' | 'enterprise'
          plan_expires_at: string | null
          settings: Json
          limits: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          slug: string
          id?: string
          name_en?: string | null
          type?: 'agency' | 'brand'
          logo_url?: string | null
          website?: string | null
          plan?: 'free' | 'starter' | 'pro' | 'enterprise'
          plan_expires_at?: string | null
          settings?: Json
          limits?: Json
        }
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'manager' | 'viewer'
          invited_by: string | null
          invited_at: string | null
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          organization_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'manager' | 'viewer'
          invited_by?: string | null
          accepted_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["organization_members"]["Insert"]>
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          name_ar: string
          price_monthly: number
          price_yearly: number
          limits: Json
          features: string[]
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id: string
          name: string
          name_ar: string
          price_monthly?: number
          price_yearly?: number
          limits?: Json
          features?: string[]
          is_active?: boolean
          sort_order?: number
        }
        Update: Partial<Database["public"]["Tables"]["subscription_plans"]["Insert"]>
      }
      usage_logs: {
        Row: {
          id: string
          organization_id: string
          metric: string
          count: number
          period: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          organization_id: string
          metric: string
          period: string
          count?: number
          metadata?: Json | null
        }
        Update: Partial<Database["public"]["Tables"]["usage_logs"]["Insert"]>
      }
      ad_campaigns: {
        Row: {
          ai_optimizations: Json | null
          auto_optimize: boolean | null
          company_id: string
          organization_id: string | null
          created_at: string
          created_by: string
          daily_budget: number
          end_date: string | null
          id: string
          name: string
          objective: string
          performance_data: Json | null
          plan_id: string | null
          platform: string
          platform_campaign_id: string | null
          spent_amount: number
          start_date: string
          status: string
          target_audience: Json | null
          total_budget: number
          updated_at: string
        }
        Insert: {
          ai_optimizations?: Json | null
          auto_optimize?: boolean | null
          company_id: string
          organization_id?: string | null
          created_at?: string
          created_by: string
          daily_budget?: number
          end_date?: string | null
          id?: string
          name: string
          objective: string
          performance_data?: Json | null
          plan_id?: string | null
          platform: string
          platform_campaign_id?: string | null
          spent_amount?: number
          start_date: string
          status?: string
          target_audience?: Json | null
          total_budget?: number
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["ad_campaigns"]["Insert"]>
      }
      companies: {
        Row: {
          assigned_manager_id: string | null
          city: string
          contract_end_date: string | null
          contract_start_date: string
          country: string
          created_at: string
          description: string | null
          id: string
          industry: string
          logo_url: string | null
          monthly_budget: number
          name: string
          name_en: string | null
          organization_id: string | null
          package_type: string
          status: string
          target_audience: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          assigned_manager_id?: string | null
          city: string
          contract_end_date?: string | null
          contract_start_date: string
          country: string
          description?: string | null
          id?: string
          industry: string
          logo_url?: string | null
          monthly_budget?: number
          name: string
          name_en?: string | null
          organization_id?: string | null
          package_type?: string
          status?: string
          target_audience?: string | null
          website?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          active_organization_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          push_token: string | null
          role: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          active_organization_id?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          push_token?: string | null
          role?: string
          username?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
      }
      api_keys: {
        Row: {
          id: string
          service: string
          key_name: string
          key_value: string
          is_active: boolean
          organization_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          service: string
          key_name: string
          key_value: string
          id?: string
          is_active?: boolean
          organization_id?: string | null
          created_by?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["api_keys"]["Insert"]>
      }
      marketing_plans: {
        Row: {
          ai_analysis: Json | null
          approved_at: string | null
          approved_by: string | null
          budget_breakdown: Json | null
          company_id: string
          organization_id: string | null
          created_at: string
          created_by: string
          id: string
          kpis: Json | null
          month: string
          objectives: string[] | null
          pdf_url: string | null
          status: string
          target_platforms: string[] | null
          title: string
          total_budget: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_by: string
          month: string
          title: string
          organization_id?: string | null
          total_budget?: number
          ai_analysis?: Json | null
          budget_breakdown?: Json | null
          kpis?: Json | null
          objectives?: string[] | null
          pdf_url?: string | null
          status?: string
          target_platforms?: string[] | null
        }
        Update: Partial<Database["public"]["Tables"]["marketing_plans"]["Insert"]>
      }
      content_calendar: {
        Row: {
          ai_generated: boolean | null
          approval_note: string | null
          approval_status: string
          company_id: string
          organization_id: string | null
          content_type: string
          created_at: string
          created_by: string
          engagement_data: Json | null
          hashtags: string[] | null
          id: string
          media_urls: string[] | null
          plan_id: string | null
          platform: string
          published_post_id: string | null
          scheduled_date: string
          scheduled_time: string
          status: string
          text_content: string
          updated_at: string
        }
        Insert: {
          company_id: string
          organization_id?: string | null
          content_type: string
          created_by: string
          platform: string
          scheduled_date: string
          scheduled_time: string
          text_content: string
          ai_generated?: boolean | null
          hashtags?: string[] | null
          media_urls?: string[] | null
          plan_id?: string | null
          status?: string
          approval_status?: string
        }
        Update: Partial<Database["public"]["Tables"]["content_calendar"]["Insert"]>
      }
      monthly_reports: {
        Row: {
          company_id: string
          organization_id: string | null
          created_at: string
          id: string
          month: string
          pdf_url: string | null
          plan_id: string | null
          report_data: Json
          sent_at: string | null
          status: string
          updated_at: string
          viewed_by_client: boolean | null
        }
        Insert: {
          company_id: string
          organization_id?: string | null
          month: string
          report_data?: Json
          plan_id?: string | null
          pdf_url?: string | null
          status?: string
        }
        Update: Partial<Database["public"]["Tables"]["monthly_reports"]["Insert"]>
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string
          company_id: string | null
          organization_id: string | null
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          title: string
          type: string
          user_id: string
          company_id?: string | null
          organization_id?: string | null
          data?: Json | null
          action_url?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>
      }
      conversations: {
        Row: {
          id: string
          company_id: string
          organization_id: string | null
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          organization_id?: string | null
          title?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          organization_id: string | null
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          conversation_id: string
          organization_id?: string | null
          sender_id: string
          content: string
        }
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>
      }
      ai_activity_log: {
        Row: {
          id: string
          action_type: string
          action_data: Json | null
          result: Json | null
          tokens_used: number | null
          cost_estimate: number | null
          created_by: string | null
          company_id: string | null
          organization_id: string | null
          created_at: string
        }
        Insert: {
          action_type: string
          action_data?: Json | null
          result?: Json | null
          tokens_used?: number | null
          cost_estimate?: number | null
          created_by?: string | null
          company_id?: string | null
          organization_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["ai_activity_log"]["Insert"]>
      }
      invoices: {
        Row: {
          id: string
          company_id: string
          organization_id: string | null
          amount: number
          month: string
          description: string | null
          due_date: string
          items: Json | null
          status: string
          created_at: string
          updated_at: string
          sent_at: string | null
          paid_at: string | null
        }
        Insert: {
          company_id: string
          organization_id?: string | null
          amount: number
          month: string
          due_date: string
          description?: string | null
          items?: Json | null
          status?: string
        }
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>
      }
      social_accounts: {
        Row: {
          access_token: string
          account_id: string
          account_name: string
          company_id: string
          organization_id: string | null
          created_at: string
          followers_count: number | null
          id: string
          is_connected: boolean | null
          last_synced_at: string | null
          permissions: string[] | null
          platform: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          account_id: string
          account_name: string
          company_id: string
          organization_id?: string | null
          platform: string
          followers_count?: number | null
          permissions?: string[] | null
          refresh_token?: string | null
          token_expires_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["social_accounts"]["Insert"]>
      }
      platform_statistics: {
        Row: {
          id: string
          country_code: string
          country_name: string
          platform: string
          users_count: number | null
          penetration_rate: number | null
          rank_in_country: number | null
          peak_hours: string[] | null
          demographics: Json | null
          source: string | null
          report_date: string
          updated_at: string
        }
        Insert: {
          country_code: string
          country_name: string
          platform: string
          report_date: string
          id?: string
          users_count?: number | null
          penetration_rate?: number | null
          rank_in_country?: number | null
          peak_hours?: string[] | null
          demographics?: Json | null
          source?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["platform_statistics"]["Insert"]>
      }
      ads: {
        Row: {
          id: string
          campaign_id: string
          organization_id: string | null
          platform_ad_id: string | null
          name: string
          ad_type: string
          headline: string | null
          body_text: string | null
          call_to_action: string | null
          media_urls: string[] | null
          landing_url: string | null
          status: string
          performance_data: Json | null
          ab_test_variant: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          name: string
          ad_type: string
          organization_id?: string | null
          platform_ad_id?: string | null
          headline?: string | null
          body_text?: string | null
          call_to_action?: string | null
          media_urls?: string[] | null
          landing_url?: string | null
          status?: string
          performance_data?: Json | null
          ab_test_variant?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["ads"]["Insert"]>
      }
    }
    Views: Record<string, never>
    Functions: {
      get_user_org_ids: {
        Args: Record<string, never>
        Returns: string[]
      }
      get_active_org_id: {
        Args: Record<string, never>
        Returns: string | null
      }
    }
    Enums: Record<string, never>
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
