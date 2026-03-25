const drawModel = require("../models/drawModel");
const subscriptionService = require("./subscriptionService");

const DRAW_SIZE = 5;
const MIN_NUMBER = 1;
const MAX_NUMBER = 45;
const WINNING_MATCH_COUNTS = [5, 4, 3];
const PAYOUT_PERCENTAGES = {
  5: 0.4,
  4: 0.35,
  3: 0.25,
};

const generateRandomDrawNumbers = () => {
  const numberSet = new Set();

  while (numberSet.size < DRAW_SIZE) {
    const randomNumber = Math.floor(Math.random() * MAX_NUMBER) + MIN_NUMBER;
    numberSet.add(randomNumber);
  }

  return [...numberSet].sort((a, b) => a - b);
};

const calculateMatchedNumbers = (drawNumbers, scoreValues) => {
  const scoreSet = new Set(scoreValues);
  return drawNumbers.filter((number) => scoreSet.has(number));
};

const roundCurrency = (value) => Number(value.toFixed(2));

const getCurrentDrawPeriod = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
};

const normalizeDrawPeriod = (value) => {
  if (!value) {
    return getCurrentDrawPeriod();
  }

  const parsed = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1)).toISOString().slice(0, 10);
};

const validateDrawNumbers = (drawNumbers) => {
  if (!Array.isArray(drawNumbers) || drawNumbers.length !== DRAW_SIZE) {
    return false;
  }

  if (!drawNumbers.every((number) => Number.isInteger(number) && number >= MIN_NUMBER && number <= MAX_NUMBER)) {
    return false;
  }

  return new Set(drawNumbers).size === DRAW_SIZE;
};

const calculateDrawOutcome = async ({ drawNumbers }) => {
  const participants = await drawModel.getEligibleUserScores();

  if (!participants.length) {
    const error = new Error("No eligible subscribed users with scores are available for a draw.");
    error.statusCode = 400;
    throw error;
  }

  const rolloverInAmount = roundCurrency(await drawModel.getCurrentRolloverAmount());
  const totalSubscriptionRevenue = roundCurrency(
    participants.reduce((sum, participant) => {
      const plan = subscriptionService.getPlan(participant.planType);
      return sum + (plan ? plan.price : 0);
    }, 0)
  );
  const charityContributionAmount = roundCurrency(
    participants.reduce((sum, participant) => {
      const plan = subscriptionService.getPlan(participant.planType);
      const planPrice = plan ? plan.price : 0;
      const contributionPercentage = participant.contributionPercentage || 10;
      return sum + planPrice * (contributionPercentage / 100);
    }, 0)
  );
  const prizePoolAmount = roundCurrency(
    Math.max(totalSubscriptionRevenue - charityContributionAmount + rolloverInAmount, 0)
  );

  const winners = participants
    .map((participant) => {
      const matchedNumbers = calculateMatchedNumbers(drawNumbers, participant.scoreValues);
      return {
        userId: participant.userId,
        matchCount: matchedNumbers.length,
        matchedNumbers,
        prizeAmount: 0,
      };
    })
    .filter((participant) => WINNING_MATCH_COUNTS.includes(participant.matchCount));

  const winnersByMatchCount = {
    5: winners.filter((winner) => winner.matchCount === 5),
    4: winners.filter((winner) => winner.matchCount === 4),
    3: winners.filter((winner) => winner.matchCount === 3),
  };

  let rolloverOutAmount = 0;
  const payoutBreakdown = {};

  for (const matchCount of WINNING_MATCH_COUNTS) {
    const bucketAmount = roundCurrency(prizePoolAmount * PAYOUT_PERCENTAGES[matchCount]);
    const bucketWinners = winnersByMatchCount[matchCount];
    const splitAmount = bucketWinners.length ? roundCurrency(bucketAmount / bucketWinners.length) : 0;

    if (matchCount === 5 && !bucketWinners.length) {
      rolloverOutAmount = bucketAmount;
    }

    bucketWinners.forEach((winner) => {
      winner.prizeAmount = splitAmount;
    });

    payoutBreakdown[matchCount] = {
      percentage: PAYOUT_PERCENTAGES[matchCount],
      bucketAmount,
      winnerCount: bucketWinners.length,
      splitAmount,
      rolledOver: matchCount === 5 && !bucketWinners.length,
    };
  }

  return {
    participants,
    winners,
    totalSubscriptionRevenue,
    charityContributionAmount,
    prizePoolAmount,
    rolloverInAmount,
    rolloverOutAmount,
    payoutBreakdown,
  };
};

