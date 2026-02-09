# Poker Range Tool (Java + React)

A demo-friendly full-stack project:
- **Frontend:** React + Vite (13x13 range grid + multi-action weights)
- **Backend:** Spring Boot (CRUD for ranges + validation + stats)
- **Tooling:** includes a Python range builder (`tools/range_builder/builder.py`) to generate realistic JSON quickly

## Run (dev)

### 1) Backend (Java)
From `backend/`:

```bash
./mvnw spring-boot:run
```

- API: `http://localhost:8080/api/ranges`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

### 2) Frontend (React)
From `frontend/`:

```bash
npm install
npm run dev
```

Open the URL printed by Vite.

## Data format
A range payload is:

```json
{
  "name": "BTN open",
  "hands": {
    "AKs": [{"action":"OPEN","weight":100}],
    "A5s": [{"action":"OPEN","weight":50},{"action":"FOLD","weight":50}]
  }
}
```

## Interview notes
- `INTERVIEW_ROADMAP.md`
- `docs/ROADMAP_JAVA_REACT_API.md` (how React connects to Java API)
