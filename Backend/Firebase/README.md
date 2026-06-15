# Backend: Firebase Configuration and Services

Since this project follows a serverless architecture, the entire backend is managed by **Google Firebase**. This folder contains the configuration details and documentation for the backend components.

## Backend Infrastructure Overview

- **Authentication**: Firebase Authentication manages user login, registration (Hirer and Worker roles), password reset, and session persistence.
- **Database**: Firebase Realtime Database (RTDB) serves as the primary database, utilizing a JSON-based structure for low-latency updates and synchronization across client apps.
- **Storage**: Firebase Storage (configured via the Firebase project) is used for storing profile photos, voice recordings, and application assets.

---

## Firebase Configuration

The raw SDK initialization configuration can be found in [Firebase Config.txt](file:///c:/Users/dines/OneDrive/Desktop/Work-Link%20web/Backend/Firebase/Firebase%20Config.txt).

Both the Mobile App (`Frontend/Mobile/services/firebase.ts`) and the Web App (`Frontend/Web/src/services/firebase.ts`) initialize Firebase using these environment values:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyBUDqFMFgnjQv5qeXuo-mbjWRJL__c_08g",
  authDomain: "work-link-fd090.firebaseapp.com",
  projectId: "work-link-fd090",
  storageBucket: "work-link-fd090.firebasestorage.app",
  messagingSenderId: "214054433844",
  appId: "1:214054433844:web:4e7832eb6557a561de8661",
  measurementId: "G-K3JBJ41GH1",
  databaseURL: "https://work-link-fd090-default-rtdb.asia-southeast1.firebasedatabase.app"
};
```

---

## Database Schema (Realtime Database JSON Tree)

The Realtime Database is structured under the following main paths:

### 1. `users/`
Stores user profile information.
- Key: User UUID (`uid` from Firebase Auth)
- Value:
  ```json
  {
    "uid": "string",
    "name": "string",
    "email": "string",
    "phoneNumber": "string",
    "role": "hirer" | "worker",
    "category": "string (optional, for workers)",
    "profileUrl": "string (base64 image or storage URL)",
    "createdAt": "timestamp"
  }
  ```

### 2. `jobs/`
Stores job postings created by Hirers.
- Key: Job ID (`jobId`)
- Value:
  ```json
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "category": "string",
    "budget": "string/number",
    "location": "string",
    "status": "open" | "active" | "closed" | "completed",
    "hirerUid": "string",
    "hirerName": "string",
    "hirerPhoneNumber": "string",
    "createdAt": "timestamp"
  }
  ```

### 3. `workerPosts/`
Stores worker availability/portfolio posts.
- Key: Post ID (`workerPostId`)
- Value:
  ```json
  {
    "id": "string",
    "workerUid": "string",
    "workerName": "string",
    "title": "string",
    "skills": "string",
    "rate": "string/number",
    "category": "string",
    "location": "string",
    "createdAt": "timestamp"
  }
  ```

### 4. `requests/`
Stores job requests or job applications between Hirers and Workers.
- Key: Request ID (`requestId`)
- Value:
  ```json
  {
    "id": "string",
    "jobId": "string (optional)",
    "workerPostId": "string (optional)",
    "jobTitle": "string",
    "senderId": "string",
    "receiverId": "string",
    "senderName": "string",
    "status": "pending" | "accepted" | "rejected",
    "workerPhoneNumber": "string",
    "hirerPhoneNumber": "string",
    "createdAt": "timestamp"
  }
  ```

### 5. `chats/`
Stores direct message conversations.
- Key: Chat ID (`chatId`, usually combined: `uid1_uid2` or request/job ID)
- Value:
  ```json
  {
    "messages": {
      "messageId": {
        "id": "string",
        "senderId": "string",
        "senderName": "string",
        "text": "string (or '[Voice Message]')",
        "voiceUrl": "string (base64 or storage URL, if voice message)",
        "timestamp": "timestamp"
      }
    }
  }
  ```

### 6. `notifications/`
Stores system notifications for users.
- Key: User UUID (`uid`) -> Notification ID
- Value:
  ```json
  {
    "id": "string",
    "title": "string",
    "message": "string",
    "type": "request" | "chat" | "alert",
    "senderId": "string",
    "senderName": "string",
    "requestId": "string (optional)",
    "read": "boolean",
    "timestamp": "timestamp"
  }
  ```

---

## Cascading Deletions and Logic

When a job or availability post is deleted via the **Manage Reports** interface:
1. The post under `jobs/{id}` or `workerPosts/{id}` is removed.
2. All items in `requests/` referencing that post (`jobId` or `workerPostId`) are identified and removed.
3. Related `chats/` between the parties are cleaned up.
