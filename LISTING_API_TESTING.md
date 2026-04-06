# Listing API Testing Guide (Postman)

> **Base URL:** `https://backendnoahautomotive.mtscorporate.com`  
> **Local URL:** `http://localhost:3000`

---

## Collection Variables

| Variable    | Value                                            |
| ----------- | ------------------------------------------------ |
| `base_url`  | `https://backendnoahautomotive.mtscorporate.com` |
| `token`     | _(vendor or admin token)_                        |
| `listingId` | _(fill after create)_                            |
| `imageId`   | _(fill from listing images array)_               |

---

## Role Summary

| Action                           | PUBLIC | USER |             VENDOR              |  ADMIN   |
| -------------------------------- | :----: | :--: | :-----------------------------: | :------: |
| Browse approved listings         |   ✅   |  ✅  |               ✅                |    ✅    |
| View single approved listing     |   ✅   |  ✅  |               ✅                |    ✅    |
| View own listings (all statuses) |   ❌   |  ❌  |               ✅                |    ❌    |
| Create listing                   |   ❌   |  ❌  |               ✅                |    ❌    |
| Edit listing                     |   ❌   |  ❌  | ✅ (own, PENDING/REJECTED only) | ✅ (any) |
| Delete listing image             |   ❌   |  ❌  |            ✅ (own)             | ✅ (any) |
| Delete listing                   |   ❌   |  ❌  |            ✅ (own)             | ✅ (any) |
| Approve / Reject / Suspend       |   ❌   |  ❌  |               ❌                |    ✅    |
| View all listings by status      |   ❌   |  ❌  |               ❌                |    ✅    |

---

## 1. Public Endpoints (No Auth Required)

### 1.1 Browse Approved Listings

|            |                             |
| ---------- | --------------------------- |
| **Method** | `GET`                       |
| **URL**    | `{{base_url}}/api/listings` |
| **Auth**   | None                        |

**Optional query params:**

| Param          | Example                   | Description                           |
| -------------- | ------------------------- | ------------------------------------- |
| `page`         | `?page=1`                 | Page number (default: 1)              |
| `limit`        | `?limit=10`               | Items per page (default: 10)          |
| `search`       | `?search=toyota`          | Search title, make, model, about      |
| `make`         | `?make=Toyota`            | Filter by make                        |
| `model`        | `?model=Camry`            | Filter by model                       |
| `fuel`         | `?fuel=PETROL`            | PETROL, DIESEL, ELECTRIC, HYBRID, LPG |
| `transmission` | `?transmission=AUTOMATIC` | MANUAL, AUTOMATIC, SEMI_AUTOMATIC     |
| `condition`    | `?condition=USED`         | NEW, USED                             |
| `minPrice`     | `?minPrice=5000`          | Minimum price                         |
| `maxPrice`     | `?maxPrice=50000`         | Maximum price                         |
| `minYear`      | `?minYear=2018`           | Minimum year                          |
| `maxYear`      | `?maxYear=2024`           | Maximum year                          |

**Example URL with filters:**

```
{{base_url}}/api/listings?make=Toyota&fuel=PETROL&minPrice=10000&maxPrice=30000&page=1&limit=10
```

**Expected Response `200`:**

