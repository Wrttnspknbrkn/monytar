-- Migration: Organization-Based Billing with Stripe Integration
-- Adds user limits and subscription period tracking for organization-based billing
-- Note: Some Stripe columns were added in 003_subscription_columns.sql

-- Add user limit and period tracking columns (not in 003)
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;

-- Update subscription_status constraint to include all valid values if needed
-- This is a no-op if constraint already exists with correct values
DO $$
BEGIN
  -- Drop existing constraint if it exists with wrong values
  ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_subscription_status_check;
  -- Add constraint with all valid values
  ALTER TABLE organizations ADD CONSTRAINT organizations_subscription_status_check 
    CHECK (subscription_status IN ('active', 'inactive', 'trialing', 'past_due', 'canceled', 'unpaid', 'cancelled', 'suspended'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Create subscription history table for audit trail
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  event_type TEXT NOT NULL,
  previous_tier TEXT,
  new_tier TEXT,
  previous_status TEXT,
  new_status TEXT,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'usd',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user invitations table for admin to invite users
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'finance', 'admin')),
  department_id UUID REFERENCES departments(id),
  invited_by UUID REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_history_org ON subscription_history(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_org ON user_invitations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe ON organizations(stripe_customer_id);

-- Function to check if organization can add more users
CREATE OR REPLACE FUNCTION can_add_user(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  SELECT COUNT(*) INTO current_count
  FROM users
  WHERE organization_id = org_id AND is_active = true;
  
  SELECT max_users INTO max_allowed
  FROM organizations
  WHERE id = org_id;
  
  RETURN current_count < COALESCE(max_allowed, 5);
END;
$$ LANGUAGE plpgsql;

-- Function to get organization user count
CREATE OR REPLACE FUNCTION get_org_user_count(org_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM users
  WHERE organization_id = org_id AND is_active = true;
  RETURN count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent adding users beyond limit
CREATE OR REPLACE FUNCTION check_user_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT can_add_user(NEW.organization_id) THEN
    RAISE EXCEPTION 'Organization has reached maximum user limit. Please upgrade your subscription.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger (only on insert)
DROP TRIGGER IF EXISTS enforce_user_limit ON users;
CREATE TRIGGER enforce_user_limit
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_user_limit();

-- Update max_users based on subscription tier (matches lib/products.ts)
CREATE OR REPLACE FUNCTION update_max_users_on_tier_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_tier != OLD.subscription_tier THEN
    NEW.max_users := CASE NEW.subscription_tier
      WHEN 'free' THEN 5
      WHEN 'starter' THEN 25
      WHEN 'professional' THEN 100
      WHEN 'enterprise' THEN 999999
      ELSE 5
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_max_users_on_tier_change ON organizations;
CREATE TRIGGER set_max_users_on_tier_change
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_max_users_on_tier_change();

-- Set default max_users for existing organizations (matches lib/products.ts)
UPDATE organizations
SET max_users = CASE subscription_tier
  WHEN 'free' THEN 5
  WHEN 'starter' THEN 25
  WHEN 'professional' THEN 100
  WHEN 'enterprise' THEN 999999
  ELSE 5
END
WHERE max_users IS NULL;
