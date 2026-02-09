# Range JSON Format (Contract)

This repo uses a *contract-first* JSON payload shared by:
- **React UI** (range editor)
- **Java backend** (validation + persistence)

## Shape

```json
{
  "name": "BTN open",
  "hands": {
    "AKs": [{"action":"OPEN","weight":100}],
    "A5s": [{"action":"OPEN","weight":50},{"action":"FOLD","weight":50}],
    "22":  [{"action":"OPEN","weight":100}]
  }
}
```

### Hands
- Keys are strings like: `AA`, `AKs`, `AKo`, `72o`.
- Each hand maps to **a list** of `{ action, weight }` objects.

### Weights
- `weight` is a number between 0 and 100.
- For each hand, the **sum of weights must be 100**.

### Actions
Actions are:
- `FOLD`
- `OPEN`
- `CALL`
- `CALL3B`
- `RAISE`
- `OVERBET`
- `BET3`
- `BET4`
- `BET5`
- `ALLIN`

## Validation rules (backend)
- Each hand must have at least 1 action.
- No duplicate actions per hand.
- Weights must sum to 100.

## Endpoints
- `POST /api/ranges` create
- `PUT /api/ranges/{id}` update
- `GET /api/ranges/{id}` get
- `GET /api/ranges` list
- `DELETE /api/ranges/{id}` delete
- `POST /api/ranges/validate` validate only
- `POST /api/ranges/stats` compute VPIP and per-action distribution

Swagger UI:
- `http://localhost:8080/swagger-ui.html`
