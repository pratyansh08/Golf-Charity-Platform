const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");
const subscriptionModel = require("../models/subscriptionModel");

const requireActiveSubscription = asyncHandler(async (req, res, next) => {
  const subscription = await subscriptionModel.getLatestSubscriptionByUserId(req.user.id);

  if (!subscription || subscription.status !== "active") {
    throw new ApiError(403, "An active subscription is required to access this resource.");
  }

  if (subscription.endsAt && new Date(subscription.endsAt) < new Date()) {
    throw new ApiError(403, "Your subscription has expired. Please reactivate your plan.");
  }

  req.subscription = subscription;
  next();
});

module.exports = {
  requireActiveSubscription,
};
