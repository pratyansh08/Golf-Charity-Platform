const express = require("express");
const {
  getMyWinners,
  uploadProof,
  getAllWinners,
  reviewWinner,
} = require("../controllers/winnerController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protect, getMyWinners);
router.patch("/:winnerId/proof", protect, uploadProof);
router.get("/", protect, authorize("admin"), getAllWinners);
router.patch("/:winnerId/review", protect, authorize("admin"), reviewWinner);

module.exports = router;
