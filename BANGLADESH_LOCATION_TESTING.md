# Bangladesh Location Search — Full Testing Guide

## How It Works

1. When a listing is **created**, the `address` field is geocoded by Nominatim → `latitude` & `longitude` are saved into the DB.
2. When you search with `?location=...&radius=...`, the search location is also geocoded and then a **Haversine** calculation finds all listings within `radius` km.

---

## Reference: Bangladesh City Coordinates

| City / Area      | Latitude | Longitude | Distance from Gulshan, Dhaka |
| ---------------- | -------- | --------- | ---------------------------- |
| Gulshan, Dhaka   | 23.7925  | 90.4078   | 0 km (reference point)       |
| Dhanmondi, Dhaka | 23.7461  | 90.3742   | ~7 km                        |
| Uttara, Dhaka    | 23.8759  | 90.3795   | ~11 km                       |
| Narayanganj      | 23.6238  | 90.5000   | ~19 km                       |
| Gazipur          | 23.9999  | 90.4203   | ~24 km                       |
| Savar            | 23.8583  | 90.2667   | ~22 km                       |
| Comilla          | 23.4607  | 91.1809   | ~105 km                      |
| Rajshahi         | 24.3636  | 88.6241   | ~195 km                      |
| Chittagong       | 22.3569  | 91.7832   | ~242 km                      |
| Sylhet           | 24.8949  | 91.8687   | ~270 km                      |

---

## Step 1 — Create Listings at Different Locations

Create **4 listings** at different distances from Dhaka. Use your vendor JWT token.

### Listing 1 — Gulshan, Dhaka (~0 km)

`POST {{baseUrl}}/api/listings`

```json
{
  "title": "2022 BMW 3 Series BD",
  "about": "Excellent condition",
  "price": 25000,
  "year": 2022,
  "mileage": 15000,
  "fuel": "PETROL",
  "transmission": "AUTOMATIC",
  "make": "BMW",
  "model": "3 Series",
  "engine": "2.0L Turbo",
  "horsepower": 255,
  "color": "Black",
  "doors": 4,
  "seats": 5,
  "condition": "USED",
  "sellerName": "Noah Motors",
  "address": "Gulshan, Dhaka, Bangladesh"
}
```

**Expected**: `latitude ≈ 23.7925`, `longitude ≈ 90.4078`

---

### Listing 2 — Narayanganj (~19 km from Gulshan)

`POST {{baseUrl}}/api/listings`

```json
{
  "title": "2020 Toyota Corolla NJ",
  "about": "Well maintained",
  "price": 18000,
  "year": 2020,
  "mileage": 30000,
  "fuel": "PETROL",
  "transmission": "AUTOMATIC",
  "make": "Toyota",
  "model": "Corolla",
  "engine": "1.8L",
  "horsepower": 140,
  "color": "White",
  "doors": 4,
  "seats": 5,
  "condition": "USED",
  "sellerName": "Noah Motors",
  "address": "Narayanganj, Bangladesh"
}
```

**Expected**: `latitude ≈ 23.6238`, `longitude ≈ 90.5000`

---

### Listing 3 — Gazipur (~24 km from Gulshan)

`POST {{baseUrl}}/api/listings`

```json
{
  "title": "2019 Honda Civic GZ",
  "about": "Single owner",
  "price": 15000,
  "year": 2019,
  "mileage": 45000,
  "fuel": "PETROL",
  "transmission": "MANUAL",
  "make": "Honda",
  "model": "Civic",
  "engine": "1.5L Turbo",
  "horsepower": 174,
  "color": "Silver",
  "doors": 4,
  "seats": 5,
  "condition": "USED",
  "sellerName": "Noah Motors",
  "address": "Gazipur, Bangladesh"
}
```

**Expected**: `latitude ≈ 23.9999`, `longitude ≈ 90.4203`

---

### Listing 4 — Chittagong (~242 km from Gulshan)

`POST {{baseUrl}}/api/listings`

```json
{
  "title": "2021 Mitsubishi Outlander CTG",
  "about": "Port city car",
  "price": 32000,
  "year": 2021,
  "mileage": 20000,
  "fuel": "DIESEL",
  "transmission": "AUTOMATIC",
  "make": "Mitsubishi",
  "model": "Outlander",
  "engine": "2.4L",
  "horsepower": 166,
  "color": "Blue",
  "doors": 4,
  "seats": 7,
  "condition": "USED",
  "sellerName": "Noah Motors",
  "address": "Chittagong, Bangladesh"
}
```

**Expected**: `latitude ≈ 22.3569`, `longitude ≈ 91.7832`

---

## Step 2 — Admin Approves Listings

`PUT {{baseUrl}}/api/admin/listings/:id/status`

```json
{ "status": "APPROVED" }
```

Repeat for all 4 listing IDs.

---

## Step 3 — Radius Search Tests

### Test A — 10 km radius from Gulshan

`GET {{baseUrl}}/api/listings?location=Gulshan, Dhaka, Bangladesh&radius=10`

**Expected results**: Only Listing 1 (Gulshan, ~0 km) ✅
**Should NOT appear**: Listings 2, 3, 4

---

### Test B — 25 km radius from Gulshan

`GET {{baseUrl}}/api/listings?location=Gulshan, Dhaka, Bangladesh&radius=25`

**Expected results**: Listings 1, 2, 3 (within 25 km) ✅
**Should NOT appear**: Listing 4 (Chittagong is 242 km away)

---

### Test C — 300 km radius from Dhaka (all Bangladesh)

`GET {{baseUrl}}/api/listings?location=Dhaka, Bangladesh&radius=300`

**Expected results**: All 4 listings ✅

---

### Test D — Search from Chittagong, 50 km radius

`GET {{baseUrl}}/api/listings?location=Chittagong, Bangladesh&radius=50`

**Expected results**: Only Listing 4 (Chittagong) ✅
**Should NOT appear**: Listings 1, 2, 3 (all ~240+ km away)

---

### Test E — Invalid radius (error handling)

`GET {{baseUrl}}/api/listings?location=Dhaka, Bangladesh&radius=-5`

**Expected**: `400 Bad Request` — "radius must be a positive number (km)"

---

### Test F — Unknown location (error handling)

`GET {{baseUrl}}/api/listings?location=xyzabc12345&radius=50`

**Expected**: `400 Bad Request` — "Could not geocode the provided location"

---

## Step 4 — Verify Coordinates in Response

When you create a listing, the response should include:

```json
{
  "latitude": 23.7925,
  "longitude": 90.4078
}
```

If both are `null`, the address was not recognized by Nominatim. Try a more specific string:

- ❌ `"Dhaka"` — sometimes ambiguous
- ✅ `"Gulshan, Dhaka, Bangladesh"` — specific, always works
- ✅ `"Narayanganj, Bangladesh"`
- ✅ `"Chittagong, Bangladesh"`

---

## Combine With Other Filters

Radius search works together with all other filters:

```
GET {{baseUrl}}/api/listings?location=Dhaka, Bangladesh&radius=30&fuel=PETROL&minPrice=10000&maxPrice=30000
```

This returns only PETROL listings priced 10k–30k within 30 km of Dhaka.

---

## Notes

- `radius` is always in **kilometres**
- Nominatim is rate-limited to **1 request/second** — fine for testing, fine for production at normal traffic
- No API key needed — completely free
- Coordinates are stored permanently in the DB after first geocoding; they don't change unless the listing is updated with a new address
