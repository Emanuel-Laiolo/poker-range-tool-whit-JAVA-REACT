# Roadmap: How React connects to the Java API

This doc explains **how the frontend (React) and backend (Java/Spring Boot) connect** in this project.

## Big picture

```
Browser (React UI)  --->  HTTP requests  --->  Spring Boot (Java API)  --->  DB (H2)
        |                                  |
        |<---------- JSON responses -------|
```

### Who does what?
- **React (frontend)**
  - Renders the 13x13 poker grid.
  - Lets the user *paint* hands with actions + weights.
  - Holds the current range in React state (`range`).
  - Exports/imports range JSON.
  - Calls the backend to **save/load** ranges.

- **Spring Boot (backend)**
  - Exposes REST endpoints under `/api/*`.
  - Validates the JSON contract (weights sum to 100 per hand, no duplicates, etc.).
  - Stores the range in a database (H2) so it persists.
  - Returns ranges back to the frontend.

## JSON contract (shared format)
The range payload is the same in frontend and backend:

```json
{
  "name": "BTN open",
  "hands": {
    "AKs": [{"action":"OPEN","weight":100}],
    "A5s": [{"action":"OPEN","weight":50},{"action":"FOLD","weight":50}]
  }
}
```

Full spec: `docs/range-format.md`

## Local dev routing (important)
### Frontend dev server (Vite)
- Runs on: `http://localhost:5173` (typical)

### Backend
- Runs on: `http://localhost:8080`

### Proxy
In development, Vite proxies `/api` to Spring Boot.
That means in React you can call:
- `fetch('/api/ranges')`

…and it will be forwarded to:
- `http://localhost:8080/api/ranges`

Proxy config: `frontend/vite.config.js`

## Endpoints
All endpoints are in `RangeController`:

- `POST /api/ranges` (create)
- `PUT /api/ranges/{id}` (update)
- `GET /api/ranges/{id}` (get)
- `GET /api/ranges` (list)
- `DELETE /api/ranges/{id}` (delete)
- `POST /api/ranges/validate` (validate-only)
- `POST /api/ranges/stats` (compute VPIP + action distribution)

Swagger UI:
- `http://localhost:8080/swagger-ui.html`

## Frontend call flow (Save)
1) User clicks **Save**
2) React validates locally: `validateRange(range)`
3) React validates on server: `POST /api/ranges/validate`
4) If ok:
   - create: `POST /api/ranges`
   - update: `PUT /api/ranges/{id}`
5) React refreshes dropdown list: `GET /api/ranges`

## Backend validation flow
1) Spring Boot receives JSON payload in a DTO (`RangePayloadDto`).
2) Bean validation checks required fields (`@NotBlank`, etc.).
3) Custom validation (`RangeValidator`) checks:
   - each hand has actions
   - weights sum to 100
   - no duplicate actions per hand

## Persistence
- Stored as a `RangeEntity`.
- Payload is saved as JSON text (string) in the DB.
- H2 file is stored under `backend/data/`.

## Why this architecture is good for interviews
- Clear separation: UI (React) vs API (Java).
- Contract-first: shared JSON format.
- Real validation + persistence.
- Easy to demo end-to-end.
