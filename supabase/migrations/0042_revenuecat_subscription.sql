-- Add subscription_owner_user_id to homes table (Option A: first subscriber wins)
ALTER TABLE homes
  ADD COLUMN IF NOT EXISTS subscription_owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Extend promo_codes table to support timed access (1 week, 1 month, 1 year)
ALTER TABLE promo_codes
  ADD COLUMN IF NOT EXISTS grants_access_days INTEGER;

-- grants_access_days = NULL  → lifetime access (existing behaviour)
-- grants_access_days = 7     → 1 week
-- grants_access_days = 30    → 1 month
-- grants_access_days = 365   → 1 year

COMMENT ON COLUMN homes.subscription_owner_user_id IS 'The user whose Apple IAP subscription grants Pro to this household. Null for gift/admin access.';
COMMENT ON COLUMN promo_codes.grants_access_days IS 'Days of Pro access granted. NULL means lifetime.';
