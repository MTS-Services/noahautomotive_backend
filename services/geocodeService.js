const axios = require("axios");

/**
 * Convert an address string to { latitude, longitude }
 * Uses OpenStreetMap Nominatim — free, no API key required.
 * Biased toward the UK (countrycodes=gb).
 */
const geocodeAddress = async (address) => {
  if (!address) return null;

  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: address,
          format: "json",
          //countrycodes: "gb",
          limit: 1,
        },
        headers: {
          "User-Agent": "NoahAutomotiveApp/1.0",
        },
        timeout: 5000,
      },
    );

    const results = response.data;
    if (!results || !results.length) {
      console.error(`[Geocode] No results for "${address}"`);
      return null;
    }

    return {
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon),
    };
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
 * Used for frontend autocomplete dropdowns.
 * Each result: { display, type, latitude, longitude }
 */
const getAddressSuggestions = async (query, limit = 8) => {
  if (!query || query.trim().length < 2) return [];

  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: query,
          format: "json",
          limit: Math.min(limit, 10),
          addressdetails: 1,
          namedetails: 1,
          extratags: 1,
          "accept-language": "en",
        },
        headers: {
          "User-Agent": "NoahAutomotiveApp/1.0",
        },
        timeout: 8000,
      },
    );

    const seen = new Set();

    return (response.data || [])
      .map((r) => {
        const a = r.address || {};

        // Most specific place name first (neighbourhood → suburb → road → city)
        const placeName =
          a.neighbourhood ||
          a.suburb ||
          a.quarter ||
          a.road ||
          a.pedestrian ||
          a.city_block ||
          null;

        // City-level
        const city =
          a.city || a.town || a.village || a.municipality || a.county || null;

        // Admin region
        const region = a.state_district || a.state || a.region || null;

        const country = a.country || null;

        // Compose: "Neighbourhood, City, Region, Country" — skip nulls
        const parts = [placeName, city, region, country].filter(Boolean);

        const deduped = parts.filter((p, i) => i === 0 || p !== parts[i - 1]);

        const display =
          deduped.length >= 2 ? deduped.join(", ") : r.display_name;

        return {
          display,
          type: r.type || r.class || "place",
          latitude: parseFloat(r.lat),
          longitude: parseFloat(r.lon),
        };
      })
      .filter((r) => {
        // Deduplicate by display label
        if (seen.has(r.display)) return false;
        seen.add(r.display);
        return true;
      });
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
