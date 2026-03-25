const drawService = require("./drawService");

let schedulerHandle = null;

const runScheduledCycle = async () => {
  try {
    const result = await drawService.runMonthlyDrawIfDue();

    if (!result.skipped) {
      console.log(`[draw-scheduler] Monthly draw created for period ${result.draw.drawPeriod}.`);
      return;
    }

    console.log(`[draw-scheduler] Skipped: ${result.reason}`);
  } catch (error) {
    console.error(`[draw-scheduler] Failed: ${error.message}`);
  }
};

const startDrawScheduler = () => {
  const schedulerEnabled = (process.env.ENABLE_MONTHLY_DRAW_SCHEDULER || "true").toLowerCase() === "true";

  if (!schedulerEnabled) {
    console.log("[draw-scheduler] Disabled by environment.");
    return;
  }

  const intervalHours = Number.parseInt(process.env.DRAW_SCHEDULER_INTERVAL_HOURS || "6", 10);
  const intervalMs = Math.max(intervalHours, 1) * 60 * 60 * 1000;

  runScheduledCycle().catch(() => {});
  schedulerHandle = setInterval(() => {
    runScheduledCycle().catch(() => {});
  }, intervalMs);

  console.log(`[draw-scheduler] Started (interval: ${Math.max(intervalHours, 1)}h).`);
};

const stopDrawScheduler = () => {
  if (schedulerHandle) {
    clearInterval(schedulerHandle);
    schedulerHandle = null;
  }
};

module.exports = {
  startDrawScheduler,
  stopDrawScheduler,
};
