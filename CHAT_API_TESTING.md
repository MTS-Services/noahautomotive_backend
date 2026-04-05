# Chat API Testing Guide (Postman)

> **Base URL:** `https://backendnoahautomotive.mtscorporate.com`  
> All routes require: `Authorization: Bearer {{token}}`  
> Works for both **USER** and **VENDOR** roles.

---

## How Chat Works

```
USER ──────────────────────────────────── VENDOR
 │                                           │
 │  POST /conversations { receiverId }       │
 │ ─────────────────────────────────────►   │  ← creates or returns existing conversation
 │                                           │
 │  POST /conversations/:id { content }      │
 │ ─────────────────────────────────────►   │  ← user sends first message
 │                                           │
 │  GET  /conversations                      │
 │                      ◄─────────────────── │  ← vendor sees inbox
 │                                           │
 │                      POST /conversations/:id { content }
 │                      ◄─────────────────── │  ← vendor replies
 │                                           │
 │  PUT  /conversations/:id/read             │
 │ ─────────────────────────────────────►   │  ← user marks messages read
```

- One conversation per pair (no duplicates — calling start twice returns the same one)
- A USER can have conversations with **multiple vendors**
- A VENDOR can have conversations with **multiple users**

---

## Collection Variable

| Variable         | Value                               |
| ---------------- | ----------------------------------- |
| `conversationId` | _(leave empty – fill after step 1)_ |

---

## Endpoints

### 1. Start or Get Conversation

> Call this once to open a chat with another user. If a conversation already exists between you two, it returns the existing one.

|            |                                           |
| ---------- | ----------------------------------------- |
| **Method** | `POST`                                    |
| **URL**    | `{{base_url}}/api/messages/conversations` |
| **Auth**   | `Bearer {{token}}`                        |
| **Body**   | `raw → JSON`                              |

```json
{
  "receiverId": "<the other user's UUID>"
}
```

**Expected Response `201` (new) / `200` (existing):**

```json
{
  "success": true,
  "data": {
    "id": "conv-uuid",
    "createdAt": "2026-04-04T10:00:00.000Z",
    "updatedAt": "2026-04-04T10:00:00.000Z",
    "otherUser": {
      "id": "user-uuid",
      "fullName": "Vendor Name",
      "role": "VENDOR",
      "profileImage": null
    },
    "lastMessage": null,
    "unreadCount": 0
  }
}
```

> Add this script to the **Tests** tab to auto-save the conversation ID:
>
> ```js
> const res = pm.response.json();
> if (res.data && res.data.id) {
>   pm.collectionVariables.set("conversationId", res.data.id);
> }
> ```

---

### 2. List All My Conversations

> Returns all conversations for the logged-in user, sorted by most recent message first.

|            |                                           |
| ---------- | ----------------------------------------- |
| **Method** | `GET`                                     |
| **URL**    | `{{base_url}}/api/messages/conversations` |
| **Auth**   | `Bearer {{token}}`                        |

