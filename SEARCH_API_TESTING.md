# Listing Search & Filter API — Postman Testing Guide

> **Base URL:** `https://backendnoahautomotive.mtscorporate.com`  
> **Local URL:** `http://localhost:3000`  
> **Auth:** None required — works for logged-in and guest users alike.

---

## Endpoint

| Method | URL             | Auth          |
| ------ | --------------- | ------------- |
| `GET`  | `/api/listings` | None (public) |

---

## All Query Parameters

| Parameter      | Type   | Example                   | Description                                    |
| -------------- | ------ | ------------------------- | ---------------------------------------------- |
| `search`       | string | `?search=toyota`          | Full-text search on title, make, model, about  |
| `make`         | string | `?make=Toyota`            | Filter by car make                             |
| `model`        | string | `?model=Corolla`          | Filter by car model                            |
| `condition`    | string | `?condition=USED`         | `NEW` or `USED`                                |
| `fuel`         | string | `?fuel=PETROL`            | `PETROL` `DIESEL` `ELECTRIC` `HYBRID` `LPG`    |
| `transmission` | string | `?transmission=AUTOMATIC` | `MANUAL` `AUTOMATIC` `SEMI_AUTOMATIC`          |
| `minPrice`     | number | `?minPrice=10000`         | Minimum price                                  |
| `maxPrice`     | number | `?maxPrice=40000`         | Maximum price                                  |
| `minYear`      | number | `?minYear=2020`           | Minimum manufacture year                       |
| `maxYear`      | number | `?maxYear=2025`           | Maximum manufacture year                       |
| `minMileage`   | number | `?minMileage=0`           | Minimum mileage (km)                           |
| `maxMileage`   | number | `?maxMileage=50000`       | Maximum mileage (km)                           |
| `minEngine`    | number | `?minEngine=100`          | Minimum horsepower                             |
| `maxEngine`    | number | `?maxEngine=400`          | Maximum horsepower                             |
| `minSeats`     | number | `?minSeats=4`             | Minimum number of seats                        |
| `maxSeats`     | number | `?maxSeats=5`             | Maximum number of seats                        |
| `sortBy`       | string | `?sortBy=price`           | `price` `year` `mileage` `createdAt` (default) |
| `sortOrder`    | string | `?sortOrder=asc`          | `asc` or `desc` (default: `desc`)              |
| `page`         | number | `?page=1`                 | Page number (default: 1)                       |
| `limit`        | number | `?limit=10`               | Items per page (default: 10)                   |

---

## Price Range Examples

| Label           | Query                            |
| --------------- | -------------------------------- |
| All prices      | _(no price params)_              |
| Under 10,000    | `?maxPrice=10000`                |
| 10,000 – 20,000 | `?minPrice=10000&maxPrice=20000` |
| 20,000 – 40,000 | `?minPrice=20000&maxPrice=40000` |
| 40,000 – 60,000 | `?minPrice=40000&maxPrice=60000` |
| Above 60,000    | `?minPrice=60000`                |

---

## Year Range Examples

| Label        | Query                        |
| ------------ | ---------------------------- |
| Year 2025    | `?minYear=2025&maxYear=2025` |
| Year 2024    | `?minYear=2024&maxYear=2024` |
| Year 2023    | `?minYear=2023&maxYear=2023` |
| Year 2022    | `?minYear=2022&maxYear=2022` |
| Year 2021    | `?minYear=2021&maxYear=2021` |
| Year 2020    | `?minYear=2020&maxYear=2020` |
| Under 2020   | `?maxYear=2019`              |
| Custom range | `?minYear=2018&maxYear=2023` |

---

## Seats Examples

| Label   | Query                    |
| ------- | ------------------------ |
| 2 seats | `?minSeats=2&maxSeats=2` |
| 4 seats | `?minSeats=4&maxSeats=4` |
| 5 seats | `?minSeats=5&maxSeats=5` |
| 6 seats | `?minSeats=6&maxSeats=6` |
| Above 6 | `?minSeats=7`            |

