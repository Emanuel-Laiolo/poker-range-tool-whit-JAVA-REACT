const RANKS = 'AKQJT98765432'.split('');

export function allHands13x13() {
  const hands = [];
  for (let i = 0; i < RANKS.length; i++) {
    for (let j = 0; j < RANKS.length; j++) {
      const r1 = RANKS[i];
      const r2 = RANKS[j];

      let hand;
      if (i < j) hand = `${r1}${r2}s`;
      else if (i > j) hand = `${r2}${r1}o`;
      else hand = `${r1}${r2}`;

      hands.push({ row: i, col: j, hand, r1, r2 });
    }
  }
  return { ranks: RANKS, hands };
}

export function isValidHandKey(key) {
  // Very lightweight check, enough for demo.
  // Examples: AA, AKs, AKo, 72o
  if (typeof key !== 'string') return false;
  if (key.length < 2 || key.length > 3) return false;
  const a = key[0];
  const b = key[1];
  if (!RANKS.includes(a) || !RANKS.includes(b)) return false;
  if (key.length === 3 && !['s', 'o'].includes(key[2])) return false;
  return true;
}
