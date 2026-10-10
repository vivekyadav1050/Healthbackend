# AP-20 Patient Monitoring Backend

Node.js 20+, Express, MongoDB/Mongoose, JWT and JavaScript ES Modules.

## 1. Setup

```bash
npm install
```

Copy `.env.example` to `.env`, then set a strong `JWT_SECRET` (32+ characters) and `ADMIN_PASSWORD` (12+ characters). Start MongoDB locally or use a MongoDB Atlas connection string.

```bash
npm run dev
```

Production-style start:

```bash
npm start
```

Base URL: `http://localhost:5000`

Health check: `GET /api/health`

## 2. Roles

- `admin`: credentials come from `.env`; the admin is not stored in MongoDB. Can create/list/activate/deactivate users.
- `tablet`: logs in, registers one tablet, assigns/deactivates its patients and uploads readings.
- `monitor`: views all active patients and patient histories.

All protected routes require `Authorization: Bearer YOUR_TOKEN`.

## 3. API list

| Method | Endpoint | Role |
|---|---|---|
| POST | `/api/auth/login` | Public, rate limited |
| POST | `/api/admin/users` | admin |
| GET | `/api/admin/users` | admin |
| PATCH | `/api/admin/users/:userId/status` | admin |
| POST | `/api/tablets/register` | tablet |
| GET | `/api/tablets/me` | tablet |
| POST | `/api/tablets/:tabletId/patient` | tablet |
| PATCH | `/api/patients/:patientId/status` | tablet owner |
| POST | `/api/monitoring` | tablet |
| GET | `/api/monitoring/active-patients` | monitor |
| GET | `/api/monitoring/patients/:patientId/latest` | tablet owner or monitor |
| GET | `/api/monitoring/patients/:patientId?range=1h` | tablet owner or monitor |
| GET | `/api/monitoring/patients/:patientId/history?page=1&limit=100` | tablet owner or monitor |

## 4. Postman test order

### A. Admin login
`POST /api/auth/login`
```json
{"username":"admin","password":"YOUR_ADMIN_PASSWORD"}
```
Copy `token` and use it as Bearer token for admin APIs.

### B. Create accounts
`POST /api/admin/users`
```json
{"username":"tabletuser01","password":"StrongPassword123!","role":"tablet"}
```
Create another tablet account and a monitor:
```json
{"username":"monitor01","password":"StrongPassword456!","role":"monitor"}
```
Passwords must have at least 12 characters.

### C. Login as tablet
`POST /api/auth/login`
```json
{"username":"tabletuser01","password":"StrongPassword123!"}
```
Save its token.

### D. Register device
`POST /api/tablets/register`
```json
{"deviceKey":"android-stable-device-key-123456"}
```
Repeat the same request with the same token/key: it should return the same tablet ID. A different key for that account returns 409.

### E. Assign patient
`POST /api/tablets/TAB-RETURNED-ID/patient`
```json
{"patientName":"Rahul Sharma","age":45,"sex":"male","date":"2026-10-09"}
```
Use the actual `tabletId` returned by registration.

### F. Upload readings
`POST /api/monitoring`
```json
{
  "tabletId":"TAB-RETURNED-ID",
  "readings":[
    {
      "recordId":"reading-20261009-120000-001",
      "timestamp":"2026-10-09T12:00:00.000Z",
      "spo2":98,
      "pulseRate":72,
      "perfusionIndex":4.2,
      "batteryLevel":87,
      "probeStatus":"connected"
    }
  ]
}
```
Send the same record again to check duplicate handling.

### G. Read patient data
- Latest: `GET /api/monitoring/patients/PAT-RETURNED-ID/latest`
- Last hour: `GET /api/monitoring/patients/PAT-RETURNED-ID?range=1h`
- Full history: `GET /api/monitoring/patients/PAT-RETURNED-ID/history?page=1&limit=100`

Use the actual patient ID returned by patient assignment.

### H. Monitor dashboard
Login as `monitor01`, then call:
`GET /api/monitoring/active-patients`

The monitor token should see active patients across active tablets. The admin token should get 403 on this endpoint.

### I. Patient change
Deactivate old patient:
`PATCH /api/patients/PAT-RETURNED-ID/status`
```json
{"isActive":false}
```
Then assign the new patient. The old patient and its readings remain in MongoDB and remain accessible in history.

### J. Account deactivation
Admin calls:
`PATCH /api/admin/users/USER_OBJECT_ID/status`
```json
{"isActive":false}
```
That account cannot log in or use protected endpoints.

## 5. Important notes

- Never commit `.env`.
- Keep AP-20 measurements as received; do not replace missing measurements with invented values.
- Reading history has no automatic deletion job.
- Device status is calculated from `lastSeenAt` and `DEVICE_ONLINE_TIMEOUT_SECONDS`.
- This is a starting implementation and should receive integration/security tests before use with real patient data.