---

## Mileage Range Examples

| Label           | Query                                |
| --------------- | ------------------------------------ |
| Under 10,000 km | `?maxMileage=10000`                  |
| 10,000 – 50,000 | `?minMileage=10000&maxMileage=50000` |
| Above 100,000   | `?minMileage=100000`                 |

---

## Engine / Horsepower Examples

| Label        | Query                          |
| ------------ | ------------------------------ |
| Under 150 hp | `?maxEngine=150`               |
| 150 – 300 hp | `?minEngine=150&maxEngine=300` |
| Above 400 hp | `?minEngine=400`               |

---

## Sorting Examples

| Label             | Query                                          |
| ----------------- | ---------------------------------------------- |
| Newest first      | `?sortBy=createdAt&sortOrder=desc` _(default)_ |
| Oldest first      | `?sortBy=createdAt&sortOrder=asc`              |
| Price low → high  | `?sortBy=price&sortOrder=asc`                  |
| Price high → low  | `?sortBy=price&sortOrder=desc`                 |
| Year newest first | `?sortBy=year&sortOrder=desc`                  |
| Lowest mileage    | `?sortBy=mileage&sortOrder=asc`                |

---

## Make & Model Reference

**Make values:**
`Honda` `BMW` `Audi` `Land Rover` `Ford` `Tesla` `Kia` `Hyundai` `Mercedes-Benz` `Toyota`

**Model values:**
`Civic` `3 Series` `A6` `Range Rover` `Mustang` `Model 3` `Sportage` `Tucson` `C-Class` `Corolla`

---

## Ready-to-Use Postman Examples

### 1. All approved listings (default)

```
GET {{base_url}}/api/listings
```

### 2. Search by keyword

```
GET {{base_url}}/api/listings?search=BMW
```

### 3. Filter by make + fuel

```
GET {{base_url}}/api/listings?make=Toyota&fuel=PETROL
```

### 4. Price range: 10,000 – 40,000

```
GET {{base_url}}/api/listings?minPrice=10000&maxPrice=40000
```

### 5. Year range: 2020 – 2024

```
GET {{base_url}}/api/listings?minYear=2020&maxYear=2024
```

### 6. Under 2020 + USED condition

```
GET {{base_url}}/api/listings?maxYear=2019&condition=USED
```

### 7. Electric cars, sorted by price low to high

```
GET {{base_url}}/api/listings?fuel=ELECTRIC&sortBy=price&sortOrder=asc
```

### 8. Automatic transmission + 5 seats

```
GET {{base_url}}/api/listings?transmission=AUTOMATIC&minSeats=5&maxSeats=5
```

### 9. Mileage under 30,000 km + condition NEW

```
GET {{base_url}}/api/listings?maxMileage=30000&condition=NEW
```

### 10. Full combined filter

```
GET {{base_url}}/api/listings?make=BMW&fuel=PETROL&transmission=AUTOMATIC&condition=USED&minPrice=20000&maxPrice=60000&minYear=2020&maxYear=2024&maxMileage=50000&minSeats=4&maxSeats=5&sortBy=price&sortOrder=asc&page=1&limit=10
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
        "title": "2021 Toyota Camry – Excellent Condition",
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
        "status": "APPROVED",
        "sellerName": "Noah Motors",
        "address": "123 Main St, Dubai",
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
            "url": "https://backendnoahautomotive.mtscorporate.com/uploads/listings/filename.jpg"
          }
        ],
        "_count": { "reviews": 3 }
      }
    ],
    "pagination": {
      "total": 24,
      "page": 1,
      "limit": 10,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## Error Reference

| Scenario                  | Status | Message              |
| ------------------------- | ------ | -------------------- |
| No listings match filters | `200`  | Empty `listings: []` |
| Invalid page / limit      | `200`  | Defaults to 1 / 10   |
