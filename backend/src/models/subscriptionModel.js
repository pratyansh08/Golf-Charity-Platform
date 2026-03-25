const { query } = require("../config/db");

const mapSubscription = (subscription) => ({
  id: subscription.id,
  userId: subscription.user_id,
  planType: subscription.plan_type,
  status: subscription.status,
  provider: subscription.provider || null,
  providerCustomerId: subscription.provider_customer_id || null,
  providerSubscriptionId: subscription.provider_subscription_id || null,
  providerPriceId: subscription.provider_price_id || null,
  providerStatus: subscription.provider_status || null,
  cancellationScheduled:
    subscription.status === "active" &&
    subscription.cancelled_at !== null &&
    subscription.cancelled_at !== undefined,
  startsAt: subscription.starts_at,
  endsAt: subscription.ends_at,
  cancelledAt: subscription.cancelled_at,
  createdAt: subscription.created_at,
  updatedAt: subscription.updated_at,
});

const findSubscriptionById = async (subscriptionId) => {
  const { rows } = await query(
    `
      SELECT id, user_id, plan_type, status, starts_at, ends_at, cancelled_at, created_at, updated_at
      , provider, provider_customer_id, provider_subscription_id, provider_price_id, provider_status
      FROM subscriptions
      WHERE id = $1
      LIMIT 1
    `,
    [subscriptionId]
  );

  return rows[0] ? mapSubscription(rows[0]) : null;
};

const getSubscriptionsByUserId = async (userId) => {
  const { rows } = await query(
    `
      SELECT id, user_id, plan_type, status, starts_at, ends_at, cancelled_at, created_at, updated_at
      , provider, provider_customer_id, provider_subscription_id, provider_price_id, provider_status
      FROM subscriptions
      WHERE user_id = $1
      ORDER BY created_at DESC, id DESC
    `,
    [userId]
  );

  return rows.map(mapSubscription);
};

const getLatestSubscriptionByUserId = async (userId) => {
  const { rows } = await query(
    `
      SELECT id, user_id, plan_type, status, starts_at, ends_at, cancelled_at, created_at, updated_at
      , provider, provider_customer_id, provider_subscription_id, provider_price_id, provider_status
      FROM subscriptions
      WHERE user_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `,
    [userId]
  );

  return rows[0] ? mapSubscription(rows[0]) : null;
};

const extendSubscriptionById = async ({ subscriptionId, endsAt }) => {
  const { rows } = await query(
    `
      UPDATE subscriptions
      SET ends_at = $2,
          cancelled_at = NULL,
          status = 'active'
      WHERE id = $1
      RETURNING id, user_id, plan_type, status, starts_at, ends_at, cancelled_at, created_at, updated_at
      , provider, provider_customer_id, provider_subscription_id, provider_price_id, provider_status
    `,
    [subscriptionId, endsAt]
  );

  return rows[0] ? mapSubscription(rows[0]) : null;
};

const deactivateActiveSubscriptions = async (userId) => {
  await query(
    `
      UPDATE subscriptions
      SET status = 'inactive',
          cancelled_at = COALESCE(cancelled_at, NOW()),
          ends_at = LEAST(ends_at, NOW())
      WHERE user_id = $1
        AND status = 'active'
    `,
    [userId]
  );
};

const activateSubscription = async ({ userId, planType, startsAt, endsAt }) => {
  const { rows } = await query(
    `
      INSERT INTO subscriptions (user_id, plan_type, status, starts_at, ends_at)
      VALUES ($1, $2, 'active', $3, $4)
      RETURNING id, user_id, plan_type, status, starts_at, ends_at, cancelled_at, created_at, updated_at
      , provider, provider_customer_id, provider_subscription_id, provider_price_id, provider_status
    `,
    [userId, planType, startsAt, endsAt]
  );

  return mapSubscription(rows[0]);
};

const deactivateSubscription = async (userId) => {
  const { rows } = await query(
    `
      WITH target_subscription AS (
        SELECT id
        FROM subscriptions
        WHERE user_id = $1
        ORDER BY
          CASE WHEN status = 'active' THEN 0 ELSE 1 END,
          created_at DESC,
          id DESC
        LIMIT 1
      )
      UPDATE subscriptions
      SET status = 'inactive',
          cancelled_at = NOW(),
          ends_at = NOW()
      WHERE id = (SELECT id FROM target_subscription)
      RETURNING id, user_id, plan_type, status, starts_at, ends_at, cancelled_at, created_at, updated_at
      , provider, provider_customer_id, provider_subscription_id, provider_price_id, provider_status
    `,
    [userId]
  );

  return rows[0] ? mapSubscription(rows[0]) : null;
};

