const express = require("express");
const {
  getCampaigns,
  getAdminCampaignSummary,
} = require("../controllers/campaignController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getCampaigns);
router.get("/admin-summary", protect, authorize("admin"), getAdminCampaignSummary);

module.exports = router;
