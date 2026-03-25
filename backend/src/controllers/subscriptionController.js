const subscriptionModel = require("../models/subscriptionModel");
const paymentModel = require("../models/paymentModel");
const userModel = require("../models/userModel");
const subscriptionService = require("../services/subscriptionService");
const stripeService = require("../services/stripeService");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");

const getPaymentProvider = () => (process.env.PAYMENT_PROVIDER || "mock").toLowerCase();
const isStripeProvider = () => getPaymentProvider() === "stripe";

const getPlans = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    plans: subscriptionService.listPlans(),
  });
});

const getMySubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.getCurrentSubscription(req.user.id);

  res.status(200).json({
    success: true,
    subscription,
  });
});

const getMySubscriptionHistory = asyncHandler(async (req, res) => {
  const subscriptions = await subscriptionModel.getSubscriptionsByUserId(req.user.id);
  const payments = await paymentModel.getPaymentsByUserId(req.user.id);

  res.status(200).json({
    success: true,
    subscriptions,
    payments,
  });
});

const createCheckoutSession = asyncHandler(async (req, res) => {
  if (!isStripeProvider()) {
    throw new ApiError(400, "Stripe checkout is disabled. Set PAYMENT_PROVIDER=stripe to enable it.");
  }

  if (!stripeService.isStripeConfigured()) {
    throw new ApiError(503, "Stripe is not fully configured on the server.");
  }

  const { planType } = req.body;
  const selectedPlan = subscriptionService.getPlan(planType);
  const priceId = stripeService.getPriceIdForPlan(planType);
  const currentSubscription = await subscriptionService.getCurrentSubscription(req.user.id);

  if (!selectedPlan || !priceId) {
    throw new ApiError(400, "A valid Stripe-enabled plan type is required.");
  }

  if (
    currentSubscription &&
    currentSubscription.provider === "stripe" &&
    currentSubscription.status === "active" &&
    currentSubscription.endsAt &&
    new Date(currentSubscription.endsAt) > new Date()
  ) {
    throw new ApiError(
      409,
      "An active Stripe subscription already exists. Use the billing portal to change or cancel your plan."
    );
  }

  const stripe = stripeService.getStripeClient();
  const sessionPayload = {
    mode: "subscription",
    success_url: stripeService.getSuccessUrl(),
    cancel_url: stripeService.getCancelUrl(),
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    client_reference_id: String(req.user.id),
    metadata: {
      userId: String(req.user.id),
      planType: selectedPlan.type,
    },
    subscription_data: {
      metadata: {
        userId: String(req.user.id),
        planType: selectedPlan.type,
      },
    },
  };

  if (req.user.stripe_customer_id) {
    sessionPayload.customer = req.user.stripe_customer_id;
  } else {
    sessionPayload.customer_email = req.user.email;
  }

  const session = await stripe.checkout.sessions.create(sessionPayload);

  res.status(200).json({
    success: true,
    url: session.url,
    sessionId: session.id,
  });
});

