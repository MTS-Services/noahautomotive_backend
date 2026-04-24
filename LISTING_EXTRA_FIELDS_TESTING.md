# Listing Extra Fields — Postman Testing Guide

## Field Reference

### Stored Fields (sent on create/update)

| Field            | Type     | Required | Validation                                           |
| ---------------- | -------- | -------- | ---------------------------------------------------- |
| `type`           | string   | No       | `SUV`, `SEDAN`, `HATCHBACK`, `HYBRID`, `CONVERTIBLE` |
| `engineSize`     | number   | No       | Litres — must be from the allowed list (e.g. `2.0`)  |
| `fuelEconomy`    | number   | No       | Integer between `4` and `50` (mpg)                   |
| `vehicleHistory` | string[] | No       | Array of enum values — see allowed values below      |
| `doors`          | number   | Yes      | Number of doors                                      |
| `color`          | string   | Yes      | See color list below                                 |

### Computed Fields (returned in responses, never sent)

| Field          | Type    | Description                                      |
| -------------- | ------- | ------------------------------------------------ |
| `daysOnMarket` | number  | Days since admin approved. `null` until approved |
| `hasPhotos`    | boolean | `true` if listing has at least 1 image           |

---

## Allowed Values

### Vehicle Type

```
SUV, SEDAN, HATCHBACK, HYBRID, CONVERTIBLE
```

Case-insensitive — `"suv"` and `"SUV"` both accepted, stored as uppercase.

### Color

```
Black, Blue, Brown, Gold, Green, Grey, Orange, Pink, Purple, Red, Silver, Teal, White, Yellow, Unknown
```

Case-insensitive — `"black"` stored as `"Black"`.

### Engine Size (litres)

```
0.6, 0.8, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9,
2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9,
3.0, 3.2, 3.5, 3.7, 3.9,
4.0, 4.2, 4.4, 4.7,
5.0, 5.2, 5.5,
6.0, 6.2, 6.5, 7.0
```

### Fuel Economy

Integer between `4` and `50` (MPG).

### Vehicle History (enum array)

Send as **multiple form-data rows with the same key** `vehicleHistory`, or as a JSON array.

| Enum Value                   | Meaning                                     |
| ---------------------------- | ------------------------------------------- |
| `NO_ACCIDENTS_REPORTED`      | No accidents reported                       |
| `NO_THEFT_HISTORY_REPORTED`  | No theft history reported                   |
| `NO_VEHICLE_DAMAGE_REPORTED` | No vehicle damage reported (Category B/N/S) |

- Omit the field entirely → stored as `[]`
- Send one, two, or all three
- Case-insensitive — stored as uppercase

---

## Test 1 — Create Listing with All Fields (full vehicle history)

`POST {{baseUrl}}/api/listings`
**Auth**: Bearer `{{vendorToken}}`
**Body**: `form-data`

| Key              | Value                           |
| ---------------- | ------------------------------- |
| `title`          | 2022 BMW 3 Series               |
| `about`          | Clean car, full service history |
| `price`          | 25000                           |
| `year`           | 2022                            |
| `mileage`        | 15000                           |
| `fuel`           | PETROL                          |
| `transmission`   | AUTOMATIC                       |
| `make`           | BMW                             |
| `model`          | 3 Series                        |
| `engine`         | 2.0L Turbo                      |
| `engineSize`     | 2.0                             |
| `horsepower`     | 255                             |
| `color`          | Black                           |
| `doors`          | 4                               |
| `seats`          | 5                               |
| `condition`      | USED                            |
| `type`           | SEDAN                           |
| `sellerName`     | Noah Motors                     |
| `address`        | Gulshan, Dhaka, Bangladesh      |
| `fuelEconomy`    | 38                              |
| `vehicleHistory` | NO_ACCIDENTS_REPORTED           |
| `vehicleHistory` | NO_THEFT_HISTORY_REPORTED       |
| `vehicleHistory` | NO_VEHICLE_DAMAGE_REPORTED      |

