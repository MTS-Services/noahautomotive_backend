# Location & Radius Search API — Postman Testing Guide

> **Base URL:** `https://backendnoahautomotive.mtscorporate.com`  
> **Local URL:** `http://localhost:3000`  
> **Auth:** None required — works for all users including guests.

---

## Endpoint

| Method | URL             | Auth          |
| ------ | --------------- | ------------- |
| `GET`  | `/api/listings` | None (public) |

---

## Location Parameters

| Parameter  | Type   | Required | Example            | Description                     |
| ---------- | ------ | :------: | ------------------ | ------------------------------- |
| `location` | string |    ✅    | `?location=London` | UK city, area, or postcode      |
| `radius`   | number |    ✅    | `?radius=30`       | Search radius in **kilometres** |

> Both `location` and `radius` must be provided together for radius search to activate.  
> Can be combined with any other filter (`make`, `fuel`, `price`, etc.).

---

## Step-by-Step Test Flow

### Step 1 — Login as VENDOR

**POST** `{{base_url}}/api/auth/login`

```json
{
  "email": "vendor@example.com",
  "password": "Password123"
}
```

→ Save the token as `{{token}}`

---

### Step 2 — Create a listing with a UK address

**POST** `{{base_url}}/api/listings`  
**Auth:** `Bearer {{token}}`  
**Body:** `form-data`

| Key          | Value               |
| ------------ | ------------------- |
| title        | 2022 BMW 3 Series   |
| about        | Excellent condition |
| price        | 25000               |
| year         | 2022                |
| mileage      | 15000               |
| fuel         | PETROL              |
| transmission | AUTOMATIC           |
| make         | BMW                 |
| model        | 3 Series            |
| engine       | 2.0L Turbo          |
| horsepower   | 255                 |
| color        | Black               |
| doors        | 4                   |
| seats        | 5                   |
| condition    | USED                |
| sellerName   | Noah Motors         |
| **address**  | **London, UK**      |

> The backend automatically geocodes the `address` field and saves `latitude` / `longitude` to the database.

→ Save `listingId` from the response.

---

### Step 3 — Login as ADMIN and approve the listing

**POST** `{{base_url}}/api/auth/login`

```json
{
  "email": "admin@example.com",
  "password": "AdminPass123"
}
```

→ Save token as `{{adminToken}}`

**PUT** `{{base_url}}/api/admin/listings/{{listingId}}/status`  
**Auth:** `Bearer {{adminToken}}`

```json
{
  "status": "APPROVED"
}
```

---

### Step 4 — Test Radius Search (no auth needed)

#### Basic — listings within 30 km of London

```
GET {{base_url}}/api/listings?location=London&radius=30
```

#### Wider radius — 100 km from London

```
GET {{base_url}}/api/listings?location=London&radius=100
```

#### Other UK cities

```
GET {{base_url}}/api/listings?location=Manchester&radius=25
GET {{base_url}}/api/listings?location=Birmingham&radius=40
GET {{base_url}}/api/listings?location=Leeds&radius=20
GET {{base_url}}/api/listings?location=Edinburgh&radius=30
GET {{base_url}}/api/listings?location=Bristol&radius=15
```

#### UK postcodes

```
GET {{base_url}}/api/listings?location=SW1A 1AA&radius=20
GET {{base_url}}/api/listings?location=M1 1AE&radius=15
```

---

### Step 5 — Combine radius with other filters

#### Electric cars within 50 km of London, price low → high

```
GET {{base_url}}/api/listings?location=London&radius=50&fuel=ELECTRIC&sortBy=price&sortOrder=asc
```

#### BMW, USED, within 40 km of Manchester

```
GET {{base_url}}/api/listings?location=Manchester&radius=40&make=BMW&condition=USED
```

#### Any car under £20,000 within 30 km of Birmingham

```
GET {{base_url}}/api/listings?location=Birmingham&radius=30&maxPrice=20000
```

#### Automatic, 5 seats, within 60 km of London, newest first

```
GET {{base_url}}/api/listings?location=London&radius=60&transmission=AUTOMATIC&minSeats=5&maxSeats=5&sortBy=createdAt&sortOrder=desc
```

---

## Expected Response `200`

```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "listing-uuid",
        "title": "2022 BMW 3 Series",
        "price": "25000.00",
        "year": 2022,
        "mileage": 15000,
        "fuel": "PETROL",
        "transmission": "AUTOMATIC",
        "make": "BMW",
        "model": "3 Series",
        "address": "London, UK",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "status": "APPROVED",
        "vendor": {
          "id": "vendor-uuid",
          "fullName": "Vendor Name",
          "email": "vendor@example.com",
          "profileImage": null
        },
        "images": [],
        "_count": { "reviews": 0 }
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

## Error Responses

| Scenario                             | Status | Message                                      |
| ------------------------------------ | ------ | -------------------------------------------- |
| Location cannot be geocoded          | `400`  | `Could not geocode the provided location`    |
| Radius is 0 or negative              | `400`  | `radius must be a positive number (km)`      |
| No listings in the area              | `200`  | Empty `listings: []`                         |
| `location` provided without `radius` | `200`  | Returns all listings (radius filter ignored) |

---

## How It Works (Behind the Scenes)

1. **Listing creation** — when a vendor adds a listing, the `address` field is sent to the Google Maps Geocoding API (biased to UK). The returned `latitude` and `longitude` are stored on the listing.
2. **Search** — when `location` + `radius` are provided:
   - The search location is geocoded via Google Maps
   - A bounding box pre-filter is applied on `latitude`/`longitude` in the database
   - The exact **Haversine formula** is then applied in code to filter by true circular radius
3. **Listings without coordinates** (e.g. created before this feature) are excluded from radius results.
