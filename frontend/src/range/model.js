// range/model.js
// -----------------------------------------------------------------------------
// Pure JavaScript "domain logic" for ranges.
//
// This file has NO React. That is intentional.
// It makes the logic testable and reusable.
//
// Responsibilities:
// - normalize actions (valid actions, weights 0..100, sum to 100)
// - validate range contract
// - compute simple stats (VPIP + distribution)
//
// Range object shape:
// {
//   name: string,
//   hands: {
//     "AKs": [ { action: "OPEN", weight: 100 } ],
//     "A5s": [ { action: "OPEN", weight: 50 }, { action: "FOLD", weight: 50 } ]
//   }
// }
// -----------------------------------------------------------------------------

import { ACTIONS, VPIP_ACTIONS } from './actions.js';
import { isValidHandKey } from './grid.js';

export function emptyHand() {
  // Default: if a hand has no data, we treat it as 100% fold.
  return [{ action: 'FOLD', weight: 100 }];
}

export function normalizeHandActions(actions) {
  // Defensive programming: ensure a valid list.
  if (!Array.isArray(actions) || actions.length === 0) return emptyHand();

  // Clean the list:
  // - keep only known actions
  // - avoid duplicates
  // - clamp weight to 0..100
  const cleaned = [];
  const seen = new Set();

  for (const a of actions) {
    if (!a || typeof a !== 'object') continue;

    const action = String(a.action || '').toUpperCase();
    if (!ACTIONS.includes(action)) continue;

    // skip duplicates (e.g. two OPEN entries)
    if (seen.has(action)) continue;
    seen.add(action);

    const w = Number(a.weight);
    const weight = Number.isFinite(w) ? Math.max(0, Math.min(100, w)) : 0;

    cleaned.push({ action, weight });
  }

  if (cleaned.length === 0) return emptyHand();

  // Normalize sum to 100
  const sum = cleaned.reduce((acc, x) => acc + x.weight, 0);
  if (sum <= 0) return emptyHand();

  const scaled = cleaned.map((x) => ({ ...x, weight: (x.weight / sum) * 100 }));

  // Fix floating point drift: adjust last element so total becomes exactly 100.
  const sum2 = scaled.reduce((acc, x) => acc + x.weight, 0);
  const diff = 100 - sum2;
  scaled[scaled.length - 1].weight += diff;

  return scaled;
}

export function makeEmptyRange(name = 'Untitled Range') {
  // Start with no hands.
  // Missing hands are treated as 100% fold by getHand().
  return { name, hands: {} };
}

export function setHand(range, handKey, actions) {
  // Immutable update: create new objects instead of mutating.
  if (!isValidHandKey(handKey)) return range;

  const next = { ...range, hands: { ...range.hands } };
  next.hands[handKey] = normalizeHandActions(actions);
  return next;
}

export function getHand(range, handKey) {
  // Return normalized actions for a hand (or default fold).
  const actions = range?.hands?.[handKey];
  return normalizeHandActions(actions);
}

export function computeStats(range) {
  // Compute average % distribution of actions across all hands in the payload.
  const hands = range?.hands || {};
  const keys = Object.keys(hands);

  // If nothing painted yet, all stats are 0.
  if (keys.length === 0) {
    const byAction = Object.fromEntries(ACTIONS.map((a) => [a, 0]));
    return { vpip: 0, byAction };
  }

  const byAction = Object.fromEntries(ACTIONS.map((a) => [a, 0]));

  // Add weights
  for (const k of keys) {
    const actions = normalizeHandActions(hands[k]);
    for (const a of actions) {
      byAction[a.action] += a.weight;
    }
  }

  // Convert totals -> average per hand
  for (const a of ACTIONS) {
    byAction[a] = byAction[a] / keys.length;
  }

  // VPIP = any non-FOLD action (very simplified)
  let vpip = 0;
  for (const a of VPIP_ACTIONS) vpip += byAction[a] || 0;

  return { vpip, byAction };
}

export function validateRange(range) {
  // Validate basic structure.
  if (!range || typeof range !== 'object') throw new Error('Range must be an object');
  if (!range.name || typeof range.name !== 'string') throw new Error('Range name required');
  if (!range.hands || typeof range.hands !== 'object') throw new Error('Range hands must be an object');

  // Validate each hand.
  for (const [hand, actions] of Object.entries(range.hands)) {
    if (!isValidHandKey(hand)) throw new Error(`Invalid hand key: ${hand}`);

    const normalized = normalizeHandActions(actions);
    const sum = normalized.reduce((acc, x) => acc + x.weight, 0);

    if (Math.abs(sum - 100) > 0.001) {
      throw new Error(`Hand ${hand} weights do not sum to 100`);
    }
  }

  return true;
}