> Add `vehicleHistory` as **three separate rows** with the same key in Postman form-data.

**Expected response (201):**

```json
{
  "success": true,
  "data": {
    "type": "SEDAN",
    "engineSize": "2.0",
    "fuelEconomy": 38,
    "vehicleHistory": [
      "NO_ACCIDENTS_REPORTED",
      "NO_THEFT_HISTORY_REPORTED",
      "NO_VEHICLE_DAMAGE_REPORTED"
    ],
    "daysOnMarket": null,
    "hasPhotos": false
  }
}
```

> `daysOnMarket` is `null` — listing is PENDING, not yet approved.

---

## Test 2 — Create Listing with Partial Vehicle History

Send only one history claim (add the other required fields too):

| Key              | Value                 |
| ---------------- | --------------------- |
| `vehicleHistory` | NO_ACCIDENTS_REPORTED |

**Expected:**

```json
{
  "vehicleHistory": ["NO_ACCIDENTS_REPORTED"]
}
```

---

## Test 3 — Create Listing with No Vehicle History

Omit `vehicleHistory` entirely.

**Expected:**

```json
{
  "vehicleHistory": []
}
```

---

## Test 4 — Create Listing With Images

Same as Test 1, but also attach files:

| Key      | Type | Value                                   |
| -------- | ---- | --------------------------------------- |
| `images` | File | _(attach 1–10 jpg/png/webp/avif files)_ |

**Expected**: `"hasPhotos": true`

---

## Test 5 — Admin Approves the Listing

`PUT {{baseUrl}}/api/admin/listings/{{listingId}}/status`
**Auth**: Bearer `{{adminToken}}`
**Body**: `raw JSON`

```json
{ "status": "APPROVED" }
```

**Expected response includes:**

```json
{
  "status": "APPROVED",
  "approvedAt": "2026-04-23T11:31:12.000Z"
}
```

---

## Test 6 — Get Single Listing (verify computed fields)

`GET {{baseUrl}}/api/listings/{{listingId}}`

**Expected (approved today = 0 days):**

```json
{
  "type": "SEDAN",
  "engineSize": "2.0",
  "fuelEconomy": 38,
  "vehicleHistory": [
    "NO_ACCIDENTS_REPORTED",
    "NO_THEFT_HISTORY_REPORTED",
    "NO_VEHICLE_DAMAGE_REPORTED"
  ],
  "approvedAt": "2026-04-23T11:31:12.000Z",
  "daysOnMarket": 0,
  "hasPhotos": true
}
```

---

## Test 7 — Update Vehicle History

`PUT {{baseUrl}}/api/listings/{{listingId}}`
**Auth**: Bearer `{{vendorToken}}`
**Body**: `form-data` — send only the fields to change

| Key              | Value                     |
| ---------------- | ------------------------- |
| `vehicleHistory` | NO_ACCIDENTS_REPORTED     |
| `vehicleHistory` | NO_THEFT_HISTORY_REPORTED |

Sends 2 values — replaces the entire `vehicleHistory` array.

**Expected:**

```json
{
  "vehicleHistory": ["NO_ACCIDENTS_REPORTED", "NO_THEFT_HISTORY_REPORTED"]
}
```

---

## Test 8 — Validation Error: Invalid Vehicle History Value

Send `vehicleHistory: "NO_CRASH"`.

**Expected 400:**

```json
{
  "success": false,
  "message": "vehicleHistory values must be one of: NO_ACCIDENTS_REPORTED, NO_THEFT_HISTORY_REPORTED, NO_VEHICLE_DAMAGE_REPORTED",
  "field": "vehicleHistory"
}
```

---

## Test 9 — Validation Error: Invalid Type

Send `type: "TRUCK"`.

**Expected 400:**

```json
{
  "success": false,
  "message": "type must be one of: SUV, SEDAN, HATCHBACK, HYBRID, CONVERTIBLE",
  "field": "type"
}
```

---

