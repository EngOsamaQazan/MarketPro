-- MarketPro Database Schema
-- Initial migration: Core tables for the digital marketing management system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'manager', 'client')),
  phone TEXT,
  company_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- COMPANIES (client businesses)
-- ============================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_en TEXT,
  industry TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  website TEXT,
  logo_url TEXT,
  description TEXT,
  target_audience TEXT,
  monthly_budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  package_type TEXT NOT NULL DEFAULT 'basic' CHECK (package_type IN ('basic', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  assigned_manager_id UUID REFERENCES profiles(id),
  contract_start_date DATE NOT NULL,
  contract_end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK from profiles to companies
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_company
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- ============================================
-- SOCIAL ACCOUNTS
-- ============================================
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'snapchat', 'x', 'linkedin', 'youtube')),
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  permissions TEXT[] DEFAULT '{}',
  followers_count INTEGER DEFAULT 0,
  is_connected BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, platform, account_id)
);

-- ============================================
-- MARKETING PLANS
-- ============================================
CREATE TABLE marketing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'in_progress', 'completed')),
  objectives TEXT[] DEFAULT '{}',
  target_platforms TEXT[] DEFAULT '{}',
  total_budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  budget_breakdown JSONB DEFAULT '{}',
  kpis JSONB DEFAULT '{}',
  ai_analysis JSONB DEFAULT '{}',
  pdf_url TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, month)
);

-- ============================================
-- CONTENT CALENDAR
-- ============================================
CREATE TABLE content_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES marketing_plans(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'snapchat', 'x', 'linkedin', 'youtube')),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'story', 'reel', 'video', 'carousel', 'article')),
  text_content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'scheduled', 'published', 'failed')),
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approval_note TEXT,
  published_post_id TEXT,
  engagement_data JSONB,
  ai_generated BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- AD CAMPAIGNS
-- ============================================
CREATE TABLE ad_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES marketing_plans(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'snapchat', 'x', 'linkedin', 'youtube')),
  platform_campaign_id TEXT,
  name TEXT NOT NULL,
  objective TEXT NOT NULL CHECK (objective IN ('awareness', 'traffic', 'engagement', 'leads', 'sales')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'failed')),
  daily_budget NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  spent_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  target_audience JSONB DEFAULT '{}',
  performance_data JSONB,
  ai_optimizations JSONB DEFAULT '[]',
  auto_optimize BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ADS (individual ads within campaigns)
-- ============================================
CREATE TABLE ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  platform_ad_id TEXT,
  name TEXT NOT NULL,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('image', 'video', 'carousel', 'collection')),
  headline TEXT,
  body_text TEXT,
  call_to_action TEXT,
  media_urls TEXT[] DEFAULT '{}',
  landing_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'rejected')),
  performance_data JSONB,
  ab_test_variant TEXT CHECK (ab_test_variant IN ('A', 'B', 'C')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- MONTHLY REPORTS
-- ============================================
CREATE TABLE monthly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES marketing_plans(id) ON DELETE SET NULL,
  month DATE NOT NULL,
  report_data JSONB NOT NULL DEFAULT '{}',
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'sent')),
  sent_at TIMESTAMPTZ,
  viewed_by_client BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, month)
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('plan_ready', 'report_ready', 'approval_needed', 'alert', 'message')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CONVERSATIONS
-- ============================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PLATFORM STATISTICS (regional data)
-- ============================================
CREATE TABLE platform_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'snapchat', 'x', 'linkedin', 'youtube')),
  users_count BIGINT DEFAULT 0,
  penetration_rate NUMERIC(5,2) DEFAULT 0,
  rank_in_country INTEGER DEFAULT 0,
  peak_hours TEXT[] DEFAULT '{}',
  demographics JSONB DEFAULT '{}',
  source TEXT,
  report_date DATE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(country_code, platform, report_date)
);

-- ============================================
-- AI ACTIVITY LOG
-- ============================================
CREATE TABLE ai_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('plan_generated', 'content_created', 'campaign_optimized', 'report_generated')),
  input_data JSONB,
  output_data JSONB,
  model_used TEXT,
  tokens_used INTEGER DEFAULT 0,
  cost_usd NUMERIC(8,4) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_company ON profiles(company_id);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_manager ON companies(assigned_manager_id);
CREATE INDEX idx_social_accounts_company ON social_accounts(company_id);
CREATE INDEX idx_social_accounts_platform ON social_accounts(platform);
CREATE INDEX idx_marketing_plans_company_month ON marketing_plans(company_id, month);
CREATE INDEX idx_content_calendar_company_date ON content_calendar(company_id, scheduled_date);
CREATE INDEX idx_content_calendar_status ON content_calendar(status);
CREATE INDEX idx_ad_campaigns_company ON ad_campaigns(company_id);
CREATE INDEX idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX idx_ads_campaign ON ads(campaign_id);
CREATE INDEX idx_monthly_reports_company_month ON monthly_reports(company_id, month);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_platform_statistics_country ON platform_statistics(country_code);
CREATE INDEX idx_ai_activity_company ON ai_activity_log(company_id, created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_activity_log ENABLE ROW LEVEL SECURITY;

-- Admins can see everything
CREATE POLICY "admins_all_access" ON profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admins_all_companies" ON companies FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Users can see their own profile
CREATE POLICY "users_own_profile" ON profiles FOR SELECT
  USING (id = auth.uid());

-- Clients can only see their own company
CREATE POLICY "clients_own_company" ON companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role IN ('admin', 'manager') OR company_id = companies.id)
    )
  );

-- Managers can see companies assigned to them
CREATE POLICY "managers_assigned_companies" ON companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'manager'
    ) AND assigned_manager_id = auth.uid()
  );

-- Clients can view their own plans
CREATE POLICY "clients_own_plans" ON marketing_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role IN ('admin', 'manager') OR company_id = marketing_plans.company_id)
    )
  );

-- Clients can view their own reports
CREATE POLICY "clients_own_reports" ON monthly_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role IN ('admin', 'manager') OR company_id = monthly_reports.company_id)
    )
  );

-- Users see their own notifications
CREATE POLICY "users_own_notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_update_own_notifications" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Platform statistics are public read
CREATE POLICY "public_platform_stats" ON platform_statistics FOR SELECT
  USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_companies_updated_at
  BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_social_accounts_updated_at
  BEFORE UPDATE ON social_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_marketing_plans_updated_at
  BEFORE UPDATE ON marketing_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_content_calendar_updated_at
  BEFORE UPDATE ON content_calendar FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_ad_campaigns_updated_at
  BEFORE UPDATE ON ad_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_ads_updated_at
  BEFORE UPDATE ON ads FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_monthly_reports_updated_at
  BEFORE UPDATE ON monthly_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update conversation last_message_at on new message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET last_message_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_message_update_conversation
  AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();
