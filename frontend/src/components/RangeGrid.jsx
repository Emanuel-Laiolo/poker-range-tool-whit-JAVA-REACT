// RangeGrid.jsx
// -----------------------------------------------------------------------------
// Renders the 13x13 poker hand grid.
//
// Props:
// - range: the full range JSON
// - onPaint(handKey, paintValue): callback to paint a hand
// - paintValue: [{action, weight}, ...] that should be applied to a hand
// - onSelectHand(handKey): optional callback when user selects a hand
// - selectedHand: which hand is currently selected (for UI highlight)
//
// UI behavior:
// - Left click paints the cell.
// - Drag (mouse enter with button pressed) paints multiple hands.
// - Right click selects a cell without painting.
//
// Each cell background is a linear gradient (stacked colors) representing the
// action weights (e.g. 50% OPEN + 50% FOLD).
// -----------------------------------------------------------------------------

import React from 'react';
import { allHands13x13 } from '../range/grid.js';
import { ACTION_COLORS } from '../range/actions.js';
import { getHand } from '../range/model.js';

const { hands } = allHands13x13();

function stackedBackground(actions) {
  // actions: [{action, weight}] sum=100
  const stops = [];
  let acc = 0;
  for (const a of actions) {
    const c = ACTION_COLORS[a.action] || '#999';
    const start = acc;
    const end = acc + a.weight;
    stops.push(`${c} ${start}% ${end}%`);
    acc = end;
  }
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

export default function RangeGrid({ range, onPaint, paintValue, onSelectHand, selectedHand }) {
  return (
    <div className="grid">
      {hands.map(({ hand }) => {
        // Pull the actions for this hand from the range object.
        // If missing, default is 100% FOLD.
        const actions = getHand(range, hand);

        // Build the background gradient.
        const bg = stackedBackground(actions);

        // Selected highlight
        const isSelected = selectedHand === hand;

        return (
          <button
            key={hand}
            className={"cell" + (isSelected ? ' selected' : '')}
            style={{ background: bg }}
            onMouseDown={(e) => {
              // prevent text selection / drag weirdness
              e.preventDefault();

              // paint the clicked hand
              onPaint(hand, paintValue);

              // select it for UI
              onSelectHand?.(hand);
            }}
            onMouseEnter={(e) => {
              // When dragging with left mouse pressed (buttons===1), keep painting.
              if (e.buttons === 1) onPaint(hand, paintValue);
            }}
            onContextMenu={(e) => {
              // Right click: select without painting
              e.preventDefault();
              onSelectHand?.(hand);
            }}
            title={hand}
          >
            <div className="cellLabel">{hand}</div>
          </button>
        );
      })}
    </div>
  );
}
