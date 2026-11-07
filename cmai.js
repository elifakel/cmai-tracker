// CMAI (Cohen-Mansfield Agitation Inventory) – 29 items in 4 groups.
// Totals range 29–203; each item is rated 1–7 by frequency over the period.

export const PERIOD_DAYS = 14;

export const GROUPS = [
  { id: 'pa', name: 'Physical / Aggressive', short: 'Physical · Aggr.', fg: '#C2410C', bg: '#FFEDE5', fgDark: '#FF9A6B', bgDark: '#3A1E14' },
  { id: 'pn', name: 'Physical / Non-Aggressive', short: 'Physical · Non-aggr.', fg: '#A14A07', bg: '#FFF3DC', fgDark: '#F5B65A', bgDark: '#352610' },
  { id: 'va', name: 'Verbal / Aggressive', short: 'Verbal · Aggr.', fg: '#6D28D9', bg: '#F1EBFF', fgDark: '#B79BFF', bgDark: '#271C40' },
  { id: 'vn', name: 'Verbal / Non-Aggressive', short: 'Verbal · Non-aggr.', fg: '#0F766E', bg: '#E3F5F2', fgDark: '#6FD6C6', bgDark: '#10302C' }
];

// Simple stroke icons (24×24 viewBox paths).
export const ICONS = {
  walk: 'M13 4a1.5 1.5 0 1 0 0-.01M10 21l2-6 3 3v3M9 12l2-4 4 2 2 3M11 8l-3 1-1 4',
  shirt: 'M8 3l-5 3 2 4 3-1v12h8V9l3 1 2-4-5-3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3z',
  droplet: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  curse: 'M4 5h16v11H9l-5 4V5zM9 9l2 3M11 9l-2 3M14 9l2 3M16 9l-2 3',
  bell: 'M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 0 0 4 0',
  repeat: 'M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4',
  hand: 'M7 11V6a2 2 0 0 1 4 0v5M11 10V5a2 2 0 0 1 4 0v6M15 10a2 2 0 0 1 4 0v3a7 7 0 0 1-7 7h-1a6 6 0 0 1-6-6v-2a2 2 0 0 1 4 0',
  foot: 'M8 3c2 0 3 2 3 5s-1 6-1 8a3 3 0 0 1-6 0c0-3 1-5 1-8s1-5 3-5zM16 8c2 0 3 2 3 4s-1 4-1 5a3 3 0 0 1-6 0c0-2 1-3 1-5s1-4 3-4z',
  grab: 'M18 11V7a2 2 0 0 0-4 0M14 10V5a2 2 0 0 0-4 0v5M10 10V7a2 2 0 0 0-4 0v7a7 7 0 0 0 7 7h1a6 6 0 0 0 6-6v-3a2 2 0 0 0-4 0',
  push: 'M3 12h13M12 6l6 6-6 6M21 4v16',
  throw: 'M5 19L19 5M19 5h-7M19 5v7M5 9a2 2 0 1 0 0-.01',
  noise: 'M2 12h2M6 8v8M10 5v14M14 8v8M18 10v4M22 12h-2',
  scream: 'M3 10v4h4l5 4V6L7 10H3zM16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14',
  bite: 'M4 8c0-3 4-4 8-4s8 1 8 4v3H4V8zM4 13h16v1c0 4-3 6-8 6s-8-2-8-6v-1zM8 11v2M12 11v2M16 11v2',
  scratch: 'M5 19L15 5M9 20L19 7M3 14L11 3',
  door: 'M14 3h5v18h-5M10 17l5-5-5-5M15 12H3',
  fall: 'M12 3v14M6 11l6 6 6-6M4 21h16',
  complain: 'M4 5h16v11H9l-5 4V5zM9 10h6',
  negativism: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM6 6l12 12',
  eat: 'M7 3v8a2 2 0 0 0 4 0V3M9 11v10M17 3c-2 0-3 3-3 6s1 4 3 4v8',
  hurt: 'M12 3l10 18H2L12 3zM12 10v4M12 18h.01',
  handling: 'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10',
  hide: 'M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 9 6 9 6a17 17 0 0 1-3 3.5M6.6 6.6C4.3 8.1 3 12 3 12s4 6 9 6c1.6 0 3-.4 4.3-1.1',
  hoard: 'M3 4h18v4H3zM5 8v12h14V8M10 12h4',
  tear: 'M14 4l-4 6 4 4-4 6M6 4v16M18 4v16',
  mannerism: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5',
  advanceV: 'M4 5h16v11H9l-5 4V5zM12 13s-3-2-3-4a1.5 1.5 0 0 1 3-.5 1.5 1.5 0 0 1 3 .5c0 2-3 4-3 4z',
  advanceP: 'M12 20s-8-5-8-11a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 6-8 11-8 11z',
  restless: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z'
};

