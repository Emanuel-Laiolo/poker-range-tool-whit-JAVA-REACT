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
        const actions = getHand(range, hand);
        const bg = stackedBackground(actions);
        const isSelected = selectedHand === hand;

        return (
          <button
            key={hand}
            className={"cell" + (isSelected ? ' selected' : '')}
            style={{ background: bg }}
            onMouseDown={(e) => {
              e.preventDefault();
              onPaint(hand, paintValue);
              onSelectHand?.(hand);
            }}
            onMouseEnter={(e) => {
              if (e.buttons === 1) onPaint(hand, paintValue);
            }}
            onContextMenu={(e) => {
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
