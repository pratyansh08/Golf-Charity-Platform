const userModel = require("../models/userModel");
const scoreModel = require("../models/scoreModel");
const charityModel = require("../models/charityModel");
const winnerModel = require("../models/winnerModel");
const drawModel = require("../models/drawModel");
const subscriptionModel = require("../models/subscriptionModel");
const paymentModel = require("../models/paymentModel");
const donationModel = require("../models/donationModel");
const drawService = require("../services/drawService");
const subscriptionService = require("../services/subscriptionService");
const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");

const sanitizeAdminUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.is_active,
  selectedCharityId: user.selected_charity_id,
  selectedCharityName: user.selected_charity_name,
  contributionPercentage: user.contribution_percentage,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

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

const parsePositiveInteger = (value, label) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, `${label} must be a positive integer.`);
  }

  return parsed;
};

const parseDrawNumbers = (value) => {
  if (!value) {
    return null;
  }

  if (!Array.isArray(value)) {
    throw new ApiError(400, "Draw numbers must be an array of integers.");
  }

  const numbers = value.map((entry) => Number.parseInt(entry, 10));
  const uniqueNumbers = new Set(numbers);

  if (
    numbers.length !== 5 ||
    uniqueNumbers.size !== 5 ||
    numbers.some((number) => !Number.isInteger(number) || number < 1 || number > 45)
  ) {
    throw new ApiError(400, "Draw numbers must contain 5 unique integers between 1 and 45.");
  }

  return numbers;
};

const normalizeCharityPayload = ({ name, description }) => {
  if (typeof name !== "string" || !name.trim()) {
    throw new ApiError(400, "Charity name is required.");
  }

  return {
    name: name.trim(),
    description: typeof description === "string" ? description.trim() : null,
  };
};

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userModel.getAllUsers();

  res.status(200).json({
    success: true,
    users: users.map(sanitizeAdminUser),
  });
});

const getAllScores = asyncHandler(async (req, res) => {
  const scores = await scoreModel.getAllScores();

  res.status(200).json({
    success: true,
    scores,
  });
});

const getAllSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await subscriptionModel.getAllSubscriptions();
  const payments = await paymentModel.getAllPayments();

  res.status(200).json({
    success: true,
    subscriptions,
    payments,
  });
});

const suspendSubscription = asyncHandler(async (req, res) => {
  const subscriptionId = parsePositiveInteger(req.params.subscriptionId, "Subscription ID");
  const subscription = await subscriptionModel.findSubscriptionById(subscriptionId);

  if (!subscription) {
    throw new ApiError(404, "Subscription not found.");
  }

  if (subscription.status !== "active") {
    throw new ApiError(400, "Only active subscriptions can be suspended.");
  }

  const updatedSubscription = await subscriptionModel.adminSuspendSubscriptionById(subscriptionId);

  res.status(200).json({
    success: true,
    message: "Subscription suspended successfully.",
    subscription: updatedSubscription,
  });
});

const reactivateSubscription = asyncHandler(async (req, res) => {
  const subscriptionId = parsePositiveInteger(req.params.subscriptionId, "Subscription ID");
  const subscription = await subscriptionModel.findSubscriptionById(subscriptionId);

  if (!subscription) {
    throw new ApiError(404, "Subscription not found.");
  }

  if (subscription.status === "active") {
    throw new ApiError(400, "This subscription is already active.");
  }

  const selectedPlan = subscriptionService.getPlan(subscription.planType);

  if (!selectedPlan) {
    throw new ApiError(500, "Unable to resolve subscription plan.");
  }

  await subscriptionModel.deactivateActiveSubscriptions(subscription.userId);

  const startsAt = new Date();
  const endsAt = subscriptionService.calculateEndDate(startsAt, selectedPlan.durationDays);
  const updatedSubscription = await subscriptionModel.adminReactivateSubscriptionById({
    subscriptionId,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  });

  res.status(200).json({
    success: true,
    message: "Subscription reactivated successfully.",
    subscription: updatedSubscription,
  });
});

const updateScore = asyncHandler(async (req, res) => {
  const scoreId = parsePositiveInteger(req.params.scoreId, "Score ID");
  const { value, date } = req.body;

  if (!Number.isInteger(value) || value < 1 || value > 45) {
    throw new ApiError(400, "Score value must be an integer between 1 and 45.");
  }

  if (!isValidDateString(date)) {
    throw new ApiError(400, "Date must be provided in YYYY-MM-DD format.");
  }

  const existingScore = await scoreModel.findScoreById(scoreId);

  if (!existingScore) {
    throw new ApiError(404, "Score not found.");
  }

  const score = await scoreModel.updateScoreById({
    scoreId,
    value,
    date: date.trim(),
  });

  res.status(200).json({
    success: true,
    message: "Score updated successfully.",
    score,
  });
});

