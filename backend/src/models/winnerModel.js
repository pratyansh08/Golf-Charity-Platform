const { query } = require("../config/db");

const mapWinner = (winner) => ({
  id: winner.id,
  drawResultId: winner.draw_result_id,
  userId: winner.user_id,
  matchCount: winner.match_count,
  matchedNumbers: winner.matched_numbers,
  proofImageUrl: winner.proof_image_url,
  prizeAmount: winner.prize_amount === null || winner.prize_amount === undefined ? null : Number(winner.prize_amount),
  status: winner.status,
  adminNote: winner.admin_note,
  reviewedBy: winner.reviewed_by,
  reviewedAt: winner.reviewed_at,
  userName: winner.user_name,
  userEmail: winner.user_email,
  createdAt: winner.created_at,
});

const baseWinnerSelect = `
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
`;

const findWinnerById = async (winnerId) => {
  const { rows } = await query(
    `
      ${baseWinnerSelect}
      WHERE dw.id = $1
      LIMIT 1
    `,
    [winnerId]
  );

  return rows[0] ? mapWinner(rows[0]) : null;
};

const getWinnersByUserId = async (userId) => {
  const { rows } = await query(
    `
      ${baseWinnerSelect}
      WHERE dw.user_id = $1
      ORDER BY dw.created_at DESC, dw.id DESC
    `,
    [userId]
  );

  return rows.map(mapWinner);
};

const getAllWinners = async () => {
  const { rows } = await query(
    `
      ${baseWinnerSelect}
      ORDER BY dw.created_at DESC, dw.id DESC
    `
  );

  return rows.map(mapWinner);
};

const uploadWinnerProof = async ({ winnerId, userId, proofImageUrl }) => {
  const { rows } = await query(
    `
      UPDATE draw_winners
      SET proof_image_url = $3,
          status = 'pending',
          admin_note = NULL,
          reviewed_by = NULL,
          reviewed_at = NULL
      WHERE id = $1
        AND user_id = $2
      RETURNING id, draw_result_id, user_id, match_count, matched_numbers, proof_image_url, prize_amount, status, admin_note, reviewed_by, reviewed_at, created_at
    `,
    [winnerId, userId, proofImageUrl]
  );

  return rows[0]
    ? mapWinner({
        ...rows[0],
        user_name: null,
        user_email: null,
      })
    : null;
};

const reviewWinner = async ({ winnerId, status, adminNote, reviewedBy }) => {
  const { rows } = await query(
    `
      UPDATE draw_winners
      SET status = $2,
          admin_note = $3,
          reviewed_by = $4,
          reviewed_at = NOW()
      WHERE id = $1
      RETURNING id, draw_result_id, user_id, match_count, matched_numbers, proof_image_url, prize_amount, status, admin_note, reviewed_by, reviewed_at, created_at
    `,
    [winnerId, status, adminNote, reviewedBy]
  );

  return rows[0]
    ? mapWinner({
        ...rows[0],
        user_name: null,
        user_email: null,
      })
    : null;
};

module.exports = {
  findWinnerById,
  getWinnersByUserId,
  getAllWinners,
  uploadWinnerProof,
  reviewWinner,
};
