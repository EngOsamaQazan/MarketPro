-- Satwa Migration 003: Multi-tenant SaaS
-- Adds organizations, memberships, subscription plans, and tenant isolation via RLS

-- ============================================
-- ORGANIZATIONS (tenants)
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'agency' CHECK (type IN ('agency', 'brand')),
  logo_url TEXT,
  website TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  plan_expires_at TIMESTAMPTZ,
  settings JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{
    "max_clients": 1,
    "max_posts_month": 10,
    "max_campaigns": 0,
    "ai_credits_month": 0,
    "max_team_members": 1
  }',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_organizations_updated_at
  BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ORGANIZATION MEMBERS (who belongs where)
-- ============================================
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'manager', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);

-- ============================================
-- SUBSCRIPTION PLANS (reference table)
-- ============================================
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0,
  limits JSONB NOT NULL DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO subscription_plans (id, name, name_ar, price_monthly, price_yearly, limits, features, sort_order) VALUES
  ('free', 'Free', 'مجاني', 0, 0,
   '{"max_clients": 1, "max_posts_month": 10, "max_campaigns": 0, "ai_credits_month": 0, "max_team_members": 1}',
   ARRAY['عميل واحد', '10 منشورات/شهر', 'تقارير أساسية'], 0),
  ('starter', 'Starter', 'بداية', 49, 470,
   '{"max_clients": 5, "max_posts_month": 50, "max_campaigns": 5, "ai_credits_month": 100, "max_team_members": 3}',
   ARRAY['5 عملاء', '50 منشور/شهر', '5 حملات', 'AI محدود', '3 أعضاء فريق'], 1),
  ('pro', 'Pro', 'احترافي', 149, 1430,
   '{"max_clients": 25, "max_posts_month": -1, "max_campaigns": -1, "ai_credits_month": 1000, "max_team_members": 10}',
   ARRAY['25 عميل', 'منشورات غير محدودة', 'حملات غير محدودة', 'AI كامل', 'PDF', '10 أعضاء فريق'], 2),
  ('enterprise', 'Enterprise', 'مؤسسات', 399, 3830,
   '{"max_clients": -1, "max_posts_month": -1, "max_campaigns": -1, "ai_credits_month": -1, "max_team_members": -1}',
   ARRAY['عملاء غير محدود', 'كل شيء غير محدود', 'API access', 'White-label', 'دعم مخصص'], 3);

-- ============================================
-- USAGE LOGS (track consumption per org)
-- ============================================
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  period TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_org_period ON usage_logs(organization_id, period);
CREATE INDEX idx_usage_metric ON usage_logs(metric, period);

-- ============================================
-- INVOICES table (was missing from migrations)
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  month DATE NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_invoices_updated_at
  BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ADD organization_id TO ALL EXISTING TABLES
-- ============================================

-- profiles: active org
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_companies_org ON companies(organization_id);

-- social_accounts
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_social_accounts_org ON social_accounts(organization_id);

-- marketing_plans
ALTER TABLE marketing_plans ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_marketing_plans_org ON marketing_plans(organization_id);

-- content_calendar
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_content_calendar_org ON content_calendar(organization_id);

-- ad_campaigns
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_org ON ad_campaigns(organization_id);

-- ads (via campaign, but add for direct queries)
ALTER TABLE ads ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_ads_org ON ads(organization_id);

-- monthly_reports
ALTER TABLE monthly_reports ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_monthly_reports_org ON monthly_reports(organization_id);

-- notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- messages (via conversation, but add for direct queries)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- ai_activity_log
ALTER TABLE ai_activity_log ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_ai_activity_org ON ai_activity_log(organization_id);

-- api_keys (each org has its own API keys)
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id);

-- invoices
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);

-- Relax ai_activity_log action_type constraint to support more types
ALTER TABLE ai_activity_log DROP CONSTRAINT IF EXISTS ai_activity_log_action_type_check;

-- ============================================
-- UPDATE RLS POLICIES FOR MULTI-TENANT
-- ============================================

-- Helper function: get user's org IDs
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get user's active org
CREATE OR REPLACE FUNCTION get_active_org_id()
RETURNS UUID AS $$
  SELECT active_organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop old policies that conflict
DROP POLICY IF EXISTS "admins_all_access" ON profiles;
DROP POLICY IF EXISTS "admins_all_companies" ON companies;
DROP POLICY IF EXISTS "users_own_profile" ON profiles;
DROP POLICY IF EXISTS "clients_own_company" ON companies;
DROP POLICY IF EXISTS "managers_assigned_companies" ON companies;
DROP POLICY IF EXISTS "clients_own_plans" ON marketing_plans;
DROP POLICY IF EXISTS "clients_own_reports" ON monthly_reports;
DROP POLICY IF EXISTS "users_own_notifications" ON notifications;
DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;
DROP POLICY IF EXISTS "Admins manage api_keys" ON api_keys;

