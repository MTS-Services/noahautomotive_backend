const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

router.use(authenticate, authorize("ADMIN"));

// (no role)    → list both
router.get("/members", adminController.getMembers);
router.get("/members/:id", adminController.getMemberById);
router.put("/members/:id", adminController.updateMember);
router.delete("/members/:id", adminController.deleteMember);

router.get("/listings", adminController.getListings);
router.put("/listings/:id/status", adminController.updateListingStatus);
router.delete("/listings/:id", adminController.deleteListing);

module.exports = router;
