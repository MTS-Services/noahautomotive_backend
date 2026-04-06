# Review API Testing Guide (Postman)

> **Base URL:** `https://backendnoahautomotive.mtscorporate.com`  
> **Local URL:** `http://localhost:3000`

---

## Collection Variables

| Variable    | Value                         |
| ----------- | ----------------------------- |
| `base_url`  | `http://localhost:3000`       |
| `token`     | _(user / vendor / admin JWT)_ |
| `listingId` | _(approved listing id)_       |
| `reviewId`  | _(fill after create)_         |

---

## Role Summary

| Action                           | PUBLIC | USER | VENDOR (own listing) | ADMIN |
| -------------------------------- | :----: | :--: | :------------------: | :---: |
| View reviews for a listing       |   ✅   |  ✅  |          ✅          |  ✅   |
| Post a review                    |   ❌   |  ✅  |          ✅          |  ✅   |
| Update own review                |   ❌   |  ✅  |          ✅          |  ✅   |
| Delete own review                |   ❌   |  ✅  |          ✅          |  ✅   |
| Delete any review on own listing |   ❌   |  ❌  |          ✅          |  ✅   |
| View all reviews (all listings)  |   ❌   |  ❌  |          ❌          |  ✅   |
| View reviews on own listings     |   ❌   |  ❌  |          ✅          |  ✅   |

---

## API Overview — 5 Endpoints

| #   | Method | URL                               | Auth                   | Purpose                      |
| --- | ------ | --------------------------------- | ---------------------- | ---------------------------- |
| 1   | GET    | `/api/reviews/listing/:listingId` | None                   | Public: reviews + avg rating |
| 2   | POST   | `/api/reviews/listing/:listingId` | Any logged-in user     | Create review                |
| 3   | PUT    | `/api/reviews/:id`                | Owner only             | Update own review            |
| 4   | DELETE | `/api/reviews/:id`                | Owner / Vendor / Admin | Delete review                |
| 5   | GET    | `/api/reviews`                    | ADMIN or VENDOR        | View reviews dashboard       |

---

## 1. Get Reviews for a Listing (Public)

|            |                                                  |
| ---------- | ------------------------------------------------ |
| **Method** | `GET`                                            |
| **URL**    | `{{base_url}}/api/reviews/listing/{{listingId}}` |
| **Auth**   | None                                             |

**Optional query params:**

| Param   | Example     | Description                  |
| ------- | ----------- | ---------------------------- |
| `page`  | `?page=1`   | Page number (default: 1)     |
| `limit` | `?limit=10` | Items per page (default: 10) |

**Expected Response `200`:**

```json
{
  "success": true,
  "data": {
    "avgRating": 4.5,
    "totalReviews": 12,
    "reviews": [
      {
        "id": "review-uuid",
        "rating": 5,
        "comment": "Excellent car, very well maintained!",
        "createdAt": "2026-04-06T10:00:00.000Z",
        "updatedAt": "2026-04-06T10:00:00.000Z",
        "author": {
          "id": "user-uuid",
          "fullName": "John Doe",
          "profileImage": null
        }
      }
    ],
    "pagination": {
      "total": 12,
      "page": 1,
      "limit": 10,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## 2. Create a Review

|            |                                                  |
| ---------- | ------------------------------------------------ |
| **Method** | `POST`                                           |
| **URL**    | `{{base_url}}/api/reviews/listing/{{listingId}}` |
| **Auth**   | `Bearer {{token}}` (any logged-in user)          |
| **Body**   | `raw → JSON`                                     |

> The listing must be `APPROVED`. One review per user per listing.

**Body:**

```json
{
  "rating": 5,
  "comment": "Amazing car, highly recommend!"
}
```

| Field     | Type   | Required | Notes         |
| --------- | ------ | :------: | ------------- |
| `rating`  | Number |    ✅    | Integer 1 – 5 |
| `comment` | String |    ✅    | Review text   |

**Expected Response `201`:**

```json
{
  "success": true,
  "message": "Review submitted",
  "data": {
    "id": "review-uuid",
    "rating": 5,
    "comment": "Amazing car, highly recommend!",
    "createdAt": "2026-04-06T10:00:00.000Z",
    "updatedAt": "2026-04-06T10:00:00.000Z",
    "author": {
      "id": "user-uuid",
      "fullName": "John Doe",
      "profileImage": null
    }
  }
}
```

Add to **Tests** tab to auto-save the review ID:

```js
const res = pm.response.json();
if (res.data && res.data.id) {
  pm.collectionVariables.set("reviewId", res.data.id);
}
```

**Error — already reviewed `409`:**

```json
{
  "success": false,
  "message": "You have already reviewed this listing"
}
```

---

## 3. Update Own Review

|            |                                         |
| ---------- | --------------------------------------- |
| **Method** | `PUT`                                   |
| **URL**    | `{{base_url}}/api/reviews/{{reviewId}}` |
| **Auth**   | `Bearer {{token}}` (review owner only)  |
| **Body**   | `raw → JSON`                            |

> All fields are optional — only send what you want to change.

**Body:**

```json
{
  "rating": 4,
  "comment": "Updated: really good car overall."
}
```

**Expected Response `200`:**

```json
{
  "success": true,
  "message": "Review updated",
  "data": {
    "id": "review-uuid",
    "rating": 4,
    "comment": "Updated: really good car overall.",
    "createdAt": "2026-04-06T10:00:00.000Z",
    "updatedAt": "2026-04-06T10:05:00.000Z",
    "author": { ... }
  }
}
```

---

## 4. Delete a Review

|            |                                         |
| ---------- | --------------------------------------- |
| **Method** | `DELETE`                                |
| **URL**    | `{{base_url}}/api/reviews/{{reviewId}}` |
| **Auth**   | `Bearer {{token}}`                      |
| **Body**   | None                                    |

**Who can delete:**

| Role   | Condition                       |
| ------ | ------------------------------- |
| USER   | Own review only                 |
| VENDOR | Any review on their own listing |
| ADMIN  | Any review                      |

**Expected Response `200`:**

```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

