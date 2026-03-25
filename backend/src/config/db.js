const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === "false" ? false : isProduction ? { rejectUnauthorized: false } : false,
});

const query = (text, params) => pool.query(text, params);

const connectDatabase = async () => {
  const client = await pool.connect();

  try {
    await client.query("SELECT NOW()");
    console.log("PostgreSQL connected successfully.");
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  connectDatabase,
};
