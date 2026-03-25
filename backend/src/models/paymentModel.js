const { query } = require("../config/db");

const mapPayment = (payment) => ({
  id: payment.id,
  userId: payment.user_id,
  subscriptionId: payment.subscription_id,
  transactionType: payment.transaction_type,
  provider: payment.provider,
  status: payment.status,
  amount: Number(payment.amount),
  currency: payment.currency,
  reference: payment.reference,
  metadata: payment.metadata || {},
  createdAt: payment.created_at,
  updatedAt: payment.updated_at,
});

const createPaymentTransaction = async ({
  userId,
  subscriptionId = null,
  transactionType,
  provider = "mock",
  status = "completed",
  amount,
  currency = "USD",
  reference,
  metadata = {},
}) => {
  const { rows } = await query(
    `
      INSERT INTO payment_transactions (
        user_id,
        subscription_id,
        transaction_type,
        provider,
        status,
        amount,
        currency,
        reference,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (reference)
      DO UPDATE SET
        subscription_id = EXCLUDED.subscription_id,
        transaction_type = EXCLUDED.transaction_type,
        provider = EXCLUDED.provider,
        status = EXCLUDED.status,
        amount = EXCLUDED.amount,
        currency = EXCLUDED.currency,
        metadata = EXCLUDED.metadata
      RETURNING *
    `,
    [userId, subscriptionId, transactionType, provider, status, amount, currency, reference, metadata]
  );

  return mapPayment(rows[0]);
};

const findPaymentByReference = async (reference) => {
  const { rows } = await query(
    `
      SELECT *
      FROM payment_transactions
      WHERE reference = $1
      LIMIT 1
    `,
    [reference]
  );

  return rows[0] ? mapPayment(rows[0]) : null;
};

const getPaymentsByUserId = async (userId) => {
  const { rows } = await query(
    `
      SELECT *
      FROM payment_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC, id DESC
    `,
    [userId]
  );

  return rows.map(mapPayment);
};

const getAllPayments = async () => {
  const { rows } = await query(
    `
      SELECT *
      FROM payment_transactions
      ORDER BY created_at DESC, id DESC
    `
  );

  return rows.map(mapPayment);
};

module.exports = {
  createPaymentTransaction,
  findPaymentByReference,
  getPaymentsByUserId,
  getAllPayments,
};
