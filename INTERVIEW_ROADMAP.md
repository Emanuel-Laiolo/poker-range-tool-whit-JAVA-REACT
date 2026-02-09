# Poker Range Tool (Java + React) — Interview Roadmap

This is a short, *demo-friendly* plan you can use to explain what you built and what you would build next.

## 0) What exists today (show quickly)
- **Frontend:** React + Vite scaffold (`frontend/`).
- **Backend:** Spring Boot skeleton folder (`backend/`) (currently minimal).
- **Range Builder tool:** Python desktop app copied into the repo:
  - `tools/range_builder/builder.py`

### 30-second story
> “I’m building a Poker Range Tool with a React UI and a Java backend. To accelerate creating real range data, I included my Python Range Builder app that exports JSON. Next steps are defining a JSON format contract, then building endpoints and UI around it.”

---

## 1) Demo plan (what to show live)
### A) Show the Python range builder (fast)
1. Open: `tools/range_builder/builder.py`
2. Explain in one line: “This tool lets me paint ranges and export them as JSON.”
3. Export an example JSON.

### B) Show the React app structure
- `frontend/src/App.jsx` — explain: “This will become the range viewer/editor UI.”

### C) Explain the contract-driven approach
- “First I define the **range JSON schema** (actions + weights per hand). Then both frontend and backend follow it.”

---

## 2) Next changes (roadmap of the project)

### Phase 1 — Define data contract (1–2 hours)
- Create a shared spec file, e.g. `docs/range-format.md`.
- Decide a stable shape, example:
  ```json
  {
    "name": "BTN vs BB SRP",
    "hands": {
      "AKs": [{"action": "OPEN", "weight": 100}],
      "A5s": [{"action": "OPEN", "weight": 50}, {"action": "FOLD", "weight": 50}]
    }
  }
  ```
- Add validation rules (weights sum to 100, allowed actions, etc.).

What this proves in interview:
- You think about **interfaces/contracts** between systems.

### Phase 2 — Backend (Java / Spring Boot) API (half day)
Build a minimal REST API:
- `POST /ranges` → save range JSON
- `GET /ranges/{id}` → fetch saved range
- `GET /ranges` → list ranges

Add basic validation + good error responses:
- 400 for invalid data, 404 missing, 200 success.

What this proves:
- You can build a clean API and validate input.

### Phase 3 — Frontend (React) viewer/editor (half day)
- Render a 13x13 grid.
- Load range data from backend.
- Color cells based on action/weight.

What this proves:
- Component thinking, state management, and UI mapping from data.

### Phase 4 — Quality + polish (optional)
- Add simple tests (backend unit tests, frontend basic tests).
- Add export/import buttons.
- Add README with `how to run`.

---

## 3) Talking points to use in the interview
- “I started with a working tool (Python) to generate realistic data quickly.”
- “Then I move to a contract-first approach: define JSON format, validate it, and build around it.”
- “React renders based on data; backend enforces rules and persistence.”

---

## 4) How to run the Python builder (local)
From repo root:
```bash
python3 tools/range_builder/builder.py
```

(If tkinter is missing on your system, install it via your OS package manager.)
