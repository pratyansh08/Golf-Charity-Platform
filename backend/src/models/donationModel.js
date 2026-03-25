const { query } = require("../config/db");

const mapDonation = (donation) => ({
  id: donation.id,
  userId: donation.user_id,
  charityId: donation.charity_id,
  charityName: donation.charity_name,
  amount: Number(donation.amount),
  status: donation.status,
  message: donation.message,
  reference: donation.reference,
  createdAt: donation.created_at,
});

const createDonation = async ({ userId, charityId, amount, message, reference }) => {
  const { rows } = await query(
    `
      INSERT INTO donations (user_id, charity_id, amount, status, message, reference)
      VALUES ($1, $2, $3, 'completed', $4, $5)
      RETURNING id, user_id, charity_id, amount, status, message, reference, created_at
    `,
    [userId, charityId, amount, message, reference]
  );

  return getDonationById(rows[0].id);
};

const getDonationById = async (donationId) => {
  const { rows } = await query(
    `
      SELECT
        donations.id,
        donations.user_id,
        donations.charity_id,
        donations.amount,
        donations.status,
        donations.message,
        donations.reference,
        donations.created_at,
        charities.name AS charity_name
      FROM donations
      INNER JOIN charities ON charities.id = donations.charity_id
      WHERE donations.id = $1
      LIMIT 1
    `,
    [donationId]
  );

  return rows[0] ? mapDonation(rows[0]) : null;
};

const getDonationsByUserId = async (userId) => {
  const { rows } = await query(
    `
      SELECT
        donations.id,
        donations.user_id,
        donations.charity_id,
        donations.amount,
        donations.status,
        donations.message,
        donations.reference,
        donations.created_at,
        charities.name AS charity_name
      FROM donations
      INNER JOIN charities ON charities.id = donations.charity_id
      WHERE donations.user_id = $1
      ORDER BY donations.created_at DESC, donations.id DESC
    `,
    [userId]
  );

  return rows.map(mapDonation);
};

const getAllDonations = async () => {
  const { rows } = await query(
    `
      SELECT
        donations.id,
        donations.user_id,
        donations.charity_id,
        donations.amount,
        donations.status,
        donations.message,
        donations.reference,
        donations.created_at,
        charities.name AS charity_name
      FROM donations
      INNER JOIN charities ON charities.id = donations.charity_id
      ORDER BY donations.created_at DESC, donations.id DESC
    `
  );

  return rows.map(mapDonation);
};

module.exports = {
  createDonation,
  getDonationsByUserId,
  getAllDonations,
};