**Expected Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "conv-uuid",
      "updatedAt": "2026-04-04T10:05:00.000Z",
      "otherUser": {
        "id": "vendor-uuid",
        "fullName": "Vendor Name",
        "role": "VENDOR",
        "profileImage": null
      },
      "lastMessage": {
        "id": "msg-uuid",
        "content": "Hello, is this car available?",
        "createdAt": "2026-04-04T10:05:00.000Z",
        "sender": { "id": "user-uuid", "fullName": "John Doe" }
      },
      "unreadCount": 2
    }
  ]
}
```

---

### 3. Get Messages in a Conversation

> Paginated list of all messages inside a conversation. Oldest first.

|            |                                                              |
| ---------- | ------------------------------------------------------------ |
| **Method** | `GET`                                                        |
| **URL**    | `{{base_url}}/api/messages/conversations/{{conversationId}}` |
| **Auth**   | `Bearer {{token}}`                                           |

**Optional query params:**

| Param   | Default | Example     |
| ------- | ------- | ----------- |
| `page`  | `1`     | `?page=1`   |
| `limit` | `20`    | `?limit=20` |

**Expected Response `200`:**

```json
{
  "success": true,
  "messages": [
    {
      "id": "msg-uuid",
      "content": "Hello, is this car still available?",
      "isRead": true,
      "createdAt": "2026-04-04T10:00:00.000Z",
      "sender": {
        "id": "user-uuid",
        "fullName": "John Doe",
        "role": "USER",
        "profileImage": null
      }
    },
    {
      "id": "msg-uuid-2",
      "content": "Yes, it is! Come visit us anytime.",
      "isRead": false,
      "createdAt": "2026-04-04T10:02:00.000Z",
      "sender": {
        "id": "vendor-uuid",
        "fullName": "Vendor Name",
        "role": "VENDOR",
        "profileImage": null
      }
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### 4. Send a Message

> Send a text message, an image, a video, or both together inside an existing conversation.
> Use **`form-data`** body (not raw JSON) so you can attach a file.

|            |                                                              |
| ---------- | ------------------------------------------------------------ |
| **Method** | `POST`                                                       |
| **URL**    | `{{base_url}}/api/messages/conversations/{{conversationId}}` |
| **Auth**   | `Bearer {{token}}`                                           |
| **Body**   | `form-data`                                                  |

**Body fields:**

| Key       | Type | Required | Notes               |
| --------- | ---- | -------- | ------------------- |
| `content` | Text | Optional | Text of the message |
| `media`   | File | Optional | Image or video file |

> At least one of `content` or `media` must be provided.

**Allowed file types:**

- **Images:** jpeg, jpg, png, webp (max **5 MB** — wait, 50 MB for chat)
- **Videos:** mp4, mov, avi, mkv, webm
- **Max size:** 50 MB

**Example 1 — Text only** (use `form-data` or `raw JSON`):

```
content = "Hello, is this car still available?"
```

**Example 2 — Image only:**

```
media = [attach your image file]
```

**Example 3 — Video only:**

```
media = [attach your video file]
```

**Example 4 — Text + Image together:**

```
content = "Here's what I'm looking for"
media   = [attach your image file]
```

**Expected Response `201`:**

```json
{
  "success": true,
  "data": {
    "id": "msg-uuid",
    "content": "Hello, is this car still available?",
    "mediaUrl": null,
    "mediaType": null,
    "senderId": "user-uuid",
    "receiverId": "vendor-uuid",
    "conversationId": "conv-uuid",
    "isRead": false,
    "createdAt": "2026-04-04T10:05:00.000Z",
    "sender": {
      "id": "user-uuid",
      "fullName": "John Doe",
      "role": "USER",
      "profileImage": null
    }
  }
}
```

**When a file is sent, `mediaUrl` and `mediaType` are populated:**

```json
{
  "success": true,
  "data": {
    "id": "msg-uuid",
    "content": null,
    "mediaUrl": "https://backendnoahautomotive.mtscorporate.com/uploads/chat/1712232300000-123456789.jpg",
    "mediaType": "image",
    "senderId": "user-uuid",
    "receiverId": "vendor-uuid",
    "conversationId": "conv-uuid",
    "isRead": false,
    "createdAt": "2026-04-04T10:05:00.000Z",
    "sender": {
      "id": "user-uuid",
      "fullName": "John Doe",
      "role": "USER",
      "profileImage": null
    }
  }
}
```

---

### 5. Mark Messages as Read

> Marks all **received** (unread) messages in the conversation as read. Call this when the user opens a conversation.

|            |                                                                   |
| ---------- | ----------------------------------------------------------------- |
| **Method** | `PUT`                                                             |
| **URL**    | `{{base_url}}/api/messages/conversations/{{conversationId}}/read` |
| **Auth**   | `Bearer {{token}}`                                                |
| **Body**   | none                                                              |

**Expected Response `200`:**

```json
{
  "success": true,
  "markedRead": 3
}
```

> `markedRead` is the number of messages that were marked as read. `0` means all were already read.

---

## Full Test Flow (Two Users)

### Setup

- Register or log in as a **USER** → save token as `{{token}}`
- Register or log in as a **VENDOR** → note their UUID (from GET `/api/users/:id` or admin member list)

### Step 1 — USER starts a conversation with VENDOR

```
POST /api/messages/conversations
Auth: Bearer {{userToken}}
Body: { "receiverId": "<vendor-uuid>" }
```

→ Save `conversationId` from response

### Step 2 — USER sends a text message

```
POST /api/messages/conversations/{{conversationId}}
Auth: Bearer {{userToken}}
Body (form-data):
  content = "Hi! Is the Toyota Camry still available?"
```

### Step 2b — USER sends an image

```
POST /api/messages/conversations/{{conversationId}}
Auth: Bearer {{userToken}}
Body (form-data):
  media = [select image file]
```

### Step 2c — USER sends a video

```
POST /api/messages/conversations/{{conversationId}}
Auth: Bearer {{userToken}}
Body (form-data):
  media = [select video file]
```

### Step 3 — VENDOR checks their inbox

```
GET /api/messages/conversations
Auth: Bearer {{vendorToken}}
```

→ See the conversation with `unreadCount: 1`

### Step 4 — VENDOR opens the conversation

```
GET /api/messages/conversations/{{conversationId}}
Auth: Bearer {{vendorToken}}
```

### Step 5 — VENDOR marks messages as read

```
PUT /api/messages/conversations/{{conversationId}}/read
Auth: Bearer {{vendorToken}}
```

### Step 6 — VENDOR replies with text + image

```
POST /api/messages/conversations/{{conversationId}}
Auth: Bearer {{vendorToken}}
Body (form-data):
  content = "Yes it is! Come by anytime between 9am-5pm."
  media   = [optional: attach a photo of the car]
```

### Step 7 — USER reads the reply

```
PUT /api/messages/conversations/{{conversationId}}/read
Auth: Bearer {{userToken}}
```

---

## Error Responses

| Scenario                                   | Status | Message                                          |
| ------------------------------------------ | ------ | ------------------------------------------------ |
| Missing `receiverId`                       | `400`  | `receiverId is required`                         |
| Chatting with yourself                     | `400`  | `You cannot start a conversation with yourself`  |
| Receiver not found                         | `404`  | `User not found`                                 |
| Receiver deactivated                       | `403`  | `This user's account is deactivated`             |
| Conversation not found / not a participant | `404`  | `Conversation not found`                         |
| No content and no file                     | `400`  | `Message must have content or a media file`      |
| Invalid file type                          | `400`  | `Only images (...) and videos (...) are allowed` |
| File too large (> 50 MB)                   | `413`  | `File too large`                                 |
| Not logged in                              | `401`  | `Access token required`                          |
