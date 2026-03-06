-- Monytar Subscription Enhancement Migration
-- Adds Stripe subscription tracking columns to organizations

-- Add subscription-related columns to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' 
  CHECK (subscription_status IN ('active', 'past_due', 'cancelled', 'suspended', 'trialing'));

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS enterprise_features JSONB DEFAULT '{}';

-- Add logo and other org details
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Add phone and manager_id to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Add additional fields to vendors
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT true;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Add fields to expense_requests
ALTER TABLE expense_requests ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE expense_requests ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE expense_requests ADD COLUMN IF NOT EXISTS expense_date TIMESTAMPTZ;
ALTER TABLE expense_requests ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE expense_requests ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE expense_requests ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add description to departments
ALTER TABLE departments ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_org_stripe_customer ON organizations(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_org_stripe_subscription ON organizations(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- Function to check if organization has active subscription for a feature
CREATE OR REPLACE FUNCTION check_subscription_feature(org_id UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  org_tier TEXT;
  org_features JSONB;
BEGIN
  SELECT subscription_tier, enterprise_features INTO org_tier, org_features
  FROM organizations WHERE id = org_id;
  
  -- Enterprise can access everything
  IF org_tier = 'enterprise' THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific features by tier
  CASE feature_name
    WHEN 'api_access' THEN
      RETURN org_tier IN ('business', 'enterprise');
    WHEN 'sso' THEN
      RETURN org_tier IN ('business', 'enterprise');
    WHEN 'custom_workflows' THEN
      RETURN org_tier IN ('professional', 'business', 'enterprise');
    WHEN 'advanced_reporting' THEN
      RETURN org_tier IN ('professional', 'business', 'enterprise');
    WHEN 'multi_currency' THEN
      RETURN org_tier IN ('professional', 'business', 'enterprise');
    WHEN 'vendor_management' THEN
      RETURN org_tier IN ('professional', 'business', 'enterprise');
    ELSE
      RETURN TRUE; -- Basic features available to all
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Comments for documentation
COMMENT ON COLUMN organizations.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN organizations.stripe_subscription_id IS 'Active Stripe subscription ID';
COMMENT ON COLUMN organizations.enterprise_features IS 'JSON object containing enterprise-specific feature flags';
COMMENT ON FUNCTION check_subscription_feature IS 'Checks if an organization can access a specific feature based on their subscription tier';