```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "listing-uuid",
        "title": "2021 Toyota Camry – Excellent Condition",
        "about": "Well maintained car...",
        "price": "25000.00",
        "year": 2021,
        "mileage": 35000,
        "fuel": "PETROL",
        "transmission": "AUTOMATIC",
        "make": "Toyota",
        "model": "Camry",
        "engine": "2.5L 4-Cylinder",
        "horsepower": 203,
        "color": "White",
        "doors": 4,
        "seats": 5,
        "condition": "USED",
        "sellerName": "Noah Motors",
        "address": "123 Main St, Dubai",
        "status": "APPROVED",
        "createdAt": "2026-04-05T08:00:00.000Z",
        "vendor": {
          "id": "vendor-uuid",
          "fullName": "Vendor Name",
          "email": "vendor@example.com",
          "profileImage": null
        },
        "images": [
          {
            "id": "img-uuid",
            "url": "https://backendnoahautomotive.mtscorporate.com/uploads/listings/1234567890.jpg"
          }
        ],
        "_count": { "reviews": 3 }
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

### 1.2 Get Single Listing

|            |                                           |
| ---------- | ----------------------------------------- |
| **Method** | `GET`                                     |
| **URL**    | `{{base_url}}/api/listings/{{listingId}}` |
| **Auth**   | None                                      |

**Expected Response `200`:** _(same shape as single item above)_

---

## 2. Vendor Endpoints

> All require: `Authorization: Bearer {{token}}` (VENDOR role)

### 2.1 View My Listings

|            |                                |
| ---------- | ------------------------------ |
| **Method** | `GET`                          |
| **URL**    | `{{base_url}}/api/listings/my` |
| **Auth**   | `Bearer {{token}}` (VENDOR)    |

**Optional query params:**

| Param    | Example           | Description                            |
| -------- | ----------------- | -------------------------------------- |
| `status` | `?status=PENDING` | PENDING, APPROVED, REJECTED, SUSPENDED |
| `page`   | `?page=1`         | Page number                            |
| `limit`  | `?limit=10`       | Items per page                         |

**Examples:**

```
{{base_url}}/api/listings/my                       → all own listings
{{base_url}}/api/listings/my?status=PENDING        → pending only
{{base_url}}/api/listings/my?status=APPROVED       → approved only
{{base_url}}/api/listings/my?status=REJECTED       → rejected only
```

---

### 2.2 Create Listing

|            |                             |
| ---------- | --------------------------- |
| **Method** | `POST`                      |
| **URL**    | `{{base_url}}/api/listings` |
| **Auth**   | `Bearer {{token}}` (VENDOR) |
| **Body**   | `form-data`                 |

**Body fields:**

| Key            | Type | Required | Example                                                 |
| -------------- | ---- | :------: | ------------------------------------------------------- |
| `title`        | Text |    ✅    | `2021 Toyota Camry – Excellent Condition`               |
| `about`        | Text |    ✅    | `Well maintained, single owner...`                      |
| `price`        | Text |    ✅    | `25000`                                                 |
| `year`         | Text |    ✅    | `2021`                                                  |
| `mileage`      | Text |    ✅    | `35000`                                                 |
| `fuel`         | Text |    ✅    | `PETROL`                                                |
| `transmission` | Text |    ✅    | `AUTOMATIC`                                             |
| `make`         | Text |    ✅    | `Toyota`                                                |
| `model`        | Text |    ✅    | `Camry`                                                 |
| `engine`       | Text |    ✅    | `2.5L 4-Cylinder`                                       |
| `horsepower`   | Text |    ✅    | `203`                                                   |
| `color`        | Text |    ✅    | `White`                                                 |
| `doors`        | Text |    ✅    | `4`                                                     |
| `seats`        | Text |    ✅    | `5`                                                     |
| `condition`    | Text |    ✅    | `USED`                                                  |
| `sellerName`   | Text |    ✅    | `Noah Motors`                                           |
| `address`      | Text |    ✅    | `123 Main St, Dubai`                                    |
| `images`       | File | Optional | Up to **10 images** (jpeg/jpg/png/webp, max 10 MB each) |

> In Postman: set each `images` row to **File** type. Add multiple rows all named `images` to upload multiple files.

**Expected Response `201`:**

```json
{
  "success": true,
  "message": "Listing created and submitted for review",
  "data": { ...listing object with status: "PENDING" }
}
```

> New listings are always `PENDING` until an admin approves them.

Add this to the **Tests** tab to auto-save the listing ID:

```js
const res = pm.response.json();
if (res.data && res.data.id) {
  pm.collectionVariables.set("listingId", res.data.id);
}
```

---

### 2.3 Update Listing

|            |                                                |
| ---------- | ---------------------------------------------- |
| **Method** | `PUT`                                          |
| **URL**    | `{{base_url}}/api/listings/{{listingId}}`      |
| **Auth**   | `Bearer {{token}}` (VENDOR — own listing only) |
| **Body**   | `form-data`                                    |

> Only `PENDING` or `REJECTED` listings can be edited by the vendor.  
> If a `REJECTED` listing is edited, it is automatically reset to `PENDING` for re-review.  
> All fields are optional — only send what you want to change.

**Example body fields (send only what needs updating):**

| Key       | Type | Example                     |
| --------- | ---- | --------------------------- |
| `price`   | Text | `22000`                     |
| `mileage` | Text | `37000`                     |
| `about`   | Text | `Updated description...`    |
| `images`  | File | Additional images to append |

**Expected Response `200`:**

```json
{
  "success": true,
  "message": "Listing updated successfully",
  "data": { ...updated listing object }
}
```

---

### 2.4 Delete a Listing Image

|            |                                                              |
| ---------- | ------------------------------------------------------------ |
| **Method** | `DELETE`                                                     |
| **URL**    | `{{base_url}}/api/listings/{{listingId}}/images/{{imageId}}` |
| **Auth**   | `Bearer {{token}}` (VENDOR — own listing only)               |
| **Body**   | None                                                         |

> Get `imageId` from the `images` array in the listing response.

**Expected Response `200`:**

```json
{
  "success": true,
  "message": "Image deleted"
}
```

---

### 2.5 Delete Listing

|            |                                                |
| ---------- | ---------------------------------------------- |
| **Method** | `DELETE`                                       |
| **URL**    | `{{base_url}}/api/listings/{{listingId}}`      |
| **Auth**   | `Bearer {{token}}` (VENDOR — own listing only) |
| **Body**   | None                                           |

**Expected Response `200`:**

```json
{
  "success": true,
  "message": "Listing deleted successfully"
}
```

---

## 3. Admin Endpoints

> All require: `Authorization: Bearer {{token}}` (ADMIN role)  
> Base path: `/api/admin/listings`

### 3.1 Get Listings (Filter by Status)

|            |                                   |
| ---------- | --------------------------------- |
| **Method** | `GET`                             |
| **URL**    | `{{base_url}}/api/admin/listings` |
| **Auth**   | `Bearer {{token}}` (ADMIN)        |

**Query params:**

| Param    | Example           | Description                                                       |
| -------- | ----------------- | ----------------------------------------------------------------- |
| `status` | `?status=PENDING` | `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED` — omit for **all** |
| `page`   | `?page=1`         | Page number (default: 1)                                          |
| `limit`  | `?limit=10`       | Items per page (default: 10)                                      |

**Examples:**

```
{{base_url}}/api/admin/listings                          → all listings (every status)
{{base_url}}/api/admin/listings?status=PENDING           → pending review
{{base_url}}/api/admin/listings?status=APPROVED          → approved
{{base_url}}/api/admin/listings?status=REJECTED          → rejected
{{base_url}}/api/admin/listings?status=SUSPENDED         → suspended
{{base_url}}/api/admin/listings?status=PENDING&page=2&limit=5
```

**Expected Response `200`:**

```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "listing-uuid",
        "title": "2021 Toyota Camry",
        "status": "PENDING",
        "price": "25000.00",
        "vendor": { "id": "...", "fullName": "...", "email": "..." },
        "images": [{ "id": "...", "url": "..." }],
        "createdAt": "2026-04-05T08:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

