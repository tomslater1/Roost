# Stripe subscription rollout — Phase 4.5

This is the simple checklist for finishing the Roost Nest subscription rollout after the foundation pass.

---

## 1. Add the required environment variables

### Electron app (`.env.local`)

These are used by the desktop app when opening checkout and loading prices:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
MAIN_VITE_STRIPE_SECRET_KEY=sk_live_...
MAIN_VITE_STRIPE_MONTHLY_PRICE_ID=price_...
MAIN_VITE_STRIPE_ANNUAL_PRICE_ID=price_...
```

### Supabase Edge Functions secrets

These are used by `supabase/functions/stripe-webhook`:

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  SUPABASE_SERVICE_ROLE_KEY=... \
  SUPABASE_URL=https://YOUR_PROJECT.supabase.co
```

---

## 2. Run the subscription migration in Supabase SQL Editor

Run the contents of:

- `supabase/migrations/0024_subscription.sql`

This adds the household subscription columns and the immutable `subscription_events` log.

---

## 3. Deploy the Stripe webhook Edge Function

From the project root:

```bash
supabase functions deploy stripe-webhook --no-verify-jwt
```

Why `--no-verify-jwt`?

Because Stripe calls the function directly and cannot send a Supabase auth token. Stripe authenticity is verified inside the function using the `stripe-signature` header and `STRIPE_WEBHOOK_SECRET`.

---

## 4. Register the webhook endpoint in Stripe

In the Stripe dashboard:

1. Open **Developers → Webhooks**
2. Click **Add endpoint**
3. Use this URL:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

4. Subscribe to these events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.paused`
- `customer.subscription.resumed`

5. Copy the webhook signing secret (`whsec_...`)
6. Set it in Supabase as `STRIPE_WEBHOOK_SECRET`

---

## 5. Manual lifecycle test checklist

Use a real test household and Stripe test mode first.

### Trial → Active

1. Create a brand-new household
2. Confirm it starts with:
   - `subscription_status = trialing`
   - `subscription_tier = nest`
3. Open **Settings → Subscription**
4. Start checkout
5. Complete Stripe Checkout
6. Confirm webhook updates the home to:
   - `subscription_status = active`
   - `subscription_tier = nest`
   - `stripe_customer_id` populated
   - `stripe_subscription_id` populated

### Active → Canceled

1. Open **Manage subscription** in Roost
2. Cancel in Stripe customer portal
3. Confirm webhook updates the home to canceled when Stripe sends the event
4. Confirm gated features fall back cleanly in the app

### Canceled → Active again

1. Resubscribe through Stripe
2. Confirm the home returns to `subscription_status = active`

### Past due

1. Simulate a failed payment in Stripe test mode
2. Confirm the home moves to `subscription_status = past_due`
3. Confirm the Roost UI shows the calm billing issue state

---

## 6. Quick database checks

### Check the current home subscription state

```sql
select
  id,
  name,
  subscription_status,
  subscription_tier,
  trial_ends_at,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  current_period_ends_at,
  has_used_trial
from public.homes
order by created_at desc;
```

### Check recorded Stripe webhook events

```sql
select
  stripe_event_id,
  event_type,
  stripe_customer_id,
  stripe_subscription_id,
  processed_at
from public.subscription_events
order by processed_at desc;
```

---

## 7. What is already done in code

- Household-level subscription state on `homes`
- `subscription_events` audit log
- Stripe checkout IPC
- Stripe portal IPC
- Stripe price lookup IPC
- Subscription settings page
- Upgrade modal
- `NestGate` gating primitive
- Webhook function scaffold
- Trial-at-signup logic at the database layer

---

## 8. Remaining manual work

These parts cannot be completed purely in the repo:

- Put the real live Stripe keys and price IDs into the correct environments
- Run the migration in the live Supabase project
- Deploy the webhook function to Supabase
- Register the webhook endpoint in Stripe
- Manually test the full lifecycle end to end