const createBillingPortalSession = asyncHandler(async (req, res) => {
  if (!isStripeProvider()) {
    throw new ApiError(400, "Billing portal is only available for Stripe payment provider.");
  }

  if (!stripeService.isStripeConfigured()) {
    throw new ApiError(503, "Stripe is not fully configured on the server.");
  }

  if (!req.user.stripe_customer_id) {
    throw new ApiError(400, "No Stripe customer is linked to this account yet.");
  }

  const stripe = stripeService.getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: req.user.stripe_customer_id,
    return_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard`,
  });

  res.status(200).json({
    success: true,
    url: session.url,
  });
});

const upsertStripeSubscriptionRecord = async (stripeSubscription) => {
  const snapshot = stripeService.buildSubscriptionSnapshot(stripeSubscription);
  const metadataUserId = Number.parseInt(
    stripeSubscription.metadata?.userId || stripeSubscription.client_reference_id || "0",
    10
  );
  const existingSubscription = await subscriptionModel.findSubscriptionByProviderSubscriptionId(
    stripeSubscription.id
  );
  const userId = metadataUserId || existingSubscription?.userId || 0;

  if (!userId) {
    return null;
  }

  await userModel.updateStripeCustomerId({
    userId,
    stripeCustomerId: String(stripeSubscription.customer),
  });

  return subscriptionModel.upsertStripeSubscription({
    userId,
    ...snapshot,
  });
};

const handleStripeWebhook = async (req, res) => {
  if (!stripeService.isStripeConfigured()) {
    return res.status(503).json({
      success: false,
      message: "Stripe is not fully configured on the server.",
    });
  }

  const stripe = stripeService.getStripeClient();
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).json({
      success: false,
      message: "Stripe signature is missing.",
    });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: `Webhook Error: ${error.message}`,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        if (session.mode === "subscription" && session.subscription) {
          const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
          const localSubscription = await upsertStripeSubscriptionRecord({
            ...stripeSubscription,
            metadata: {
              ...stripeSubscription.metadata,
              userId: session.client_reference_id || stripeSubscription.metadata?.userId,
            },
          });

          if (localSubscription) {
            await paymentModel.createPaymentTransaction({
              userId: localSubscription.userId,
              subscriptionId: localSubscription.id,
              transactionType: "subscription_activation",
              provider: "stripe",
              status: "completed",
              amount: (session.amount_total || 0) / 100,
              currency: (session.currency || "usd").toUpperCase(),
              reference: `stripe_checkout_${session.id}`,
              metadata: {
                checkoutSessionId: session.id,
                stripeSubscriptionId: session.subscription,
              },
            });
          }
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const stripeSubscription = event.data.object;
        await upsertStripeSubscriptionRecord(stripeSubscription);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        let localSubscription = null;

        if (invoice.subscription) {
          const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription);
          localSubscription = await upsertStripeSubscriptionRecord(stripeSubscription);
        }

        if (localSubscription) {
          await paymentModel.createPaymentTransaction({
            userId: localSubscription.userId,
            subscriptionId: localSubscription.id,
            transactionType:
              event.type === "invoice.paid" ? "subscription_renewal" : "subscription_payment_failed",
            provider: "stripe",
            status: event.type === "invoice.paid" ? "completed" : "failed",
            amount: (invoice.amount_paid || invoice.amount_due || 0) / 100,
            currency: (invoice.currency || "usd").toUpperCase(),
            reference: `stripe_invoice_${invoice.id}`,
            metadata: {
              invoiceId: invoice.id,
              subscriptionId: invoice.subscription,
              hostedInvoiceUrl: invoice.hosted_invoice_url || null,
            },
          });
        }
        break;
      }
      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process Stripe webhook.",
    });
  }
};

const activateMySubscription = asyncHandler(async (req, res) => {
  if (isStripeProvider()) {
    throw new ApiError(400, "Direct activation is disabled for Stripe. Use checkout session instead.");
  }

  const { planType } = req.body;
  const selectedPlan = subscriptionService.getPlan(planType);

  if (!selectedPlan) {
    throw new ApiError(400, "Plan type must be either 'monthly' or 'yearly'.");
  }

  const currentSubscription = await subscriptionService.getCurrentSubscription(req.user.id);
  const now = new Date();

  let subscription;
  let payment;

  if (
    currentSubscription &&
    currentSubscription.status === "active" &&
    currentSubscription.planType === selectedPlan.type &&
    currentSubscription.endsAt &&
    new Date(currentSubscription.endsAt) > now
  ) {
    const endDate = subscriptionService.calculateEndDate(
      new Date(currentSubscription.endsAt),
      selectedPlan.durationDays
    );

    subscription = await subscriptionModel.extendSubscriptionById({
      subscriptionId: currentSubscription.id,
      endsAt: endDate.toISOString(),
    });
  } else {
    await subscriptionModel.deactivateActiveSubscriptions(req.user.id);

    const startDate = now;
    const endDate = subscriptionService.calculateEndDate(startDate, selectedPlan.durationDays);

    subscription = await subscriptionModel.activateSubscription({
      userId: req.user.id,
      planType: selectedPlan.type,
      startsAt: startDate.toISOString(),
      endsAt: endDate.toISOString(),
    });
  }

  payment = await paymentModel.createPaymentTransaction({
    userId: req.user.id,
    subscriptionId: subscription.id,
    transactionType:
      currentSubscription &&
      currentSubscription.status === "active" &&
      currentSubscription.planType === selectedPlan.type
        ? "subscription_renewal"
        : "subscription_activation",
    amount: selectedPlan.price,
    reference: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    metadata: {
      planType: selectedPlan.type,
      interval: selectedPlan.interval,
    },
  });

  res.status(201).json({
    success: true,
    message:
      currentSubscription &&
      currentSubscription.status === "active" &&
      currentSubscription.planType === selectedPlan.type
        ? `${selectedPlan.name} renewed successfully.`
        : `${selectedPlan.name} activated successfully.`,
    subscription,
    payment,
  });
});

const deactivateMySubscription = asyncHandler(async (req, res) => {
  const currentSubscription = await subscriptionService.getCurrentSubscription(req.user.id);

  if (!currentSubscription) {
    throw new ApiError(404, "No subscription found for this user.");
  }

  if (isStripeProvider() && currentSubscription.provider === "stripe") {
    if (!stripeService.isStripeConfigured()) {
      throw new ApiError(503, "Stripe is not fully configured on the server.");
    }

    if (!currentSubscription.providerSubscriptionId) {
      throw new ApiError(400, "Stripe subscription ID is missing for this account.");
    }

    if (currentSubscription.cancellationScheduled) {
      return res.status(200).json({
        success: true,
        message: "Stripe subscription cancellation is already scheduled for period end.",
        subscription: currentSubscription,
      });
    }

    const stripe = stripeService.getStripeClient();
    const stripeSubscription = await stripe.subscriptions.update(
      currentSubscription.providerSubscriptionId,
      { cancel_at_period_end: true }
    );

    const snapshot = stripeService.buildSubscriptionSnapshot(stripeSubscription);
    const subscription = await subscriptionModel.upsertStripeSubscription({
      userId: req.user.id,
      ...snapshot,
    });

    return res.status(200).json({
      success: true,
      message: "Stripe subscription cancellation is scheduled for period end.",
      subscription,
    });
  }

  const subscription = await subscriptionModel.deactivateSubscription(req.user.id);

  if (!subscription) {
    throw new ApiError(404, "No subscription found for this user.");
  }

  res.status(200).json({
    success: true,
    message: "Subscription deactivated successfully.",
    subscription,
  });
});

module.exports = {
  getPlans,
  getMySubscription,
  getMySubscriptionHistory,
  activateMySubscription,
  deactivateMySubscription,
  createCheckoutSession,
  createBillingPortalSession,
  handleStripeWebhook,
};
