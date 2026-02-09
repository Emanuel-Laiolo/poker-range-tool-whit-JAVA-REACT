# Range Model (Frontend)

This folder contains the core range data model:
- `hands`: map of handKey -> [{ action, weight }]
- weights are normalized to sum to 100

Used by the UI to paint ranges and compute basic stats (VPIP + per-action distribution).
