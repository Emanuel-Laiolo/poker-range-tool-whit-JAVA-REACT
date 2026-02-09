// FILE: App.jsx
// TYPE: React function component module
//
// Contains:
// - buildPaintActions()  -> FUNCTION
// - App()                -> REACT COMPONENT (function component)

import { useEffect, useMemo, useState } from 'react';
import './App.css';

// UI components (reusable pieces)
import RangeGrid from './components/RangeGrid.jsx';
import LayerControls from './components/LayerControls.jsx';
import StatsPanel from './components/StatsPanel.jsx';

// Pure "model" functions (no UI): validation, normalization, stats
import { makeEmptyRange, setHand, computeStats, validateRange } from './range/model.js';

// API client functions to call Java backend
import { createRange, deleteRange, getRange, listRanges, updateRange, validateRangeServer } from './api/ranges.js';

/**
 * Convert the 4 layer controls into the actual payload we paint into a hand.
 *
 * layers = [
 *   { action: 'OPEN', pct: 100 },
 *   { action: 'CALL', pct: 0 },
 *   ...
 * ]
 *
 * The output must be an array of `{ action, weight }` where weights sum to 100.
 */
// FUNCTION: converts sidebar layers -> paint actions (weights sum to 100)
function buildPaintActions(layers) {
  const nonZero = layers
    .map((l) => ({ action: l.action, weight: Math.max(0, Number(l.pct) || 0) }))
    .filter((x) => x.weight > 0);

  // If user set all weights to 0, default to 100% FOLD.
  if (nonZero.length === 0) return [{ action: 'FOLD', weight: 100 }];

  // Normalize so sum = 100.
  const sum = nonZero.reduce((a, x) => a + x.weight, 0);
  const scaled = nonZero.map((x) => ({ ...x, weight: (x.weight / sum) * 100 }));

  // Fix floating point rounding by adjusting last.
  const sum2 = scaled.reduce((a, x) => a + x.weight, 0);
  scaled[scaled.length - 1].weight += (100 - sum2);

  return scaled;
}

