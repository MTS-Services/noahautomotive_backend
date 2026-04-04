const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

// All admin routes require a valid token + ADMIN role
router.use(authenticate, authorize("ADMIN"));

// ─── Members (Users & Vendors via single route) ───────────────────────────────
// ?role=USER   → list users only
// ?role=VENDOR → list vendors only
// (no role)    → list both
router.get("/members", adminController.getMembers); // list
router.get("/members/:id", adminController.getMemberById); // get by id
router.put("/members/:id", adminController.updateMember); // update
router.delete("/members/:id", adminController.deleteMember); // delete

// ─── Listings ─────────────────────────────────────────────────────────────────
router.get("/listings", adminController.getRequestedListings);
router.get("/listings/approved", adminController.getApprovedListings);
router.get("/listings/suspended", adminController.getSuspendedListings);
router.put("/listings/:id/approve", adminController.approveListing);
router.put("/listings/:id/suspend", adminController.suspendListing);
router.delete("/listings/:id", adminController.deleteListing);

module.exports = router;