const adminSuspendSubscriptionById = async (subscriptionId) => {
  const { rows } = await query(
    `
      UPDATE subscriptions
      SET status = 'inactive',
          cancelled_at = NOW(),
          ends_at = NOW()
      WHERE id = $1
      RETURNING id, user_id, plan_type, status, starts_at, ends_at, cancelled_at, created_at, updated_at
      , provider, provider_customer_id, provider_subscription_id, provider_price_id, provider_status
    `,
    [subscriptionId]
  );

  return rows[0] ? mapSubscription(rows[0]) : null;
};

const adminReactivateSubscriptionById = async ({ subscriptionId, startsAt, endsAt }) => {
  const { rows } = await query(
    `
      UPDATE subscriptions
      SET status = 'active',
          starts_at = $2,
          ends_at = $3,
          cancelled_at = NULL
      WHERE id = $1
      RETURNING id, user_id, plan_type, status, starts_at, ends_at, cancelled_at, created_at, updated_at
      , provider, provider_customer_id, provider_subscription_id, provider_price_id, provider_status
    `,
    [subscriptionId, startsAt, endsAt]
  );

  return rows[0] ? mapSubscription(rows[0]) : null;
};

const findSubscriptionByProviderSubscriptionId = async (providerSubscriptionId) => {
  const { rows } = await query(
    `
      SELECT id, user_id, plan_type, status, starts_at, ends_at, cancelled_at, created_at, updated_at,
             provider, provider_customer_id, provider_subscription_id, provider_price_id, provider_status
      FROM subscriptions
      WHERE provider_subscription_id = $1
      LIMIT 1
    `,
    [providerSubscriptionId]
  );

  return rows[0] ? mapSubscription(rows[0]) : null;
};

const upsertStripeSubscription = async ({
  userId,
  planType,
  status,
  startsAt,
  endsAt,
  providerCustomerId,
  providerSubscriptionId,
  providerPriceId,
  providerStatus,
  cancelledAt = null,
}) => {
  if (status === "active") {
    await query(
      `
        UPDATE subscriptions
        SET status = 'inactive',
            cancelled_at = COALESCE(cancelled_at, NOW()),
            ends_at = LEAST(ends_at, NOW())
        WHERE user_id = $1
          AND status = 'active'
          AND (
            provider_subscription_id IS NULL
            OR provider_subscription_id <> $2
          )
      `,
      [userId, providerSubscriptionId]
    );
  }

  const { rows } = await query(
    `
      INSERT INTO subscriptions (
        user_id,
        plan_type,
        status,
        starts_at,
        ends_at,
        cancelled_at,
        provider,
        provider_customer_id,
        provider_subscription_id,
        provider_price_id,
        provider_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'stripe', $7, $8, $9, $10)
      ON CONFLICT (provider_subscription_id)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        plan_type = EXCLUDED.plan_type,
        status = EXCLUDED.status,
        starts_at = EXCLUDED.starts_at,
        ends_at = EXCLUDED.ends_at,
        cancelled_at = EXCLUDED.cancelled_at,
        provider = EXCLUDED.provider,
        provider_customer_id = EXCLUDED.provider_customer_id,
        provider_price_id = EXCLUDED.provider_price_id,
        provider_status = EXCLUDED.provider_status
      RETURNING id, user_id, plan_type, status, starts_at, ends_at, cancelled_at, created_at, updated_at,
                provider, provider_customer_id, provider_subscription_id, provider_price_id, provider_status
    `,
    [
      userId,
      planType,
      status,
      startsAt,
      endsAt,
      cancelledAt,
      providerCustomerId,
      providerSubscriptionId,
      providerPriceId,
      providerStatus,
    ]
  );

  return rows[0] ? mapSubscription(rows[0]) : null;
};

const getAllSubscriptions = async () => {
  const { rows } = await query(
    `
      SELECT
        subscriptions.id,
        subscriptions.user_id,
        subscriptions.plan_type,
        subscriptions.status,
        subscriptions.provider,
        subscriptions.provider_customer_id,
        subscriptions.provider_subscription_id,
        subscriptions.provider_price_id,
        subscriptions.provider_status,
        subscriptions.starts_at,
        subscriptions.ends_at,
        subscriptions.cancelled_at,
        subscriptions.created_at,
        subscriptions.updated_at,
        users.name AS user_name,
        users.email AS user_email
      FROM subscriptions
      INNER JOIN users ON users.id = subscriptions.user_id
      ORDER BY subscriptions.created_at DESC, subscriptions.id DESC
    `
  );

  return rows.map((row) => ({
    ...mapSubscription(row),
    userName: row.user_name,
    userEmail: row.user_email,
  }));
};

module.exports = {
  findSubscriptionById,
  getLatestSubscriptionByUserId,
  getSubscriptionsByUserId,
  extendSubscriptionById,
  deactivateActiveSubscriptions,
  activateSubscription,
  deactivateSubscription,
  adminSuspendSubscriptionById,
  adminReactivateSubscriptionById,
  findSubscriptionByProviderSubscriptionId,
  upsertStripeSubscription,
  getAllSubscriptions,
};