-- Organizations: members can view their orgs
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_member_access" ON organizations FOR SELECT
  USING (id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_owner_manage" ON organizations FOR ALL
  USING (id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Organization members: see members of your orgs
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view" ON organization_members FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_members_manage" ON organization_members FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Profiles: see own + org members
CREATE POLICY "profiles_own" ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_org_members" ON profiles FOR SELECT
  USING (id IN (
    SELECT user_id FROM organization_members 
    WHERE organization_id IN (SELECT get_user_org_ids())
  ));

CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Macro for tenant-isolated tables
-- Companies
CREATE POLICY "companies_org_isolation" ON companies FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()));

-- Social accounts
CREATE POLICY "social_accounts_org_isolation" ON social_accounts FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()));

-- Marketing plans
CREATE POLICY "marketing_plans_org_isolation" ON marketing_plans FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()));

-- Content calendar
CREATE POLICY "content_calendar_org_isolation" ON content_calendar FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()));

-- Ad campaigns
CREATE POLICY "ad_campaigns_org_isolation" ON ad_campaigns FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()));

-- Ads
CREATE POLICY "ads_org_isolation" ON ads FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()));

-- Monthly reports
CREATE POLICY "monthly_reports_org_isolation" ON monthly_reports FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()));

-- Notifications
CREATE POLICY "notifications_org_isolation" ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_org_insert" ON notifications FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()) OR organization_id IS NULL);

CREATE POLICY "notifications_own_update" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Conversations
CREATE POLICY "conversations_org_isolation" ON conversations FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()));

-- Messages
CREATE POLICY "messages_org_isolation" ON messages FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()));

-- AI activity log
CREATE POLICY "ai_activity_log_org_isolation" ON ai_activity_log FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()));

-- API keys
CREATE POLICY "api_keys_org_isolation" ON api_keys FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()));

-- Invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_org_isolation" ON invoices FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()));

-- Usage logs
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_logs_org_isolation" ON usage_logs FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()));

-- Subscription plans: public read
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscription_plans_public_read" ON subscription_plans FOR SELECT
  USING (true);

-- Platform statistics: keep public read
-- (already has policy from migration 001)

-- ============================================
-- UPDATED HANDLE_NEW_USER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
  org_slug TEXT;
BEGIN
  -- Create profile
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  );
  
  -- Auto-create organization for new signups
  org_slug := 'org-' || substr(replace(NEW.id::text, '-', ''), 1, 12);
  
  INSERT INTO organizations (id, name, slug, type)
  VALUES (
    gen_random_uuid(),
    COALESCE(NEW.raw_user_meta_data->>'org_name', NEW.raw_user_meta_data->>'full_name', 'My Organization'),
    org_slug,
    COALESCE(NEW.raw_user_meta_data->>'org_type', 'agency')
  )
  RETURNING id INTO org_id;
  
  -- Add user as owner of their org
  INSERT INTO organization_members (organization_id, user_id, role, accepted_at)
  VALUES (org_id, NEW.id, 'owner', now());
  
  -- Set active org
  UPDATE profiles SET active_organization_id = org_id WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- BACKFILL: Migrate existing data to default org
-- ============================================
-- This creates a default org for existing data and assigns it
DO $$
DECLARE
  default_org_id UUID;
  first_admin_id UUID;
BEGIN
  -- Find first admin user
  SELECT id INTO first_admin_id FROM profiles WHERE role IN ('admin', 'super_admin') LIMIT 1;
  
  -- Only run if there's existing data without org_id
  IF first_admin_id IS NOT NULL AND EXISTS (SELECT 1 FROM companies WHERE organization_id IS NULL LIMIT 1) THEN
    -- Create default organization
    INSERT INTO organizations (id, name, name_en, slug, type, plan, limits)
    VALUES (
      gen_random_uuid(),
      'المنظمة الافتراضية',
      'Default Organization',
      'default-org',
      'agency',
      'pro',
      '{"max_clients": 25, "max_posts_month": -1, "max_campaigns": -1, "ai_credits_month": 1000, "max_team_members": 10}'
    )
    RETURNING id INTO default_org_id;
    
    -- Add all existing users to default org
    INSERT INTO organization_members (organization_id, user_id, role, accepted_at)
    SELECT default_org_id, id, 
      CASE 
        WHEN role IN ('admin', 'super_admin') THEN 'owner'
        WHEN role = 'manager' THEN 'manager'
        ELSE 'viewer'
      END,
      now()
    FROM profiles
    ON CONFLICT (organization_id, user_id) DO NOTHING;
    
    -- Set active org for all users
    UPDATE profiles SET active_organization_id = default_org_id WHERE active_organization_id IS NULL;
    
    -- Backfill organization_id on all tables
    UPDATE companies SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE social_accounts SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE marketing_plans SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE content_calendar SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE ad_campaigns SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE ads SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE monthly_reports SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE notifications SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE conversations SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE messages SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE ai_activity_log SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE api_keys SET organization_id = default_org_id WHERE organization_id IS NULL;
  END IF;
END $$;
