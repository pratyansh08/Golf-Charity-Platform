const { pool, query } = require("../config/db");

const formatDateOnly = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return new Date(value).toISOString().slice(0, 10);
};

const mapScore = (score) => ({
  id: score.id,
  userId: score.user_id,
  value: score.value,
  date: formatDateOnly(score.score_date),
  createdAt: score.created_at,
  updatedAt: score.updated_at,
});

const addScoreForUser = async ({ userId, value, date }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        INSERT INTO scores (user_id, value, score_date)
        VALUES ($1, $2, $3)
      `,
      [userId, value, date]
    );

    await client.query(
      `
        DELETE FROM scores
        WHERE id IN (
          SELECT id
          FROM scores
          WHERE user_id = $1
          ORDER BY score_date DESC, created_at DESC
          OFFSET 5
        )
      `,
      [userId]
    );

    const { rows } = await client.query(
      `
        SELECT id, user_id, value, score_date, created_at, updated_at
        FROM scores
        WHERE user_id = $1
        ORDER BY score_date DESC, created_at DESC
      `,
      [userId]
    );

    await client.query("COMMIT");

    return rows.map(mapScore);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getScoresByUserId = async (userId) => {
  const { rows } = await query(
    `
      SELECT id, user_id, value, score_date, created_at, updated_at
      FROM scores
      WHERE user_id = $1
      ORDER BY score_date DESC, created_at DESC
      LIMIT 5
    `,
    [userId]
  );

  return rows.map(mapScore);
};

const getAllScores = async () => {
  const { rows } = await query(
    `
      SELECT
        s.id,
        s.user_id,
        s.value,
        s.score_date,
        s.created_at,
        s.updated_at,
        u.name AS user_name,
        u.email AS user_email
      FROM scores s
      INNER JOIN users u ON u.id = s.user_id
      ORDER BY s.score_date DESC, s.created_at DESC, s.id DESC
    `
  );

  return rows.map((row) => ({
    ...mapScore(row),
    userName: row.user_name,
    userEmail: row.user_email,
  }));
};

const findScoreById = async (scoreId) => {
  const { rows } = await query(
    `
      SELECT id, user_id, value, score_date, created_at, updated_at
      FROM scores
      WHERE id = $1
      LIMIT 1
    `,
    [scoreId]
  );

  return rows[0] ? mapScore(rows[0]) : null;
};

const updateScoreById = async ({ scoreId, value, date }) => {
  const { rows } = await query(
    `
      UPDATE scores
      SET value = $2,
          score_date = $3
      WHERE id = $1
      RETURNING id, user_id, value, score_date, created_at, updated_at
    `,
    [scoreId, value, date]
  );

  return rows[0] ? mapScore(rows[0]) : null;
};

module.exports = {
  addScoreForUser,
  getScoresByUserId,
  getAllScores,
  findScoreById,
  updateScoreById,
};
