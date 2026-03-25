const { pool, query } = require("../config/db");

const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

const mapDraw = (draw) => ({
  id: draw.id,
  drawNumbers: draw.draw_numbers,
  drawPeriod: draw.draw_period,
  status: draw.status,
  triggeredBy: draw.triggered_by,
  publishedBy: draw.published_by,
  totalParticipants: draw.total_participants,
  totalWinners: draw.total_winners,
  totalSubscriptionRevenue: toNumber(draw.total_subscription_revenue),
  prizePoolAmount: toNumber(draw.prize_pool_amount),
  charityContributionAmount: toNumber(draw.charity_contribution_amount),
  rolloverInAmount: toNumber(draw.rollover_in_amount),
  rolloverOutAmount: toNumber(draw.rollover_out_amount),
  payoutBreakdown: draw.payout_breakdown || {},
  executedAt: draw.executed_at,
  publishedAt: draw.published_at,
  createdAt: draw.created_at,
  updatedAt: draw.updated_at,
});

const mapWinner = (winner) => ({
  id: winner.id,
  drawResultId: winner.draw_result_id,
  userId: winner.user_id,
  matchCount: winner.match_count,
  matchedNumbers: winner.matched_numbers,
  proofImageUrl: winner.proof_image_url,
  status: winner.status,
  prizeAmount: toNumber(winner.prize_amount),
  adminNote: winner.admin_note,
  reviewedBy: winner.reviewed_by,
  reviewedAt: winner.reviewed_at,
  userName: winner.user_name,
  userEmail: winner.user_email,
  createdAt: winner.created_at,
});

