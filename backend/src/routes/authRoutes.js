const express = require("express");
const {
  signup,
  login,
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  getAdminDashboard,
  logout,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getCurrentUser);
router.patch("/me", protect, updateCurrentUser);
router.patch("/me/password", protect, changePassword);
router.get("/admin", protect, authorize("admin"), getAdminDashboard);

module.exports = router;