const runDraw = async (adminUserId, options = {}) => {
  const drawPeriod = normalizeDrawPeriod(options.drawPeriod);

  if (!drawPeriod) {
    const error = new Error("Draw period must be a valid date in YYYY-MM-DD format.");
    error.statusCode = 400;
    throw error;
  }

  const existingDraw = await drawModel.getLatestDrawByPeriod(drawPeriod);

  if (existingDraw) {
    const error = new Error("A draw already exists for the selected month.");
    error.statusCode = 409;
    throw error;
  }

  const drawNumbers = options.drawNumbers ? [...options.drawNumbers].sort((a, b) => a - b) : generateRandomDrawNumbers();

  if (!validateDrawNumbers(drawNumbers)) {
    const error = new Error("Draw numbers must be 5 unique integers between 1 and 45.");
    error.statusCode = 400;
    throw error;
  }

  const outcome = await calculateDrawOutcome({ drawNumbers });

  const draw = await drawModel.createDrawWithWinners({
    drawNumbers,
    triggeredBy: adminUserId,
    totalParticipants: outcome.participants.length,
    totalWinners: outcome.winners.length,
    totalSubscriptionRevenue: outcome.totalSubscriptionRevenue,
    prizePoolAmount: outcome.prizePoolAmount,
    charityContributionAmount: outcome.charityContributionAmount,
    rolloverInAmount: outcome.rolloverInAmount,
    rolloverOutAmount: outcome.rolloverOutAmount,
    payoutBreakdown: outcome.payoutBreakdown,
    winners: outcome.winners,
    drawPeriod,
  });

  const storedWinners = await drawModel.getWinnersByDrawId(draw.id);

  return {
    draw,
    winners: storedWinners,
  };
};

const simulateDraw = async (options = {}) => {
  const drawPeriod = normalizeDrawPeriod(options.drawPeriod);

  if (!drawPeriod) {
    const error = new Error("Draw period must be a valid date in YYYY-MM-DD format.");
    error.statusCode = 400;
    throw error;
  }

  const drawNumbers = options.drawNumbers ? [...options.drawNumbers].sort((a, b) => a - b) : generateRandomDrawNumbers();

  if (!validateDrawNumbers(drawNumbers)) {
    const error = new Error("Draw numbers must be 5 unique integers between 1 and 45.");
    error.statusCode = 400;
    throw error;
  }

  const outcome = await calculateDrawOutcome({ drawNumbers });
  return {
    draw: {
      id: null,
      drawNumbers,
      drawPeriod,
      status: "draft",
      triggeredBy: null,
      publishedBy: null,
      totalParticipants: outcome.participants.length,
      totalWinners: outcome.winners.length,
      totalSubscriptionRevenue: outcome.totalSubscriptionRevenue,
      prizePoolAmount: outcome.prizePoolAmount,
      charityContributionAmount: outcome.charityContributionAmount,
      rolloverInAmount: outcome.rolloverInAmount,
      rolloverOutAmount: outcome.rolloverOutAmount,
      payoutBreakdown: outcome.payoutBreakdown,
      executedAt: new Date().toISOString(),
      publishedAt: null,
    },
    winners: outcome.winners,
  };
};

const runMonthlyDrawIfDue = async () => {
  const runDay = Number.parseInt(process.env.DRAW_SCHEDULE_DAY_OF_MONTH || "1", 10);
  const now = new Date();
  const todayUtcDay = now.getUTCDate();
  const drawPeriod = getCurrentDrawPeriod();

  if (!Number.isInteger(runDay) || runDay < 1 || runDay > 28) {
    return {
      success: false,
      skipped: true,
      reason: "Invalid DRAW_SCHEDULE_DAY_OF_MONTH configuration.",
    };
  }

  if (todayUtcDay !== runDay) {
    return {
      success: false,
      skipped: true,
      reason: `Today is day ${todayUtcDay}, scheduled run day is ${runDay}.`,
    };
  }

  const existingDraw = await drawModel.getLatestDrawByPeriod(drawPeriod);

  if (existingDraw) {
    return {
      success: true,
      skipped: true,
      reason: "Draw already exists for this month.",
      draw: existingDraw,
    };
  }

  const result = await runDraw(null);
  return {
    success: true,
    skipped: false,
    reason: "Monthly draw generated.",
    ...result,
  };
};

module.exports = {
  runDraw,
  simulateDraw,
  runMonthlyDrawIfDue,
};