const runDraw = asyncHandler(async (req, res) => {
  const { drawPeriod, drawNumbers } = req.body;

  if (drawPeriod && !isValidDateString(drawPeriod)) {
    throw new ApiError(400, "Draw period must be provided in YYYY-MM-DD format.");
  }

  const result = await drawService.runDraw(req.user.id, {
    drawPeriod: drawPeriod || undefined,
    drawNumbers: parseDrawNumbers(drawNumbers),
  });

  res.status(201).json({
    success: true,
    message: "Draw simulation completed successfully. Publish it when you are ready.",
    draw: result.draw,
    winners: result.winners,
  });
});

const simulateDraw = asyncHandler(async (req, res) => {
  const { drawPeriod, drawNumbers } = req.body;

  if (drawPeriod && !isValidDateString(drawPeriod)) {
    throw new ApiError(400, "Draw period must be provided in YYYY-MM-DD format.");
  }

  const result = await drawService.simulateDraw({
    drawPeriod: drawPeriod || undefined,
    drawNumbers: parseDrawNumbers(drawNumbers),
  });

  res.status(200).json({
    success: true,
    message: "Draw simulation completed.",
    draw: result.draw,
    winners: result.winners,
  });
});

const publishDraw = asyncHandler(async (req, res) => {
  const drawId = parsePositiveInteger(req.params.drawId, "Draw ID");
  const draw = await drawModel.getDrawById(drawId);

  if (!draw) {
    throw new ApiError(404, "Draw not found.");
  }

  if (draw.status === "published") {
    throw new ApiError(400, "This draw has already been published.");
  }

  const existingPublishedDraw = await drawModel.getPublishedDrawByPeriod(draw.drawPeriod);

  if (existingPublishedDraw) {
    throw new ApiError(409, "A published draw already exists for this draw period.");
  }

  const publishedDraw = await drawModel.publishDrawById({
    drawId,
    publishedBy: req.user.id,
  });

  if (!publishedDraw) {
    throw new ApiError(409, "Unable to publish draw. Another draw may already be published for this period.");
  }

  res.status(200).json({
    success: true,
    message: "Draw published successfully.",
    draw: publishedDraw,
  });
});

