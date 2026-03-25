const winnerModel = require("../models/winnerModel");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");

const isValidHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
};

const getMyWinners = asyncHandler(async (req, res) => {
  const winners = await winnerModel.getWinnersByUserId(req.user.id);

  res.status(200).json({
    success: true,
    winners,
  });
});

const uploadProof = asyncHandler(async (req, res) => {
  const winnerId = Number.parseInt(req.params.winnerId, 10);
  const { proofImageUrl } = req.body;

  if (!Number.isInteger(winnerId) || winnerId <= 0) {
    throw new ApiError(400, "Winner ID must be a positive integer.");
  }

  if (!proofImageUrl || !isValidHttpUrl(proofImageUrl)) {
    throw new ApiError(400, "A valid proofImageUrl is required.");
  }

  const winner = await winnerModel.findWinnerById(winnerId);

  if (!winner) {
    throw new ApiError(404, "Winner record not found.");
  }

  if (winner.userId !== req.user.id) {
    throw new ApiError(403, "You can only upload proof for your own winner record.");
  }

  if (winner.status === "paid") {
    throw new ApiError(400, "This winner has already been paid.");
  }

  const updatedWinner = await winnerModel.uploadWinnerProof({
    winnerId,
    userId: req.user.id,
    proofImageUrl,
  });

  res.status(200).json({
    success: true,
    message: "Proof uploaded successfully.",
    winner: updatedWinner,
  });
});

const getAllWinners = asyncHandler(async (req, res) => {
  const winners = await winnerModel.getAllWinners();

  res.status(200).json({
    success: true,
    winners,
  });
});

const reviewWinner = asyncHandler(async (req, res) => {
  const winnerId = Number.parseInt(req.params.winnerId, 10);
  const { action, adminNote } = req.body;

  if (!Number.isInteger(winnerId) || winnerId <= 0) {
    throw new ApiError(400, "Winner ID must be a positive integer.");
  }

  if (!["approve", "reject", "pay"].includes(action)) {
    throw new ApiError(400, "Action must be 'approve', 'reject', or 'pay'.");
  }

  const winner = await winnerModel.findWinnerById(winnerId);

  if (!winner) {
    throw new ApiError(404, "Winner record not found.");
  }

  if (!winner.proofImageUrl) {
    throw new ApiError(400, "Winner proof must be uploaded before review.");
  }

  if (["pending", "approved"].indexOf(winner.status) === -1) {
    throw new ApiError(400, "Only pending or approved winner records can be reviewed.");
  }

  if (action === "approve" && winner.status !== "pending") {
    throw new ApiError(400, "Only pending winner records can be approved.");
  }

  if (action === "reject" && winner.status !== "pending") {
    throw new ApiError(400, "Only pending winner records can be rejected.");
  }

  if (action === "pay" && winner.status !== "approved") {
    throw new ApiError(400, "Only approved winner records can be marked as paid.");
  }

  const nextStatus =
    action === "approve" ? "approved" : action === "pay" ? "paid" : "rejected";

  const updatedWinner = await winnerModel.reviewWinner({
    winnerId,
    status: nextStatus,
    adminNote: adminNote || null,
    reviewedBy: req.user.id,
  });

  res.status(200).json({
    success: true,
    message:
      action === "approve"
        ? "Winner approved successfully."
        : action === "pay"
          ? "Winner marked as paid."
          : "Winner rejected.",
    winner: updatedWinner,
  });
});

module.exports = {
  getMyWinners,
  uploadProof,
  getAllWinners,
  reviewWinner,
};
