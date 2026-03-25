const express = require("express");
const authRoutes = require("./authRoutes");
const healthRoutes = require("./healthRoutes");
const campaignRoutes = require("./campaignRoutes");
const scoreRoutes = require("./scoreRoutes");
const subscriptionRoutes = require("./subscriptionRoutes");
const charityRoutes = require("./charityRoutes");
const drawRoutes = require("./drawRoutes");
const winnerRoutes = require("./winnerRoutes");
const adminRoutes = require("./adminRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/health", healthRoutes);
router.use("/charities", charityRoutes);
router.use("/draws", drawRoutes);
router.use("/winners", winnerRoutes);
router.use("/campaigns", campaignRoutes);
router.use("/scores", scoreRoutes);
router.use("/subscriptions", subscriptionRoutes);

module.exports = router;
