import { useEffect, useMemo, useState } from 'react';
import './App.css';

import RangeGrid from './components/RangeGrid.jsx';
import LayerControls from './components/LayerControls.jsx';
import StatsPanel from './components/StatsPanel.jsx';

import { makeEmptyRange, setHand, computeStats, validateRange } from './range/model.js';
import { createRange, deleteRange, getRange, listRanges, updateRange, validateRangeServer } from './api/ranges.js';

function buildPaintActions(layers) {
  // layers: [{action, pct}] where pct is weight. We build a list of actions summing to 100.
  const nonZero = layers
    .map((l) => ({ action: l.action, weight: Math.max(0, Number(l.pct) || 0) }))
    .filter((x) => x.weight > 0);

  if (nonZero.length === 0) return [{ action: 'FOLD', weight: 100 }];

  const sum = nonZero.reduce((a, x) => a + x.weight, 0);
  const scaled = nonZero.map((x) => ({ ...x, weight: (x.weight / sum) * 100 }));
  const sum2 = scaled.reduce((a, x) => a + x.weight, 0);
  scaled[scaled.length - 1].weight += (100 - sum2);

  return scaled;
}

export default function App() {
  const [range, setRangeState] = useState(() => makeEmptyRange('My Range'));
  const [selectedHand, setSelectedHand] = useState('AKs');
  const [layers, setLayers] = useState([
    { action: 'OPEN', pct: 100 },
    { action: 'CALL', pct: 0 },
    { action: 'FOLD', pct: 0 },
    { action: 'FOLD', pct: 0 },
  ]);

  const [rangesList, setRangesList] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const paintValue = useMemo(() => buildPaintActions(layers), [layers]);
  const stats = useMemo(() => computeStats(range), [range]);

  function setRange(next) {
    setRangeState(next);
  }

  function paint(handKey, actions) {
    setRange((prev) => setHand(prev, handKey, actions));
  }

  async function refreshList() {
    try {
      const list = await listRanges();
      setRangesList(list);
    } catch (e) {
      // backend may be down; ignore
    }
  }

  useEffect(() => {
    refreshList();
  }, []);

  async function onSave() {
    setError('');
    setStatus('Saving...');

    try {
      validateRange(range);
      await validateRangeServer(range);

      if (!activeId) {
        const created = await createRange(range);
        setActiveId(created.id);
        setStatus('Saved (created).');
      } else {
        await updateRange(activeId, range);
        setStatus('Saved (updated).');
      }
      await refreshList();
    } catch (e) {
      setError(String(e.message || e));
      setStatus('');
    }
  }

  async function onLoad(id) {
    setError('');
    setStatus('Loading...');
    try {
      const res = await getRange(id);
      setActiveId(res.id);
      setRange(res.payload);
      setStatus('Loaded.');
    } catch (e) {
      setError(String(e.message || e));
      setStatus('');
    }
  }

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

  function exportJson() {
    const blob = new Blob([JSON.stringify(range, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
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
        setActiveId(null);
        setRange(obj);
        setStatus('Imported JSON.');
      } catch (e) {
        setError(String(e.message || e));
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <div className="title">Poker Range Tool</div>
          <div className="subtitle">React UI + Java API</div>
        </div>

        <div className="section">
          <label className="label">Range name</label>
          <input
            className="textInput"
            value={range.name}
            onChange={(e) => setRange({ ...range, name: e.target.value })}
            placeholder="Range name"
          />
        </div>

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

        <div className="section">
          <label className="label">Paint layers</label>
          <LayerControls layers={layers} setLayers={setLayers} />
        </div>

        <div className="section">
          <label className="label">Stats (client)</label>
          <StatsPanel stats={stats} />
        </div>

        {status ? <div className="status">{status}</div> : null}
        {error ? <div className="error">{error}</div> : null}
      </aside>

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