const getAllDraws = asyncHandler(async (req, res) => {
  const draws = await drawModel.getAllDraws();

  res.status(200).json({
    success: true,
    draws,
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
  const winnerId = parsePositiveInteger(req.params.winnerId, "Winner ID");
  const { action, adminNote } = req.body;

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

  const updatedWinner = await winnerModel.reviewWinner({
    winnerId,
    status: action === "approve" ? "approved" : action === "pay" ? "paid" : "rejected",
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

const getAllCharities = asyncHandler(async (req, res) => {
  const charities = await charityModel.getAllCharities();

  res.status(200).json({
    success: true,
    charities,
  });
});

const getAnalyticsSummary = asyncHandler(async (req, res) => {
  const [
    { rows: userRows },
    { rows: drawRows },
    { rows: donationRows },
    { rows: paymentRows },
    { rows: subscriptionMixRows },
    { rows: winnerStatusRows },
    { rows: topCharityRows },
    { rows: monthlyTrendRows },
  ] = await Promise.all([
      query(`
        SELECT
          COUNT(*) AS total_users,
          COUNT(*) FILTER (WHERE role = 'admin') AS total_admins,
          COUNT(*) FILTER (WHERE role = 'user') AS total_members
        FROM users
      `),
      query(`
        SELECT
          COUNT(*) AS total_draws,
          COUNT(*) FILTER (WHERE status = 'draft') AS total_draft_draws,
          COUNT(*) FILTER (WHERE status = 'published') AS total_published_draws,
          COALESCE(SUM(prize_pool_amount), 0) AS total_prize_pool,
          COALESCE(SUM(charity_contribution_amount), 0) AS total_charity_contribution,
          COALESCE(SUM(rollover_out_amount), 0) AS total_rollover_reserved
        FROM draw_results
      `),
      query(`
        SELECT
          COUNT(*) AS total_donations,
          COALESCE(SUM(amount), 0) AS total_donation_amount
        FROM donations
      `),
      query(`
        SELECT
          COUNT(*) AS total_payments,
          COALESCE(SUM(amount), 0) AS total_payment_volume
        FROM payment_transactions
        WHERE status = 'completed'
      `),
      query(`
        SELECT
          plan_type,
          COUNT(*) AS total_count,
          COUNT(*) FILTER (WHERE status = 'active') AS active_count
        FROM subscriptions
        GROUP BY plan_type
        ORDER BY plan_type ASC
      `),
      query(`
        SELECT
          status,
          COUNT(*) AS total_count
        FROM draw_winners
        GROUP BY status
        ORDER BY status ASC
      `),
      query(`
        SELECT
          c.id,
          c.name,
          COALESCE(SUM(d.amount), 0) AS donation_total
        FROM charities c
        LEFT JOIN donations d ON d.charity_id = c.id
        GROUP BY c.id, c.name
        ORDER BY donation_total DESC, c.name ASC
        LIMIT 5
      `),
      query(`
        WITH month_series AS (
          SELECT DATE_TRUNC('month', NOW()) - (INTERVAL '1 month' * generate_series(0, 5)) AS month_start
        )
        SELECT
          TO_CHAR(month_series.month_start, 'YYYY-MM') AS month,
          COALESCE(SUM(CASE WHEN dr.status = 'published' THEN dr.prize_pool_amount ELSE 0 END), 0) AS prize_pool_total,
          COALESCE(SUM(CASE WHEN dr.status = 'published' THEN dr.charity_contribution_amount ELSE 0 END), 0) AS charity_total,
          COALESCE(SUM(CASE WHEN dr.status = 'published' THEN dr.total_winners ELSE 0 END), 0) AS winner_total
        FROM month_series
        LEFT JOIN draw_results dr
          ON DATE_TRUNC('month', dr.draw_period::timestamp) = month_series.month_start
        GROUP BY month_series.month_start
        ORDER BY month_series.month_start ASC
      `),
    ]);

  res.status(200).json({
    success: true,
    analytics: {
      totalUsers: Number(userRows[0].total_users),
      totalAdmins: Number(userRows[0].total_admins),
      totalMembers: Number(userRows[0].total_members),
      totalDraws: Number(drawRows[0].total_draws),
      totalDraftDraws: Number(drawRows[0].total_draft_draws),
      totalPublishedDraws: Number(drawRows[0].total_published_draws),
      totalPrizePool: Number(drawRows[0].total_prize_pool),
      totalCharityContribution: Number(drawRows[0].total_charity_contribution),
      totalRolloverReserved: Number(drawRows[0].total_rollover_reserved),
      totalDonations: Number(donationRows[0].total_donations),
      totalDonationAmount: Number(donationRows[0].total_donation_amount),
      totalPayments: Number(paymentRows[0].total_payments),
      totalPaymentVolume: Number(paymentRows[0].total_payment_volume),
      subscriptionMix: subscriptionMixRows.map((row) => ({
        planType: row.plan_type,
        totalCount: Number(row.total_count),
        activeCount: Number(row.active_count),
      })),
      winnerStatusMix: winnerStatusRows.map((row) => ({
        status: row.status,
        totalCount: Number(row.total_count),
      })),
      topCharitiesByDonation: topCharityRows.map((row) => ({
        charityId: Number(row.id),
        charityName: row.name,
        donationTotal: Number(row.donation_total),
      })),
      monthlyTrend: monthlyTrendRows.map((row) => ({
        month: row.month,
        prizePoolTotal: Number(row.prize_pool_total),
        charityTotal: Number(row.charity_total),
        winnerTotal: Number(row.winner_total),
      })),
    },
  });
});

const getAllDonations = asyncHandler(async (req, res) => {
  const donations = await donationModel.getAllDonations();

  res.status(200).json({
    success: true,
    donations,
  });
});

const createCharity = asyncHandler(async (req, res) => {
  const payload = normalizeCharityPayload(req.body);
  const charity = await charityModel.createCharity(payload);

  res.status(201).json({
    success: true,
    message: "Charity created successfully.",
    charity,
  });
});

const updateCharity = asyncHandler(async (req, res) => {
  const charityId = parsePositiveInteger(req.params.charityId, "Charity ID");
  const existingCharity = await charityModel.findCharityById(charityId);

  if (!existingCharity) {
    throw new ApiError(404, "Charity not found.");
  }

  const payload = normalizeCharityPayload(req.body);
  const charity = await charityModel.updateCharityById({
    charityId,
    ...payload,
  });

  res.status(200).json({
    success: true,
    message: "Charity updated successfully.",
    charity,
  });
});

const deleteCharity = asyncHandler(async (req, res) => {
  const charityId = parsePositiveInteger(req.params.charityId, "Charity ID");
  const deletedCharity = await charityModel.deleteCharityById(charityId);

  if (!deletedCharity) {
    throw new ApiError(404, "Charity not found.");
  }

  res.status(200).json({
    success: true,
    message: "Charity deleted successfully.",
    charity: deletedCharity,
  });
});

module.exports = {
  getAllUsers,
  getAllScores,
  getAllSubscriptions,
  suspendSubscription,
  reactivateSubscription,
  updateScore,
  runDraw,
  simulateDraw,
  publishDraw,
  getAllDraws,
  getAllWinners,
  reviewWinner,
  getAllCharities,
  getAnalyticsSummary,
  getAllDonations,
  createCharity,
  updateCharity,
  deleteCharity,
};