## 5. View Reviews Dashboard (Admin & Vendor)

|            |                                      |
| ---------- | ------------------------------------ |
| **Method** | `GET`                                |
| **URL**    | `{{base_url}}/api/reviews`           |
| **Auth**   | `Bearer {{token}}` (ADMIN or VENDOR) |

**Query params:**

| Param       | Example           | Who  | Description                           |
| ----------- | ----------------- | ---- | ------------------------------------- |
| `listingId` | `?listingId=uuid` | Both | Filter reviews for a specific listing |
| `page`      | `?page=1`         | Both | Page number                           |
| `limit`     | `?limit=10`       | Both | Items per page                        |

**Behaviour by role:**

| Role   | No filter                   | With `?listingId=`                     |
| ------ | --------------------------- | -------------------------------------- |
| ADMIN  | All reviews                 | All reviews for that listing           |
| VENDOR | Reviews on all own listings | Reviews for that listing (must be own) |

**Example URLs:**

```
{{base_url}}/api/reviews                              → ADMIN: all | VENDOR: all own listings
{{base_url}}/api/reviews?listingId={{listingId}}      → filtered by listing
{{base_url}}/api/reviews?page=2&limit=5
```

**Expected Response `200`:**

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "review-uuid",
        "rating": 5,
        "comment": "Great car!",
        "createdAt": "2026-04-06T10:00:00.000Z",
        "updatedAt": "2026-04-06T10:00:00.000Z",
        "author": {
          "id": "user-uuid",
          "fullName": "John Doe",
          "profileImage": null
        },
        "listing": {
          "id": "listing-uuid",
          "title": "2021 Toyota Camry"
        }
      }
    ],
    "pagination": {
      "total": 20,
      "page": 1,
      "limit": 10,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## Full Test Flow

### Step 1 — Login as a USER

```
POST /api/auth/login
Body: { "email": "user@example.com", "password": "Password123" }
```

→ Save token as `{{token}}`

### Step 2 — Get reviews for a listing (no auth needed)

```
GET /api/reviews/listing/{{listingId}}
```

→ See `avgRating`, `totalReviews`, and review list.

### Step 3 — Post a review

```
POST /api/reviews/listing/{{listingId}}
Auth: Bearer {{token}}
Body: { "rating": 5, "comment": "Excellent condition!" }
```

→ Save `reviewId` from response.

### Step 4 — Update the review

```
PUT /api/reviews/{{reviewId}}
Auth: Bearer {{token}}
Body: { "rating": 4, "comment": "Good car, minor scratches." }
```

### Step 5 — Login as VENDOR, view own listing reviews

```
POST /api/auth/login
Body: { "email": "vendor@example.com", "password": "Password123" }
→ Save as {{vendorToken}}

GET /api/reviews
Auth: Bearer {{vendorToken}}

GET /api/reviews?listingId={{listingId}}
Auth: Bearer {{vendorToken}}
```

### Step 6 — VENDOR deletes a review on own listing

```
DELETE /api/reviews/{{reviewId}}
Auth: Bearer {{vendorToken}}
```

### Step 7 — Login as ADMIN, view all reviews

```
POST /api/auth/login
Body: { "email": "admin@example.com", "password": "AdminPass123" }
→ Save as {{adminToken}}

GET /api/reviews
Auth: Bearer {{adminToken}}

GET /api/reviews?listingId={{listingId}}
Auth: Bearer {{adminToken}}
```

### Step 8 — ADMIN deletes a review

```
DELETE /api/reviews/{{reviewId}}
Auth: Bearer {{adminToken}}
```

---

## Error Reference

| Scenario                              | Status | Message                                             |
| ------------------------------------- | ------ | --------------------------------------------------- |
| Listing not found / not APPROVED      | `404`  | `Listing not found or not available for review`     |
| Already reviewed this listing         | `409`  | `You have already reviewed this listing`            |
| Review not found                      | `404`  | `Review not found`                                  |
| Editing someone else's review         | `403`  | `You can only edit your own reviews`                |
| Deleting without permission           | `403`  | `You do not have permission to delete this review`  |
| Vendor filtering by another's listing | `404`  | `Listing not found or does not belong to you`       |
| Not authenticated                     | `401`  | `Access token required`                             |
| Wrong role for dashboard              | `403`  | `You do not have permission to perform this action` |
