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

router.get("/listings", adminController.getRequestedListings);
router.get("/listings/approved", adminController.getApprovedListings);
router.get("/listings/suspended", adminController.getSuspendedListings);
router.put("/listings/:id/approve", adminController.approveListing);
router.put("/listings/:id/suspend", adminController.suspendListing);
router.delete("/listings/:id", adminController.deleteListing);

module.exports = router;