export const ITEMS = [
  { id: 1, name: 'Pacing / aimless wandering', short: 'Pacing', group: 'pn', icon: 'walk', kw: 'walk wander pace' },
  { id: 2, name: 'Inappropriate dress or disrobing', short: 'Disrobing', group: 'pn', icon: 'shirt', kw: 'clothes undress dress naked' },
  { id: 3, name: 'Spitting (incl. at meals)', short: 'Spitting', group: 'pa', icon: 'droplet', kw: 'spit' },
  { id: 4, name: 'Cursing or verbal aggression', short: 'Cursing', group: 'va', icon: 'curse', kw: 'swear curse insult yell' },
  { id: 5, name: 'Constant request for attention or help', short: 'Asking for attention', group: 'vn', icon: 'bell', kw: 'attention help call request' },
  { id: 6, name: 'Repetitive sentences or questions', short: 'Repeating questions', group: 'vn', icon: 'repeat', kw: 'repeat question ask again' },
  { id: 7, name: 'Hitting (including self)', short: 'Hitting', group: 'pa', icon: 'hand', kw: 'hit slap punch strike' },
  { id: 8, name: 'Kicking', short: 'Kicking', group: 'pa', icon: 'foot', kw: 'kick' },
  { id: 9, name: 'Grabbing onto people', short: 'Grabbing', group: 'pa', icon: 'grab', kw: 'grab hold pull' },
  { id: 10, name: 'Pushing', short: 'Pushing', group: 'pa', icon: 'push', kw: 'push shove' },
  { id: 11, name: 'Throwing things', short: 'Throwing things', group: 'pa', icon: 'throw', kw: 'throw toss' },
  { id: 12, name: 'Strange noises (weird laughter or crying)', short: 'Strange noises', group: 'vn', icon: 'noise', kw: 'noise laugh cry moan' },
  { id: 13, name: 'Screaming', short: 'Screaming', group: 'va', icon: 'scream', kw: 'scream shout yell' },
  { id: 14, name: 'Biting', short: 'Biting', group: 'pa', icon: 'bite', kw: 'bite' },
  { id: 15, name: 'Scratching', short: 'Scratching', group: 'pa', icon: 'scratch', kw: 'scratch claw' },
  { id: 16, name: 'Trying to get to a different place', short: 'Trying to leave', group: 'pn', icon: 'door', kw: 'leave exit escape out door' },
  { id: 17, name: 'Intentional falling', short: 'Intentional falling', group: 'pn', icon: 'fall', kw: 'fall drop floor' },
  { id: 18, name: 'Complaining', short: 'Complaining', group: 'vn', icon: 'complain', kw: 'complain whine' },
  { id: 19, name: 'Negativism', short: 'Negativism', group: 'vn', icon: 'negativism', kw: 'refuse negative no' },
  { id: 20, name: 'Eating / drinking inappropriate substances', short: 'Eating non-food', group: 'pn', icon: 'eat', kw: 'eat drink swallow' },
  { id: 21, name: 'Hurting self or others', short: 'Hurting self/others', group: 'pa', icon: 'hurt', kw: 'hurt harm injure burn' },
  { id: 22, name: 'Handling things inappropriately', short: 'Handling things', group: 'pn', icon: 'handling', kw: 'handle touch fiddle' },
  { id: 23, name: 'Hiding things', short: 'Hiding things', group: 'pn', icon: 'hide', kw: 'hide' },
  { id: 24, name: 'Hoarding things', short: 'Hoarding things', group: 'pn', icon: 'hoard', kw: 'hoard collect keep' },
  { id: 25, name: 'Tearing things or destroying property', short: 'Tearing / destroying', group: 'pa', icon: 'tear', kw: 'tear break destroy rip' },
  { id: 26, name: 'Performing repetitive mannerisms', short: 'Repetitive mannerisms', group: 'pn', icon: 'mannerism', kw: 'repeat rock tap mannerism' },
  { id: 27, name: 'Making verbal sexual advances', short: 'Verbal sexual advances', group: 'va', icon: 'advanceV', kw: 'sexual verbal' },
  { id: 28, name: 'Making physical sexual advances', short: 'Physical sexual advances', group: 'pa', icon: 'advanceP', kw: 'sexual touch physical' },
  { id: 29, name: 'General restlessness', short: 'Restlessness', group: 'pn', icon: 'restless', kw: 'restless fidget agitated' }
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const GROUP_BY_ID = Object.fromEntries(GROUPS.map((g) => [g.id, g]));

export const SCALE = [
  { n: 1, label: 'Never' },
  { n: 2, label: 'Less than once a week' },
  { n: 3, label: 'Once or twice a week' },
  { n: 4, label: 'Several times a week' },
  { n: 5, label: 'Once or twice a day' },
  { n: 6, label: 'Several times a day' },
  { n: 7, label: 'Several times an hour' }
];

// Event count in a 14-day period → CMAI frequency rating.
// Thresholds assume 2 weeks; adjust here to match the Android app's rule.
export function ratingFromCount(count) {
  if (count <= 0) return 1;
  if (count === 1) return 2;          // < once a week
  if (count <= 4) return 3;           // 1–2 per week
  if (count <= 13) return 4;          // several per week
  if (count <= 28) return 5;          // 1–2 per day
  if (count <= 223) return 6;         // several per day
  return 7;                           // several per hour
}

export function groupRange(groupId) {
  const n = ITEMS.filter((i) => i.group === groupId).length;
  return { min: n, max: n * 7, n };
}

// Scores for one patient/period. overrides: { itemId: rating }
export function computeScores(events, overrides = {}) {
  const counts = {};
  for (const e of events) counts[e.itemId] = (counts[e.itemId] || 0) + 1;
  const items = ITEMS.map((it) => {
    const count = counts[it.id] || 0;
    const auto = ratingFromCount(count);
    const manual = overrides[it.id];
    return { ...it, count, auto, rating: manual ?? auto, manual: manual != null };
  });
  const groups = GROUPS.map((g) => {
    const gi = items.filter((i) => i.group === g.id);
    const r = groupRange(g.id);
    return { ...g, ...r, items: gi, score: gi.reduce((s, i) => s + i.rating, 0) };
  });
  return { items, groups, total: items.reduce((s, i) => s + i.rating, 0), min: 29, max: 203 };
}
