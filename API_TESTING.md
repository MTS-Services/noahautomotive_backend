# Noah Automotive – API Testing Guide (Postman)

> **Local URL:** `http://localhost:3000`  
> **Live URL:** `https://backendnoahautomotive.mtscorporate.com`  
> All protected routes require the header: `Authorization: Bearer {{token}}`

---

## Setup in Postman

1. Create a **Collection** named `Noah Automotive`.
2. In the collection **Variables** tab, add:

   | Variable     | Initial Value                                    |
   | ------------ | ------------------------------------------------ |
   | `base_url`   | `https://backendnoahautomotive.mtscorporate.com` |
   | `token`      | _(leave empty – auto-filled after login)_        |
   | `resetToken` | _(leave empty – auto-filled after verify-otp)_   |

3. On **Login** and **Register** requests, add this to the **Tests** tab to auto-save the auth token:
   ```js
   const res = pm.response.json();
   if (res.data && res.data.token) {
     pm.collectionVariables.set("token", res.data.token);
   }
   ```
4. On the **Verify OTP** request, add this to the **Tests** tab to auto-save the reset token:
   ```js
   const res = pm.response.json();
   if (res.data && res.data.resetToken) {
     pm.collectionVariables.set("resetToken", res.data.resetToken);
   }
   ```
5. For all protected requests set the **Authorization** header to: `Bearer {{token}}`

---

## 1. Auth

### 1.1 Register (User)

|            |                                  |
| ---------- | -------------------------------- |
| **Method** | `POST`                           |
| **URL**    | `{{base_url}}/api/auth/register` |
| **Body**   | `form-data`                      |

**Body fields:**

| Key          | Type | Required | Example                     |
| ------------ | ---- | -------- | --------------------------- |
| fullName     | Text | ✅       | `John Doe`                  |
| email        | Text | ✅       | `john@example.com`          |
| password     | Text | ✅       | `secret123`                 |
| phoneNumber  | Text | ❌       | `+1 555 000 1111`           |
| address      | Text | ❌       | `123 Main St, NY`           |
| role         | Text | ❌       | `USER` / `VENDOR` / `ADMIN` |
| profileImage | File | ❌       | _(upload image)_            |

**Expected Response `201`:**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "id": "...", "fullName": "John Doe", "email": "john@example.com", "role": "USER", ... },
    "token": "<jwt>"
  }
}
```

---

### 1.2 Register (Vendor)

Same as 1.1 but set `role` = `VENDOR`.

---

### 1.3 Register (Admin)

Same as 1.1 but set `role` = `ADMIN`.

> Keep admin credentials safe. Only share the Admin `token` with trusted users.

---

### 1.3 Login

|            |                               |
| ---------- | ----------------------------- |
| **Method** | `POST`                        |
| **URL**    | `{{base_url}}/api/auth/login` |
| **Body**   | `raw → JSON`                  |

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Expected Response `200`:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "<jwt>"
  }
}
```

> Paste the `Tests` script from the Setup section to auto-save the token.

---

### 1.4 Get My Profile

|            |                            |
| ---------- | -------------------------- |
| **Method** | `GET`                      |
| **URL**    | `{{base_url}}/api/auth/me` |
| **Auth**   | `Bearer {{token}}`         |

**Expected Response `200`:**

```json
{
  "success": true,
  "data": { "id": "...", "fullName": "...", "email": "...", "role": "USER", ... }
}
```

---

### 1.5 Forgot Password

|            |                                         |
| ---------- | --------------------------------------- |
| **Method** | `POST`                                  |
| **URL**    | `{{base_url}}/api/auth/forgot-password` |
| **Body**   | `raw → JSON`                            |

```json
{
  "email": "john@example.com"
}
```

**Expected Response `200`:**

```json
{
  "success": true,
  "message": "OTP sent to your email address"
}
```

---

### 1.6 Verify OTP

|            |                                    |
| ---------- | ---------------------------------- |
| **Method** | `POST`                             |
| **URL**    | `{{base_url}}/api/auth/verify-otp` |
| **Body**   | `raw → JSON`                       |