> **Invalid status** returns `400`: `Invalid status. Must be one of: PENDING, APPROVED, REJECTED, SUSPENDED`

---

### 3.2 Update Listing Status (Approve / Reject / Suspend)

|            |                                                        |
| ---------- | ------------------------------------------------------ |
| **Method** | `PUT`                                                  |
| **URL**    | `{{base_url}}/api/admin/listings/{{listingId}}/status` |
| **Auth**   | `Bearer {{token}}` (ADMIN)                             |
| **Body**   | `raw → JSON`                                           |

**Body:**

```json
{ "status": "APPROVED" }
```

| `status` value | Effect                                          |
| -------------- | ----------------------------------------------- |
| `APPROVED`     | Listing becomes publicly visible                |
| `REJECTED`     | Vendor is notified; vendor can re-edit & submit |
| `SUSPENDED`    | Listing hidden from public; vendor cannot edit  |
| `PENDING`      | Reset back to pending review                    |

**Expected Response `200`:**

```json
{
  "success": true,
  "message": "Listing approved",
  "data": { ...listing with updated status }
}
```

> **Invalid or missing status** returns `400`: `Invalid status. Must be one of: PENDING, APPROVED, REJECTED, SUSPENDED`

---

### 3.3 Delete Any Listing (Admin)

