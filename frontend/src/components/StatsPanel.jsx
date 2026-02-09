// StatsPanel.jsx
// -----------------------------------------------------------------------------
// Shows basic stats computed from the current range JSON:
// - VPIP (very simplified): sum of all non-FOLD action weights (averaged across hands)
// - Distribution by action
//
// The stats currently come from the frontend computation (range/model.js).
// The backend also exposes a /stats endpoint if you want server-side stats.
// -----------------------------------------------------------------------------

import React from 'react';
import { ACTIONS, ACTION_COLORS } from '../range/actions.js';

export default function StatsPanel({ stats }) {
  return (
    <div className="stats">
      <div className="statsRow">
        <div className="statsTitle">VPIP</div>
        <div className="vpipValue">{stats.vpip.toFixed(1)}%</div>
      </div>

      <div className="statsGrid">
        {ACTIONS.map((a) => (
          <div key={a} className="statItem">
            <span className="swatch" style={{ background: ACTION_COLORS[a] }} />
            <span className="statName">{a}</span>
            <span className="statVal">{(stats.byAction[a] || 0).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
