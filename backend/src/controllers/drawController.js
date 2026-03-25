const drawModel = require("../models/drawModel");
const drawService = require("../services/drawService");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");

const triggerDraw = asyncHandler(async (req, res) => {
  const result = await drawService.runDraw(req.user.id);

  res.status(201).json({
    success: true,
    message: "Draw completed successfully.",
    draw: result.draw,
    winners: result.winners,
  });
});

const getDraws = asyncHandler(async (req, res) => {
  const draws = req.user.role === "admin" ? await drawModel.getAllDraws() : await drawModel.getPublishedDraws();

  res.status(200).json({
    success: true,
    draws,
  });
});

const getDrawById = asyncHandler(async (req, res) => {
  const drawId = Number.parseInt(req.params.drawId, 10);

  if (!Number.isInteger(drawId) || drawId <= 0) {
    throw new ApiError(400, "Draw ID must be a positive integer.");
  }

  const draw = await drawModel.getDrawById(drawId);

  if (!draw) {
    throw new ApiError(404, "Draw not found.");
  }

  if (req.user.role !== "admin" && draw.status !== "published") {
    throw new ApiError(404, "Draw not found.");
  }

  const winners = await drawModel.getWinnersByDrawId(drawId);

  res.status(200).json({
    success: true,
    draw,
    winners,
  });
});

module.exports = {
  triggerDraw,
  getDraws,
  getDrawById,
};
