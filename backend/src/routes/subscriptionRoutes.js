const express = require("express");
const {
  getPlans,
  getMySubscription,
  getMySubscriptionHistory,
  activateMySubscription,
  deactivateMySubscription,
  createCheckoutSession,
  createBillingPortalSession,
} = require("../controllers/subscriptionController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/plans", getPlans);
router.get("/me", protect, getMySubscription);
router.get("/history", protect, getMySubscriptionHistory);
router.post("/checkout-session", protect, createCheckoutSession);
router.post("/billing-portal", protect, createBillingPortalSession);
router.post("/activate", protect, activateMySubscription);
router.patch("/deactivate", protect, deactivateMySubscription);

module.exports = router;
