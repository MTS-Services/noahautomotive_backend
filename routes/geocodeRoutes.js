const express = require("express");
const router = express.Router();
const geocodeController = require("../controllers/geocodeController");

// GET /api/geocode/suggestions?q=Dha&limit=5
router.get("/suggestions", geocodeController.suggestions);

module.exports = router;
//
