export const ACTIONS = [
  'FOLD',
  'OPEN',
  'CALL',
  'CALL3B',
  'RAISE',
  'OVERBET',
  'BET3',
  'BET4',
  'BET5',
  'ALLIN',
];

export const ACTION_COLORS = {
  FOLD: '#e0e0e0',
  OPEN: '#4CAF50',
  CALL: '#2196F3',
  CALL3B: '#00BCD4',
  RAISE: '#ff9800',
  OVERBET: '#8B0000',
  BET3: '#f44336',
  BET4: '#9C27B0',
  BET5: '#E91E63',
  ALLIN: '#FFD700',
};

export const VPIP_ACTIONS = ACTIONS.filter((a) => a !== 'FOLD');
