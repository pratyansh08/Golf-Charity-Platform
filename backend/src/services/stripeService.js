const Stripe = require("stripe");
const subscriptionService = require("./subscriptionService");

let stripeClient;

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is missing.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
};

const getPriceIdForPlan = (planType) => {
  const mapping = {
    monthly: process.env.STRIPE_MONTHLY_PRICE_ID,
    yearly: process.env.STRIPE_YEARLY_PRICE_ID,
  };

  return mapping[planType] || null;
};

const getPlanTypeFromPriceId = (priceId) => {
  if (!priceId) {
    return null;
  }

  if (process.env.STRIPE_MONTHLY_PRICE_ID === priceId) {
    return "monthly";
  }

  if (process.env.STRIPE_YEARLY_PRICE_ID === priceId) {
    return "yearly";
  }

  return null;
};

const getPlanTypeFromStripeSubscription = (subscription) => {
  const priceId = subscription.items?.data?.[0]?.price?.id || null;
  return getPlanTypeFromPriceId(priceId);
};

const getFrontendUrl = () => process.env.FRONTEND_URL || "http://localhost:5173";

const getSuccessUrl = () =>
  process.env.STRIPE_SUCCESS_URL ||
  `${getFrontendUrl()}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`;

const getCancelUrl = () =>
  process.env.STRIPE_CANCEL_URL || `${getFrontendUrl()}/dashboard?checkout=cancel`;

const isStripeConfigured = () =>
  Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.STRIPE_MONTHLY_PRICE_ID &&
      process.env.STRIPE_YEARLY_PRICE_ID
  );

const normalizeSubscriptionStatus = (providerStatus) => {
  if (["active", "trialing"].includes(providerStatus)) {
    return "active";
  }

  return "inactive";
};

const buildSubscriptionSnapshot = (subscription) => {
  const planType =
    getPlanTypeFromStripeSubscription(subscription) ||
    subscriptionService.getPlan(subscription.metadata?.planType)?.type ||
    "monthly";

  return {
    planType,
    providerCustomerId: subscription.customer,
    providerSubscriptionId: subscription.id,
    providerPriceId: subscription.items?.data?.[0]?.price?.id || null,
    providerStatus: subscription.status,
    status: normalizeSubscriptionStatus(subscription.status),
    startsAt: new Date(subscription.current_period_start * 1000).toISOString(),
    endsAt: new Date(subscription.current_period_end * 1000).toISOString(),
    cancelledAt: subscription.cancel_at_period_end || subscription.canceled_at
      ? new Date((subscription.canceled_at || subscription.current_period_end) * 1000).toISOString()
      : null,
  };
};

module.exports = {
  getStripeClient,
  getPriceIdForPlan,
  getPlanTypeFromPriceId,
  getPlanTypeFromStripeSubscription,
  getSuccessUrl,
  getCancelUrl,
  isStripeConfigured,
  normalizeSubscriptionStatus,
  buildSubscriptionSnapshot,
};
