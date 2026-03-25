const express = require("express");
const {
  getAllUsers,
  getAllScores,
  getAllSubscriptions,
  suspendSubscription,
  reactivateSubscription,
  updateScore,
  runDraw,
  simulateDraw,
  publishDraw,
  getAllDraws,
  getAllWinners,
  reviewWinner,
  getAllCharities,
  getAnalyticsSummary,
  getAllDonations,
  createCharity,
  updateCharity,
  deleteCharity,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/users", getAllUsers);
router.get("/scores", getAllScores);
router.get("/subscriptions", getAllSubscriptions);
router.patch("/subscriptions/:subscriptionId/suspend", suspendSubscription);
router.patch("/subscriptions/:subscriptionId/reactivate", reactivateSubscription);
router.get("/analytics", getAnalyticsSummary);
router.get("/donations", getAllDonations);
router.patch("/scores/:scoreId", updateScore);
router.get("/draws", getAllDraws);
router.post("/draws/simulate", simulateDraw);
router.post("/draws/run", runDraw);
router.patch("/draws/:drawId/publish", publishDraw);
router.get("/winners", getAllWinners);
router.patch("/winners/:winnerId/review", reviewWinner);
router.get("/charities", getAllCharities);
router.post("/charities", createCharity);
router.patch("/charities/:charityId", updateCharity);
router.delete("/charities/:charityId", deleteCharity);

module.exports = router;
