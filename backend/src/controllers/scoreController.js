const scoreModel = require("../models/scoreModel");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");

const isValidDateString = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return false;
  }

  const parsed = new Date(`${trimmed}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime());
};

const addScore = asyncHandler(async (req, res) => {
  const { value, date } = req.body;

  if (!Number.isInteger(value) || value < 1 || value > 45) {
    throw new ApiError(400, "Score value must be an integer between 1 and 45.");
  }

  if (!isValidDateString(date)) {
    throw new ApiError(400, "Date must be provided in YYYY-MM-DD format.");
  }

  const scores = await scoreModel.addScoreForUser({
    userId: req.user.id,
    value,
    date: date.trim(),
  });

  res.status(201).json({
    success: true,
    message: "Score saved successfully.",
    scores,
  });
});

const getUserScores = asyncHandler(async (req, res) => {
  const scores = await scoreModel.getScoresByUserId(req.user.id);

  res.status(200).json({
    success: true,
    scores,
  });
});

module.exports = {
  addScore,
  getUserScores,
};
