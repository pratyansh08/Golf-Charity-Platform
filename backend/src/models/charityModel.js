const { query } = require("../config/db");

const mapCharity = (charity) => ({
  id: charity.id,
  name: charity.name,
  description: charity.description,
  createdAt: charity.created_at,
  updatedAt: charity.updated_at,
});

const getAllCharities = async () => {
  const { rows } = await query(
    `
      SELECT id, name, description, created_at, updated_at
      FROM charities
      ORDER BY name ASC
    `
  );

  return rows.map(mapCharity);
};

const findCharityById = async (id) => {
  const { rows } = await query(
    `
      SELECT id, name, description, created_at, updated_at
      FROM charities
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return rows[0] ? mapCharity(rows[0]) : null;
};

const getCharityDetailsById = async (id) => {
  const { rows } = await query(
    `
      SELECT
        charities.id,
        charities.name,
        charities.description,
        charities.created_at,
        charities.updated_at,
        COALESCE(SUM(donations.amount), 0) AS donation_total,
        COUNT(donations.id) AS donation_count
      FROM charities
      LEFT JOIN donations ON donations.charity_id = charities.id
      WHERE charities.id = $1
      GROUP BY charities.id
      LIMIT 1
    `,
    [id]
  );

  return rows[0]
    ? {
        ...mapCharity(rows[0]),
        donationTotal: Number(rows[0].donation_total),
        donationCount: Number(rows[0].donation_count),
      }
    : null;
};

const createCharity = async ({ name, description }) => {
  const { rows } = await query(
    `
      INSERT INTO charities (name, description)
      VALUES ($1, $2)
      RETURNING id, name, description, created_at, updated_at
    `,
    [name, description]
  );

  return mapCharity(rows[0]);
};

const updateCharityById = async ({ charityId, name, description }) => {
  const { rows } = await query(
    `
      UPDATE charities
      SET name = $2,
          description = $3
      WHERE id = $1
      RETURNING id, name, description, created_at, updated_at
    `,
    [charityId, name, description]
  );

  return rows[0] ? mapCharity(rows[0]) : null;
};

const deleteCharityById = async (charityId) => {
  const { rows } = await query(
    `
      DELETE FROM charities
      WHERE id = $1
      RETURNING id, name, description, created_at, updated_at
    `,
    [charityId]
  );

  return rows[0] ? mapCharity(rows[0]) : null;
};

module.exports = {
  getAllCharities,
  findCharityById,
  getCharityDetailsById,
  createCharity,
  updateCharityById,
  deleteCharityById,
};