|            |                                                 |
| ---------- | ----------------------------------------------- |
| **Method** | `DELETE`                                        |
| **URL**    | `{{base_url}}/api/admin/listings/{{listingId}}` |
| **Auth**   | `Bearer {{token}}` (ADMIN)                      |
| **Body**   | None                                            |

---

## 4. Full Test Flow

### Step 1 — Register / Login as VENDOR

```
POST /api/auth/login
Body: { "email": "vendor@example.com", "password": "Password123" }
```

→ Save token to `{{token}}`

### Step 2 — VENDOR creates a listing

```
POST /api/listings
Auth: Bearer {{token}}
Body (form-data): all required fields + images files
```

→ Status is `PENDING`. Save `listingId`.

### Step 3 — VENDOR checks own listings

```
GET /api/listings/my?status=PENDING
Auth: Bearer {{token}}
```

### Step 4 — Login as ADMIN

```
POST /api/auth/login
Body: { "email": "admin@example.com", "password": "AdminPass123" }
```

→ Save to `{{adminToken}}`

### Step 5 — ADMIN reviews pending listings

```
GET /api/admin/listings?status=PENDING
Auth: Bearer {{adminToken}}
```

### Step 6 — ADMIN approves the listing

```
PUT /api/admin/listings/{{listingId}}/status
Auth: Bearer {{adminToken}}
Body (raw JSON): { "status": "APPROVED" }
```

### Step 7 — Public can now browse it

```
GET /api/listings
GET /api/listings/{{listingId}}
```

_(No auth required)_

### Step 8 — ADMIN rejects a listing instead

```
PUT /api/admin/listings/{{listingId}}/status
Auth: Bearer {{adminToken}}
Body (raw JSON): { "status": "REJECTED" }
```

### Step 9 — VENDOR edits a rejected listing (auto-resubmits)

```
PUT /api/listings/{{listingId}}
Auth: Bearer {{vendorToken}}
Body (form-data): updated fields
```

→ Status resets to `PENDING` automatically.

### Step 10 — VENDOR removes an image

```
DELETE /api/listings/{{listingId}}/images/{{imageId}}
Auth: Bearer {{vendorToken}}
```

---

## 5. Error Responses

| Scenario                                  | Status | Message                                                         |
| ----------------------------------------- | ------ | --------------------------------------------------------------- |
| Listing not found (public)                | `404`  | `Listing not found`                                             |
| Vendor editing another vendor's listing   | `403`  | `You can only edit your own listings`                           |
| Vendor editing APPROVED/SUSPENDED listing | `403`  | `You can only edit listings that are PENDING or REJECTED`       |
| Vendor deleting another vendor's listing  | `403`  | `You can only delete your own listings`                         |
| Image not found                           | `404`  | `Image not found`                                               |
| Invalid status filter                     | `400`  | `status must be one of: PENDING, APPROVED, REJECTED, SUSPENDED` |
| File too large (> 10 MB)                  | `413`  | `File too large`                                                |
| Wrong file type                           | `400`  | `Only image files are allowed (jpeg, jpg, png, webp)`           |
| Not authenticated                         | `401`  | `Access token required`                                         |
| Wrong role                                | `403`  | `You do not have permission to perform this action`             |
