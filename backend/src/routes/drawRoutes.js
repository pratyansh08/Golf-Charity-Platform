const express = require("express");
const { triggerDraw, getDraws, getDrawById } = require("../controllers/drawController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getDraws);
router.get("/:drawId", protect, getDrawById);
router.post("/trigger", protect, authorize("admin"), triggerDraw);

module.exports = router;