const createDrawWithWinners = async ({
  drawNumbers,
  triggeredBy,
  totalParticipants,
  totalWinners,
  totalSubscriptionRevenue,
  prizePoolAmount,
  charityContributionAmount,
  rolloverInAmount,
  rolloverOutAmount,
  payoutBreakdown,
  winners,
  drawPeriod,
  status = "draft",
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const drawResult = await client.query(
      `
        INSERT INTO draw_results (
          draw_numbers,
          draw_period,
          status,
          triggered_by,
          executed_at,
          total_participants,
          total_winners,
          total_subscription_revenue,
          prize_pool_amount,
          charity_contribution_amount,
          rollover_in_amount,
          rollover_out_amount,
          payout_breakdown
        )
        VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `,
      [
        drawNumbers,
        drawPeriod,
        status,
        triggeredBy,
        totalParticipants,
        totalWinners,
        totalSubscriptionRevenue,
        prizePoolAmount,
        charityContributionAmount,
        rolloverInAmount,
        rolloverOutAmount,
        payoutBreakdown,
      ]
    );

    const draw = drawResult.rows[0];

    for (const winner of winners) {
      await client.query(
        `
          INSERT INTO draw_winners (draw_result_id, user_id, match_count, matched_numbers, prize_amount)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [draw.id, winner.userId, winner.matchCount, winner.matchedNumbers, winner.prizeAmount]
      );
    }

    await client.query("COMMIT");
    return mapDraw(draw);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getAllDraws = async () => {
  const { rows } = await query(
    `
      SELECT *
      FROM draw_results
      ORDER BY created_at DESC, id DESC
    `
  );

  return rows.map(mapDraw);
};

const getPublishedDraws = async () => {
  const { rows } = await query(
    `
      SELECT *
      FROM draw_results
      WHERE status = 'published'
      ORDER BY draw_period DESC, created_at DESC, id DESC
    `
  );

  return rows.map(mapDraw);
};

const getDrawById = async (drawId) => {
  const { rows } = await query(
    `
      SELECT *
      FROM draw_results
      WHERE id = $1
      LIMIT 1
    `,
    [drawId]
  );

  return rows[0] ? mapDraw(rows[0]) : null;
};

const getLatestDrawByPeriod = async (drawPeriod) => {
  const { rows } = await query(
    `
      SELECT *
      FROM draw_results
      WHERE draw_period = $1
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `,
    [drawPeriod]
  );

  return rows[0] ? mapDraw(rows[0]) : null;
};

const publishDrawById = async ({ drawId, publishedBy }) => {
  const { rows } = await query(
    `
      WITH candidate AS (
        SELECT id, draw_period
        FROM draw_results
        WHERE id = $1
          AND status <> 'published'
      )
      UPDATE draw_results dr
      SET status = 'published',
          published_at = NOW(),
          published_by = $2
      FROM candidate
      WHERE dr.id = candidate.id
        AND NOT EXISTS (
          SELECT 1
          FROM draw_results existing
          WHERE existing.draw_period = candidate.draw_period
            AND existing.status = 'published'
        )
      RETURNING dr.*
    `,
    [drawId, publishedBy]
  );

  return rows[0] ? mapDraw(rows[0]) : null;
};

const getPublishedDrawByPeriod = async (drawPeriod) => {
  const { rows } = await query(
    `
      SELECT *
      FROM draw_results
      WHERE draw_period = $1
        AND status = 'published'
      LIMIT 1
    `,
    [drawPeriod]
  );

  return rows[0] ? mapDraw(rows[0]) : null;
};

const getWinnersByDrawId = async (drawId) => {
  const { rows } = await query(
    `
      SELECT
        dw.id,
        dw.draw_result_id,
        dw.user_id,
        dw.match_count,
        dw.matched_numbers,
        dw.proof_image_url,
        dw.prize_amount,
        dw.status,
        dw.admin_note,
        dw.reviewed_by,
        dw.reviewed_at,
        dw.created_at,
        u.name AS user_name,
        u.email AS user_email
      FROM draw_winners dw
      INNER JOIN users u ON u.id = dw.user_id
      WHERE dw.draw_result_id = $1
      ORDER BY dw.match_count DESC, dw.created_at ASC
    `,
    [drawId]
  );

  return rows.map(mapWinner);
};

const getEligibleUserScores = async () => {
  const { rows } = await query(
    `
      WITH ranked_scores AS (
        SELECT
          s.id,
          s.user_id,
          s.value,
          s.score_date,
          s.created_at,
          ROW_NUMBER() OVER (
            PARTITION BY s.user_id
            ORDER BY s.score_date DESC, s.created_at DESC
          ) AS row_num
        FROM scores s
      )
      SELECT
        rs.user_id,
        ARRAY_AGG(rs.value ORDER BY rs.score_date DESC, rs.created_at DESC) AS score_values,
        sub.plan_type,
        COALESCE(u.contribution_percentage, 10) AS contribution_percentage,
        u.selected_charity_id
      FROM ranked_scores rs
      INNER JOIN subscriptions sub
        ON sub.user_id = rs.user_id
      INNER JOIN users u
        ON u.id = rs.user_id
      WHERE rs.row_num <= 5
        AND sub.id = (
          SELECT s2.id
          FROM subscriptions s2
          WHERE s2.user_id = rs.user_id
          ORDER BY s2.created_at DESC, s2.id DESC
          LIMIT 1
        )
        AND sub.status = 'active'
        AND sub.ends_at > NOW()
      GROUP BY rs.user_id
      HAVING COUNT(*) > 0
    `
  );

  return rows.map((row) => ({
    userId: row.user_id,
    scoreValues: row.score_values.map(Number),
    planType: row.plan_type,
    contributionPercentage: Number(row.contribution_percentage),
    selectedCharityId: row.selected_charity_id,
  }));
};

const getCurrentRolloverAmount = async () => {
  const { rows } = await query(
    `
      SELECT rollover_out_amount
      FROM draw_results
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `
  );

  return rows[0] ? Number(rows[0].rollover_out_amount || 0) : 0;
};

module.exports = {
  createDrawWithWinners,
  getAllDraws,
  getPublishedDraws,
  getDrawById,
  getLatestDrawByPeriod,
  publishDrawById,
  getPublishedDrawByPeriod,
  getWinnersByDrawId,
  getEligibleUserScores,
  getCurrentRolloverAmount,
};
