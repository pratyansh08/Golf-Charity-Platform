const { query } = require("../config/db");

const baseUserSelect = `
  SELECT
    users.id,
    users.name,
    users.email,
    users.password_hash,
    users.role,
    users.is_active,
    users.stripe_customer_id,
    users.selected_charity_id,
    users.contribution_percentage,
    users.created_at,
    users.updated_at,
    charities.name AS selected_charity_name
  FROM users
  LEFT JOIN charities ON charities.id = users.selected_charity_id
`;

const createUser = async ({
  name,
  email,
  passwordHash,
  role = "user",
  selectedCharityId = null,
  contributionPercentage = null,
}) => {
  const { rows } = await query(
    `
      INSERT INTO users (name, email, password_hash, role, selected_charity_id, contribution_percentage)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `,
    [name, email, passwordHash, role, selectedCharityId, contributionPercentage]
  );

  return findUserById(rows[0].id);
};

const findUserByEmail = async (email) => {
  const { rows } = await query(
    `
      ${baseUserSelect}
      WHERE email = $1
      LIMIT 1
    `,
    [email]
  );

  return rows[0] || null;
};

const findUserById = async (id) => {
  const { rows } = await query(
    `
      ${baseUserSelect}
      WHERE users.id = $1
      LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
};

const getAllUsers = async () => {
  const { rows } = await query(
    `
      SELECT
        users.id,
        users.name,
        users.email,
        users.role,
        users.is_active,
        users.stripe_customer_id,
        users.selected_charity_id,
        users.contribution_percentage,
        users.created_at,
        users.updated_at,
        charities.name AS selected_charity_name
      FROM users
      LEFT JOIN charities ON charities.id = users.selected_charity_id
      ORDER BY users.created_at DESC, users.id DESC
    `
  );

  return rows;
};

const updateUserProfile = async ({ userId, name, email, selectedCharityId, contributionPercentage }) => {
  const { rows } = await query(
    `
      UPDATE users
      SET name = $2,
          email = $3,
          selected_charity_id = $4,
          contribution_percentage = $5
      WHERE id = $1
      RETURNING id
    `,
    [userId, name, email, selectedCharityId, contributionPercentage]
  );

  return rows[0] ? findUserById(rows[0].id) : null;
};

const updatePasswordHash = async ({ userId, passwordHash }) => {
  const { rows } = await query(
    `
      UPDATE users
      SET password_hash = $2
      WHERE id = $1
      RETURNING id
    `,
    [userId, passwordHash]
  );

  return rows[0] ? findUserById(rows[0].id) : null;
};

const updateStripeCustomerId = async ({ userId, stripeCustomerId }) => {
  const { rows } = await query(
    `
      UPDATE users
      SET stripe_customer_id = $2
      WHERE id = $1
      RETURNING id
    `,
    [userId, stripeCustomerId]
  );

  return rows[0] ? findUserById(rows[0].id) : null;
};

const updateUserCharitySelection = async ({ userId, charityId, contributionPercentage }) => {
  const { rows } = await query(
    `
      UPDATE users
      SET selected_charity_id = $2,
          contribution_percentage = $3
      WHERE id = $1
      RETURNING id
    `,
    [userId, charityId, contributionPercentage]
  );

  return rows[0] ? findUserById(rows[0].id) : null;
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  getAllUsers,
  updateUserProfile,
  updatePasswordHash,
  updateStripeCustomerId,
  updateUserCharitySelection,
};
