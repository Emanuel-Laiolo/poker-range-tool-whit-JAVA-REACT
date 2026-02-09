import React from 'react';
import { ACTIONS, ACTION_COLORS } from '../range/actions.js';

function ActionButton({ action, active, onClick }) {
  return (
    <button
      className={"actionBtn" + (active ? ' active' : '')}
      style={{ borderColor: ACTION_COLORS[action], color: active ? '#0b1220' : '#e5e7eb', background: active ? ACTION_COLORS[action] : 'transparent' }}
      onClick={onClick}
      type="button"
    >
      {action}
    </button>
  );
}

export default function LayerControls({ layers, setLayers }) {
  return (
    <div className="layers">
      {layers.map((layer, idx) => (
        <div key={idx} className="layerCard">
          <div className="layerHeader">
            <div className="layerTitle">Layer {idx + 1}</div>
            <input
              className="pctInput"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={layer.pct}
              onChange={(e) => {
                const pct = Number(e.target.value);
                setLayers((prev) => prev.map((x, i) => (i === idx ? { ...x, pct: Number.isFinite(pct) ? pct : 0 } : x)));
              }}
            />
          </div>
          <div className="actionGrid">
            {ACTIONS.map((a) => (
              <ActionButton
                key={a}
                action={a}
                active={layer.action === a}
                onClick={() => setLayers((prev) => prev.map((x, i) => (i === idx ? { ...x, action: a } : x)))}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
