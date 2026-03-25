const subscriptionModel = require("../models/subscriptionModel");

const PLANS = {
  monthly: {
    type: "monthly",
    name: "Monthly Plan",
    interval: "month",
    price: 9.99,
    durationDays: 30,
  },
  yearly: {
    type: "yearly",
    name: "Yearly Plan",
    interval: "year",
    price: 99.99,
    durationDays: 365,
  },
};

const listPlans = () => Object.values(PLANS);

const getPlan = (planType) => PLANS[planType] || null;

const calculateEndDate = (startDate, durationDays) => {
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + durationDays);
  return endDate;
};

const getCurrentSubscription = async (userId) => {
  return subscriptionModel.getLatestSubscriptionByUserId(userId);
};

module.exports = {
  listPlans,
  getPlan,
  calculateEndDate,
  getCurrentSubscription,
};
