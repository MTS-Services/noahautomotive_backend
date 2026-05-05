const axios = require("axios");

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Convert an address string to { latitude, longitude }
 * Uses Google Maps Geocoding API.
 */
const geocodeAddress = async (address) => {
  if (!address) return null;

  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: { address, key: GOOGLE_API_KEY },
        timeout: 5000,
      },
    );

    const data = response.data;
    if (data.status !== "OK" || !data.results || !data.results.length) {
      console.error(
        `[Geocode] No results for "${address}" — status: ${data.status}`,
      );
      return null;
    }

    const { lat, lng } = data.results[0].geometry.location;
    return { latitude: lat, longitude: lng };
  } catch (err) {
    console.error(`[Geocode] Exception for "${address}":`, err.message);
    return null;
  }
};

const geocodeSearchLocation = async (location) => {
  return geocodeAddress(location);
};

/**
 * Return up to `limit` address suggestions for a partial query string.
 * Uses Google Places Autocomplete API.
 * Each result: { display, type, latitude, longitude }
 */
const getAddressSuggestions = async (query, limit = 8) => {
  if (!query || query.trim().length < 2) return [];

  try {
    // Step 1: Get place predictions
    const autoResponse = await axios.get(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json",
      {
        params: {
          input: query,
          key: GOOGLE_API_KEY,
          language: "en",
          types: "geocode",
        },
        timeout: 8000,
      },
    );

    const predictions = (autoResponse.data.predictions || []).slice(
      0,
      Math.min(limit, 10),
    );

    if (!predictions.length) return [];

    // Step 2: Get lat/lng for each prediction via Place Details
    const results = await Promise.all(
      predictions.map(async (p) => {
        try {
          const detailRes = await axios.get(
            "https://maps.googleapis.com/maps/api/place/details/json",
            {
              params: {
                place_id: p.place_id,
                fields: "geometry,name",
                key: GOOGLE_API_KEY,
              },
              timeout: 5000,
            },
          );
          const loc = detailRes.data.result?.geometry?.location;
          return {
            display: p.description,
            type: p.types?.[0] || "place",
            latitude: loc?.lat ?? null,
            longitude: loc?.lng ?? null,
          };
        } catch {
          return {
            display: p.description,
            type: p.types?.[0] || "place",
            latitude: null,
            longitude: null,
          };
        }
      }),
    );

    return results;
  } catch (err) {
    console.error(`[Geocode] Suggestions error for "${query}":`, err.message);
    return [];
  }
};

module.exports = {
  geocodeAddress,
  geocodeSearchLocation,
  getAddressSuggestions,
};
