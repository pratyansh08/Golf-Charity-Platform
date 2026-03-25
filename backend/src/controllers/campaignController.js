const campaignModel = require("../models/campaignModel");
const asyncHandler = require("../utils/asyncHandler");

const getCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await campaignModel.getAllCampaigns();
  res.status(200).json({
    success: true,
    data: campaigns,
  });
});

const getAdminCampaignSummary = asyncHandler(async (req, res) => {
  const campaigns = await campaignModel.getAllCampaigns();
  res.status(200).json({
    success: true,
    message: "Admin-only campaign summary loaded successfully.",
    totalCampaigns: campaigns.length,
    requestedBy: {
      id: req.user.id,
      role: req.user.role,
    },
  });
});

module.exports = {
  getCampaigns,
  getAdminCampaignSummary,
};
