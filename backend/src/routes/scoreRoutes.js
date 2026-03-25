const express = require("express");
const { addScore, getUserScores } = require("../controllers/scoreController");
const { protect } = require("../middleware/authMiddleware");
const { requireActiveSubscription } = require("../middleware/subscriptionMiddleware");

const router = express.Router();

router.use(protect);
router.use(requireActiveSubscription);

router.post("/", addScore);
router.get("/me", getUserScores);

module.exports = router;
