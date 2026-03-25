require("dotenv").config();
const app = require("./app");
const { connectDatabase } = require("./config/db");
const { initializeDatabase } = require("./services/databaseService");
const { startDrawScheduler } = require("./services/drawSchedulerService");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing. Add your Supabase Postgres connection string.");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing. Add a strong JWT secret to your environment.");
    }

    await connectDatabase();
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
      startDrawScheduler();
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