## Test 10 — Validation Error: Invalid Engine Size

Send `engineSize: 1.15` (not in the allowed list).

**Expected 400:**

```json
{
  "success": false,
  "message": "engineSize must be one of: 0.6, 0.8, 1.0, 1.1 ...",
  "field": "engineSize"
}
```

---

## Test 11 — Validation Error: Fuel Economy Out of Range

Send `fuelEconomy: 3` or `fuelEconomy: 51`.

**Expected 400:**

```json
{
  "success": false,
  "message": "fuelEconomy must be between 4 and 50 (mpg)",
  "field": "fuelEconomy"
}
```

---

## Test 12 — Validation Error: Invalid Color

Send `color: "Magenta"`.

**Expected 400:**

```json
{
  "success": false,
  "message": "color must be one of: Black, Blue, Brown, Gold, Green, Grey, Orange, Pink, Purple, Red, Silver, Teal, White, Yellow, Unknown",
  "field": "color"
}
```

---

## Test 13 — Filter Listings by Type

```
GET {{baseUrl}}/api/listings?type=SUV
GET {{baseUrl}}/api/listings?type=SEDAN&make=BMW&maxPrice=30000
GET {{baseUrl}}/api/listings?type=HATCHBACK&fuel=PETROL&minYear=2020
```

---

## Full Response Shape

```json
{
  "id": "uuid",
  "title": "2022 BMW 3 Series",
  "about": "Clean car, full service history",
  "price": "25000.00",
  "year": 2022,
  "mileage": 15000,
  "fuel": "PETROL",
  "transmission": "AUTOMATIC",
  "make": "BMW",
  "model": "3 Series",
  "engine": "2.0L Turbo",
  "engineSize": "2.0",
  "horsepower": 255,
  "color": "Black",
  "doors": 4,
  "seats": 5,
  "condition": "USED",
  "type": "SEDAN",
  "sellerName": "Noah Motors",
  "address": "Gulshan, Dhaka, Bangladesh",
  "latitude": 23.7925,
  "longitude": 90.4078,
  "fuelEconomy": 38,
  "vehicleHistory": [
    "NO_ACCIDENTS_REPORTED",
    "NO_THEFT_HISTORY_REPORTED",
    "NO_VEHICLE_DAMAGE_REPORTED"
  ],
  "status": "APPROVED",
  "approvedAt": "2026-04-23T11:31:12.000Z",
  "daysOnMarket": 0,
  "hasPhotos": true,
  "createdAt": "2026-04-23T11:25:00.000Z",
  "updatedAt": "2026-04-23T11:31:12.000Z",
  "vendor": {
    "id": "uuid",
    "fullName": "James Smith",
    "email": "james@example.com",
    "profileImage": null
  },
  "images": [
    {
      "id": "uuid",
      "url": "https://backendnoahautomotive.mtscorporate.com/uploads/listings/abc.jpg"
    }
  ],
  "_count": { "reviews": 3 }
}
```

```json
{
  "id": "...",
  "title": "2022 BMW 3 Series",
  "engineSize": "2.0",
  "fuelEconomy": 38,
  "noAccidents": true,
  "noTheft": true,
  "noDamage": false,
  "doors": 4,
  "approvedAt": "2026-04-23T11:25:38.000Z",
  "daysOnMarket": 0,
  "hasPhotos": true
}
```

### Field meanings

| Field          | Description                                           |
| -------------- | ----------------------------------------------------- |
| `engineSize`   | Engine displacement in litres (e.g. `"2.0"`)          |
| `fuelEconomy`  | Fuel efficiency in MPG (4–50)                         |
| `noAccidents`  | `true` = No accidents reported                        |
| `noTheft`      | `true` = No theft history reported                    |
| `noDamage`     | `true` = No vehicle damage (Cat B/N/S)                |
| `doors`        | Number of doors (existing field)                      |
| `daysOnMarket` | Days since admin approved. `null` if not yet approved |
| `hasPhotos`    | `true` if at least one image is attached              |
