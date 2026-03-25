const campaignModel = require("../models/campaignModel");

const listCampaigns = async () => {
  return campaignModel.getAllCampaigns();
};

module.exports = {
  listCampaigns,
};
