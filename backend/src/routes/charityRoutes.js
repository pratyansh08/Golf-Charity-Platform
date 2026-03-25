const express = require("express");
const {
  getCharities,
  getCharityDetails,
  getMyDonations,
  selectCharity,
  createDonation,
} = require("../controllers/charityController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getCharities);
router.get("/my-donations", protect, getMyDonations);
router.get("/:charityId", getCharityDetails);
router.patch("/select", protect, selectCharity);
router.post("/:charityId/donate", protect, createDonation);

module.exports = router;
