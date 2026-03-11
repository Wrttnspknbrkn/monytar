-- RLS Policies for Billing Tables

-- Enable RLS on new tables
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Subscription History: Only admins can view
CREATE POLICY "Admins can view subscription history" ON subscription_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.organization_id = subscription_history.organization_id
      AND users.role = 'admin'
    )
  );

-- Only system (via service role) can insert subscription history
CREATE POLICY "Service role can manage subscription history" ON subscription_history
  FOR ALL USING (auth.role() = 'service_role');

-- User Invitations: Admins can manage, invited users can view their invitation
CREATE POLICY "Admins can manage invitations" ON user_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.organization_id = user_invitations.organization_id
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own invitation by token" ON user_invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR token = current_setting('app.invitation_token', true)
  );

-- Update organizations policy to allow admins to update billing fields
DROP POLICY IF EXISTS "Admins can update organization" ON organizations;
CREATE POLICY "Admins can update organization" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.organization_id = organizations.id
      AND users.role = 'admin'
    )
  );

-- Service role can update organizations (for Stripe webhooks)
CREATE POLICY "Service role can update organizations" ON organizations
  FOR UPDATE USING (auth.role() = 'service_role');
