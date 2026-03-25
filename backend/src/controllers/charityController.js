const charityModel = require("../models/charityModel");
const donationModel = require("../models/donationModel");
const paymentModel = require("../models/paymentModel");
const userModel = require("../models/userModel");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");

const getCharities = asyncHandler(async (req, res) => {
  const charities = await charityModel.getAllCharities();

  res.status(200).json({
    success: true,
    charities,
  });
});

const getCharityDetails = asyncHandler(async (req, res) => {
  const charityId = Number.parseInt(req.params.charityId, 10);

  if (!Number.isInteger(charityId) || charityId <= 0) {
    throw new ApiError(400, "Charity ID must be a positive integer.");
  }

  const charity = await charityModel.getCharityDetailsById(charityId);

  if (!charity) {
    throw new ApiError(404, "Charity not found.");
  }

  res.status(200).json({
    success: true,
    charity,
  });
});

const getMyDonations = asyncHandler(async (req, res) => {
  const donations = await donationModel.getDonationsByUserId(req.user.id);

  res.status(200).json({
    success: true,
    donations,
  });
});

const selectCharity = asyncHandler(async (req, res) => {
  const { charityId, contributionPercentage } = req.body;

  if (!Number.isInteger(charityId) || charityId <= 0) {
    throw new ApiError(400, "Charity ID must be a positive integer.");
  }

  if (
    typeof contributionPercentage !== "number" ||
    Number.isNaN(contributionPercentage) ||
    contributionPercentage < 10 ||
    contributionPercentage > 100
  ) {
    throw new ApiError(400, "Contribution percentage must be between 10 and 100.");
  }

  const charity = await charityModel.findCharityById(charityId);

  if (!charity) {
    throw new ApiError(404, "Selected charity was not found.");
  }

  const updatedUser = await userModel.updateUserCharitySelection({
    userId: req.user.id,
    charityId,
    contributionPercentage,
  });

  res.status(200).json({
    success: true,
    message: "Charity selection saved successfully.",
    charity,
    user: {
      id: updatedUser.id,
      selectedCharityId: updatedUser.selected_charity_id,
      contributionPercentage: updatedUser.contribution_percentage,
    },
  });
});

const createDonation = asyncHandler(async (req, res) => {
  const charityId = Number.parseInt(req.params.charityId, 10);
  const { amount, message } = req.body;

  if (!Number.isInteger(charityId) || charityId <= 0) {
    throw new ApiError(400, "Charity ID must be a positive integer.");
  }

  if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
    throw new ApiError(400, "Donation amount must be greater than 0.");
  }

  const charity = await charityModel.findCharityById(charityId);

  if (!charity) {
    throw new ApiError(404, "Charity not found.");
  }

  const reference = `donation_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const donation = await donationModel.createDonation({
    userId: req.user.id,
    charityId,
    amount,
    message: typeof message === "string" ? message.trim() : null,
    reference,
  });

  await paymentModel.createPaymentTransaction({
    userId: req.user.id,
    transactionType: "donation",
    amount,
    reference,
    metadata: {
      charityId,
      charityName: charity.name,
      message: donation.message,
    },
  });

  res.status(201).json({
    success: true,
    message: "Donation recorded successfully.",
    donation,
  });
});

module.exports = {
  getCharities,
  getCharityDetails,
  getMyDonations,
  selectCharity,
  createDonation,
};
