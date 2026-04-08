const { getAddressSuggestions } = require("../services/geocodeService");

const suggestions = async (req, res) => {
  const { q, limit } = req.query;

  if (!q || q.trim().length < 2) {
    return res
      .status(400)
      .json({ success: false, message: "q must be at least 2 characters" });
  }

  const results = await getAddressSuggestions(
    q.trim(),
    parseInt(limit, 10) || 8,
  );

  res.json({ success: true, suggestions: results });
};

module.exports = { suggestions };