// REACT COMPONENT (function component)
export default function App() {
  // ----------------------
  // State (frontend source of truth while editing)
  // ----------------------

  // Main range JSON in memory.
  // Shape:
  // {
  //   name: string,
  //   hands: { [handKey: string]: [{action, weight}, ...] }
  // }
  // HOOK: useState (state variable + setter)
  const [range, setRangeState] = useState(() => makeEmptyRange('My Range'));

  // HOOK: useState
  const [selectedHand, setSelectedHand] = useState('AKs');

  // HOOK: useState (array state)
  const [layers, setLayers] = useState([
    { action: 'OPEN', pct: 100 },
    { action: 'CALL', pct: 0 },
    { action: 'FOLD', pct: 0 },
    { action: 'FOLD', pct: 0 },
  ]);

  // Backend-related UI state:
  const [rangesList, setRangesList] = useState([]); // dropdown list from API
  const [activeId, setActiveId] = useState(null); // UUID of loaded range (if any)

  // UI feedback
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  // ----------------------
  // Derived values (computed from state)
  // ----------------------

  // What we paint into a hand when clicking on the grid.
  // HOOK: useMemo (derived value)
  const paintValue = useMemo(() => buildPaintActions(layers), [layers]);

  // HOOK: useMemo (derived value)
  const stats = useMemo(() => computeStats(range), [range]);

  // Helper setter: lets us pass functions into setRange.
  function setRange(next) {
    setRangeState(next);
  }

  // Paint a single hand.
  // This updates state, which triggers UI re-render.
  function paint(handKey, actions) {
    setRange((prev) => setHand(prev, handKey, actions));
  }

  // ----------------------
  // Backend calls
  // ----------------------

  async function refreshList() {
    try {
      const list = await listRanges();
      setRangesList(list);
    } catch (e) {
      // Backend may be down; ignore so frontend still works offline.
    }
  }

  // HOOK: useEffect (runs after first render)
  useEffect(() => {
    refreshList();
  }, []);

  /** Save = validate + create/update in backend */
  async function onSave() {
    setError('');
    setStatus('Saving...');

    try {
      // Local validation (fast feedback)
      validateRange(range);

      // Server validation (backend is source of truth)
      await validateRangeServer(range);

      if (!activeId) {
        // Not loaded from backend => create new range.
        const created = await createRange(range);
        setActiveId(created.id);
        setStatus('Saved (created).');
      } else {
        // Already exists => update existing range.
        await updateRange(activeId, range);
        setStatus('Saved (updated).');
      }

      await refreshList();
    } catch (e) {
      setError(String(e.message || e));
      setStatus('');
    }
  }

  /** Load a range from backend by ID */
  async function onLoad(id) {
    setError('');
    setStatus('Loading...');
    try {
      const res = await getRange(id);
      setActiveId(res.id);
      setRange(res.payload); // important: backend returns payload under res.payload
      setStatus('Loaded.');
    } catch (e) {
      setError(String(e.message || e));
      setStatus('');
    }
  }

  /** Delete current loaded range */
  async function onDelete() {
    if (!activeId) return;
    if (!confirm('Delete this range?')) return;

    setError('');
    setStatus('Deleting...');
    try {
      await deleteRange(activeId);
      setActiveId(null);
      setRange(makeEmptyRange('My Range'));
      setStatus('Deleted.');
      await refreshList();
    } catch (e) {
      setError(String(e.message || e));
      setStatus('');
    }
  }

  // ----------------------
  // Import / Export
  // ----------------------

  function exportJson() {
    const blob = new Blob([JSON.stringify(range, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create a fake <a> click to download a JSON file.
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(range.name || 'range').replaceAll(' ', '_')}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  function importJson(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result));
        validateRange(obj);

        // importing JSON means we are no longer tied to backend record id.
        setActiveId(null);
        setRange(obj);
        setStatus('Imported JSON.');
      } catch (e) {
        setError(String(e.message || e));
      }
    };
    reader.readAsText(file);
  }

  // ----------------------
  // Render
  // ----------------------

  return (
    <div className="appShell">
      {/* LEFT sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="title">Poker Range Tool</div>
          <div className="subtitle">React UI + Java API</div>
        </div>

        {/* Range name */}
        <div className="section">
          <label className="label">Range name</label>
          <input
            className="textInput"
            value={range.name}
            onChange={(e) => setRange({ ...range, name: e.target.value })}
            placeholder="Range name"
          />
        </div>

        {/* Backend list/load/save */}
        <div className="section">
          <label className="label">Saved ranges (backend)</label>
          <div className="row">
            <select
              className="select"
              value={activeId || ''}
              onChange={(e) => {
                const id = e.target.value || null;
                if (id) onLoad(id);
              }}
            >
              <option value="">(not loaded)</option>
              {rangesList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="row gap">
            <button className="btn primary" onClick={onSave}>Save</button>
            <button className="btn" onClick={onDelete} disabled={!activeId}>Delete</button>
          </div>
        </div>

        {/* Import / Export */}
        <div className="section">
          <div className="row gap">
            <button className="btn" onClick={exportJson}>Export JSON</button>
            <label className="btn fileBtn">
              Import JSON
              <input
                type="file"
                accept="application/json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importJson(f);
                  e.target.value = '';
                }}
                hidden
              />
            </label>
          </div>
        </div>

        {/* The 4 layers (similar to python builder) */}
        <div className="section">
          <label className="label">Paint layers</label>
          <LayerControls layers={layers} setLayers={setLayers} />
        </div>

        {/* Stats */}
        <div className="section">
          <label className="label">Stats (client)</label>
          <StatsPanel stats={stats} />
        </div>

        {status ? <div className="status">{status}</div> : null}
        {error ? <div className="error">{error}</div> : null}
      </aside>

      {/* RIGHT side main content */}
      <main className="main">
        <div className="mainHeader">
          <div>
            <div className="mainTitle">Grid</div>
            <div className="mainSub">Left click to paint. Drag to paint multiple hands. Right click to select.</div>
          </div>
          <div className="handInfo">
            <div className="handLabel">Selected: <strong>{selectedHand}</strong></div>
          </div>
        </div>

        {/* Grid is a component that receives props (range, callbacks, selectedHand). */}
        <RangeGrid
          range={range}
          onPaint={paint}
          paintValue={paintValue}
          onSelectHand={setSelectedHand}
          selectedHand={selectedHand}
        />
      </main>
    </div>
  );
}