```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Expected Response `200`:**

```json
{
  "success": true,
  "message": "OTP verified successfully. You can now reset your password.",
  "data": { "resetToken": "<short-lived jwt valid 15 min>" }
}
```

> Add this to the **Tests** tab to auto-save the reset token:
>
> ```js
> const res = pm.response.json();
> if (res.data && res.data.resetToken) {
>   pm.collectionVariables.set("resetToken", res.data.resetToken);
> }
> ```

---

### 1.7 Reset Password

|            |                                        |
| ---------- | -------------------------------------- |
| **Method** | `POST`                                 |
| **URL**    | `{{base_url}}/api/auth/reset-password` |
| **Body**   | `raw → JSON`                           |

> ⚠️ **Postman — Authorization header override required for this request:**
>
> 1. Open this request → **Authorization** tab
> 2. Set Type to **Bearer Token**
> 3. Set Token to `{{resetToken}}` (NOT `{{token}}`)
>
> This overrides the collection-level auth which uses the login token.

```json
{
  "newPassword": "newSecret456",
  "confirmedPassword": "newSecret456"
}
```

**Expected Response `200`:**

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Validation rules:**

- `Authorization` header – `Bearer {{resetToken}}` from step 1.6 (expires in **15 minutes**)
- `newPassword` – minimum 6 characters
- `confirmedPassword` – must match `newPassword`

---

## 2. Listings (Public)

### 2.1 Browse / Filter Listings

|            |                             |
| ---------- | --------------------------- |
| **Method** | `GET`                       |
| **URL**    | `{{base_url}}/api/listings` |

**Query params (all optional):**

| Param        | Example    | Description                         |
| ------------ | ---------- | ----------------------------------- |
| page         | `1`        | Page number                         |
| limit        | `10`       | Items per page                      |
| search       | `BMW`      | Keyword search                      |
| make         | `BMW`      | Filter by make                      |
| model        | `3 Series` | Filter by model                     |
| fuel         | `PETROL`   | `PETROL/DIESEL/ELECTRIC/HYBRID/LPG` |
| transmission | `MANUAL`   | `MANUAL/AUTOMATIC/SEMI_AUTOMATIC`   |
| condition    | `NEW`      | `NEW/USED`                          |
| minPrice     | `10000`    | Min price                           |
| maxPrice     | `50000`    | Max price                           |
| minYear      | `2018`     | Min year                            |
| maxYear      | `2024`     | Max year                            |
| minMileage   | `0`        | Min mileage                         |
| maxMileage   | `50000`    | Max mileage                         |

---

### 2.2 Get Single Listing

|            |                                 |
| ---------- | ------------------------------- |
| **Method** | `GET`                           |
| **URL**    | `{{base_url}}/api/listings/:id` |

---

## 3. Listings (Vendor – requires `VENDOR` role)

### 3.1 Create Listing

|            |                             |
| ---------- | --------------------------- |
| **Method** | `POST`                      |
| **URL**    | `{{base_url}}/api/listings` |
| **Auth**   | `Bearer {{token}}`          |
| **Body**   | `form-data`                 |

**Body fields:**

| Key          | Type | Required | Example                     |
| ------------ | ---- | -------- | --------------------------- |
| title        | Text | ✅       | `2022 BMW 3 Series M Sport` |
| about        | Text | ✅       | `Description of the car...` |
| price        | Text | ✅       | `42500`                     |
| year         | Text | ✅       | `2022`                      |
| mileage      | Text | ✅       | `8000`                      |
| fuel         | Text | ✅       | `ELECTRIC`                  |
| transmission | Text | ✅       | `AUTOMATIC`                 |
| make         | Text | ✅       | `BMW`                       |
| model        | Text | ✅       | `3 Series`                  |
| engine       | Text | ✅       | `Dual Motor Electric`       |
| horsepower   | Text | ✅       | `346`                       |
| color        | Text | ✅       | `Pearl White`               |
| doors        | Text | ✅       | `4`                         |
| seats        | Text | ✅       | `5`                         |
| condition    | Text | ✅       | `NEW`                       |
| sellerName   | Text | ✅       | `EV Motors`                 |
| address      | Text | ✅       | `Manchester, UK`            |
| images       | File | ✅       | _(upload 1–10 images)_      |

---

### 3.2 Get My Listings

|            |                                |
| ---------- | ------------------------------ |
| **Method** | `GET`                          |
| **URL**    | `{{base_url}}/api/listings/my` |
| **Auth**   | `Bearer {{token}}`             |

**Query params:** `page`, `limit`, `status` (`PENDING/APPROVED/REJECTED/SUSPENDED`)

---

### 3.3 Update Listing

|            |                                                   |
| ---------- | ------------------------------------------------- |
| **Method** | `PUT`                                             |
| **URL**    | `{{base_url}}/api/listings/:id`                   |
| **Auth**   | `Bearer {{token}}`                                |
| **Body**   | `form-data` (same fields as create, all optional) |

---

### 3.4 Delete Listing

|            |                                 |
| ---------- | ------------------------------- |
| **Method** | `DELETE`                        |
| **URL**    | `{{base_url}}/api/listings/:id` |
| **Auth**   | `Bearer {{token}}`              |

---

## 4. User

### 4.1 Get Seller / User Profile (Public)

|            |                              |
| ---------- | ---------------------------- |
| **Method** | `GET`                        |
| **URL**    | `{{base_url}}/api/users/:id` |

---

### 4.2 Update Own Profile

|            |                                  |
| ---------- | -------------------------------- |
| **Method** | `PUT`                            |
| **URL**    | `{{base_url}}/api/users/profile` |
| **Auth**   | `Bearer {{token}}`               |
| **Body**   | `form-data`                      |

| Key          | Type | Example           |
| ------------ | ---- | ----------------- |
| fullName     | Text | `Jane Doe`        |
| phoneNumber  | Text | `+1 555 999 0000` |
| address      | Text | `456 Oak Ave`     |
| profileImage | File | _(upload image)_  |

---

### 4.3 Change Password

|            |                                   |
| ---------- | --------------------------------- |
| **Method** | `PUT`                             |
| **URL**    | `{{base_url}}/api/users/password` |
| **Auth**   | `Bearer {{token}}`                |
| **Body**   | `raw → JSON`                      |

```json
{
  "oldPassword": "secret123",
  "newPassword": "newSecret456",
  "confirmedPassword": "newSecret456"
}
```

---

## 5. Reviews

### 5.1 Get Reviews for a Listing (Public)

|            |                                               |
| ---------- | --------------------------------------------- |
| **Method** | `GET`                                         |
| **URL**    | `{{base_url}}/api/reviews/listing/:listingId` |

**Query params:** `page`, `limit`

---

### 5.2 Create Review

|            |                                               |
| ---------- | --------------------------------------------- |
| **Method** | `POST`                                        |
| **URL**    | `{{base_url}}/api/reviews/listing/:listingId` |
| **Auth**   | `Bearer {{token}}`                            |
| **Body**   | `raw → JSON`                                  |

```json
{
  "rating": 5,
  "comment": "Great car, seller was very helpful!"
}
```

---

### 5.3 Update Review

|            |                                |
| ---------- | ------------------------------ |
| **Method** | `PUT`                          |
| **URL**    | `{{base_url}}/api/reviews/:id` |
| **Auth**   | `Bearer {{token}}`             |
| **Body**   | `raw → JSON`                   |

```json
{
  "rating": 4,
  "comment": "Updated review text"
}
```

---

### 5.4 Delete Review

|            |                                |
| ---------- | ------------------------------ |
| **Method** | `DELETE`                       |
| **URL**    | `{{base_url}}/api/reviews/:id` |
| **Auth**   | `Bearer {{token}}`             |

---

## 6. Messages

### 6.1 Get My Conversations

|            |                                           |
| ---------- | ----------------------------------------- |
| **Method** | `GET`                                     |
| **URL**    | `{{base_url}}/api/messages/conversations` |
| **Auth**   | `Bearer {{token}}`                        |

---

### 6.2 Start or Get Conversation

|            |                                           |
| ---------- | ----------------------------------------- |
| **Method** | `POST`                                    |
| **URL**    | `{{base_url}}/api/messages/conversations` |
| **Auth**   | `Bearer {{token}}`                        |
| **Body**   | `raw → JSON`                              |

```json
{
  "participantId": "<other-user-id>"
}
```

---

### 6.3 Get Messages in a Conversation

|            |                                               |
| ---------- | --------------------------------------------- |
| **Method** | `GET`                                         |
| **URL**    | `{{base_url}}/api/messages/conversations/:id` |
| **Auth**   | `Bearer {{token}}`                            |

---

### 6.4 Send a Message

|            |                                               |
| ---------- | --------------------------------------------- |
| **Method** | `POST`                                        |
| **URL**    | `{{base_url}}/api/messages/conversations/:id` |
| **Auth**   | `Bearer {{token}}`                            |
| **Body**   | `raw → JSON`                                  |

```json
{
  "content": "Hello, is this car still available?"
}
```

---

### 6.5 Mark Messages as Read

|            |                                                    |
| ---------- | -------------------------------------------------- |
| **Method** | `PUT`                                              |
| **URL**    | `{{base_url}}/api/messages/conversations/:id/read` |
| **Auth**   | `Bearer {{token}}`                                 |

---

## 7. Admin (requires `ADMIN` role)

> Register with `role = ADMIN` to get an admin account, then login to get your `{{token}}`.

---

### 7.1 Get Members (Users and/or Vendors)

|            |                                  |
| ---------- | -------------------------------- |
| **Method** | `GET`                            |
| **URL**    | `{{base_url}}/api/admin/members` |
| **Auth**   | `Bearer {{token}}` (ADMIN)       |

**Query params:**

| Param | Example | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| role  | `USER`  | Filter by role: `USER`, `VENDOR`, or omit for both |
| page  | `1`     | Page number (default 1)                            |
| limit | `10`    | Items per page (default 10)                        |

**Examples:**

- All members: `GET /api/admin/members`
- Only users: `GET /api/admin/members?role=USER`
- Only vendors: `GET /api/admin/members?role=VENDOR`

**Expected Response `200`:**

```json
{
  "success": true,
  "data": {
    "members": [
      { "id": "...", "fullName": "...", "email": "...", "role": "USER", "isActive": true, "_count": { "listings": 0 }, ... },
      { "id": "...", "fullName": "...", "email": "...", "role": "VENDOR", "isActive": true, "_count": { "listings": 5 }, ... }
    ],
    "pagination": { "total": 70, "page": 1, "limit": 10, "totalPages": 7 }
  }
}
```

---

### 7.2 Get Member by ID

|            |                                      |
| ---------- | ------------------------------------ |
| **Method** | `GET`                                |
| **URL**    | `{{base_url}}/api/admin/members/:id` |
| **Auth**   | `Bearer {{token}}` (ADMIN)           |

> Works for both USER and VENDOR — just pass their `id`.

---

### 7.3 Update Member

|            |                                      |
| ---------- | ------------------------------------ |
| **Method** | `PUT`                                |
| **URL**    | `{{base_url}}/api/admin/members/:id` |
| **Auth**   | `Bearer {{token}}` (ADMIN)           |
| **Body**   | `raw → JSON`                         |

All fields are optional — send only what you want to change:

```json
{
  "fullName": "Updated Name",
  "email": "newemail@example.com",
  "phoneNumber": "+1 555 111 2222",
  "address": "New Address",
  "role": "VENDOR",
  "isActive": false,
  "password": "newpassword123"
}
```

**Expected Response `200`:**

```json
{
  "success": true,
  "message": "Member updated successfully",
  "data": { "id": "...", "fullName": "Updated Name", "role": "VENDOR", ... }
}
```

---

### 7.4 Delete Member

|            |                                      |
| ---------- | ------------------------------------ |
| **Method** | `DELETE`                             |
| **URL**    | `{{base_url}}/api/admin/members/:id` |
| **Auth**   | `Bearer {{token}}` (ADMIN)           |

> Works for both USER and VENDOR.

**Expected Response `200`:**

```json
{ "success": true, "message": "User deleted successfully" }
```

---

### 7.5 Get Requested (Pending) Listings

|            |                                   |
| ---------- | --------------------------------- |
| **Method** | `GET`                             |
| **URL**    | `{{base_url}}/api/admin/listings` |
| **Auth**   | `Bearer {{token}}` (ADMIN)        |

**Query params:** `page`, `limit`

---

### 7.6 Get Approved Listings

|            |                                            |
| ---------- | ------------------------------------------ |
| **Method** | `GET`                                      |
| **URL**    | `{{base_url}}/api/admin/listings/approved` |
| **Auth**   | `Bearer {{token}}` (ADMIN)                 |

---

### 7.7 Get Suspended Listings

|            |                                             |
| ---------- | ------------------------------------------- |
| **Method** | `GET`                                       |
| **URL**    | `{{base_url}}/api/admin/listings/suspended` |
| **Auth**   | `Bearer {{token}}` (ADMIN)                  |

---

### 7.8 Approve a Listing

|            |                                               |
| ---------- | --------------------------------------------- |
| **Method** | `PUT`                                         |
| **URL**    | `{{base_url}}/api/admin/listings/:id/approve` |
| **Auth**   | `Bearer {{token}}` (ADMIN)                    |

---

### 7.9 Suspend a Listing

|            |                                               |
| ---------- | --------------------------------------------- |
| **Method** | `PUT`                                         |
| **URL**    | `{{base_url}}/api/admin/listings/:id/suspend` |
| **Auth**   | `Bearer {{token}}` (ADMIN)                    |

---

### 7.10 Delete a Listing (Admin)

|            |                                       |
| ---------- | ------------------------------------- |
| **Method** | `DELETE`                              |
| **URL**    | `{{base_url}}/api/admin/listings/:id` |
| **Auth**   | `Bearer {{token}}` (ADMIN)            |

---

## Common Error Responses

| Status | Meaning                                  |
| ------ | ---------------------------------------- |
| `400`  | Bad request / validation error           |
| `401`  | Missing or invalid token                 |
| `403`  | Forbidden – insufficient role            |
| `404`  | Resource not found                       |
| `409`  | Conflict – e.g. email already registered |
| `413`  | File too large (max 5 MB)                |
| `500`  | Internal server error                    |

---

## Health Check

|            |                       |
| ---------- | --------------------- |
| **Method** | `GET`                 |
| **URL**    | `{{base_url}}/health` |

```json
{
  "success": true,
  "message": "Noah Automotive API is running"
}
```
