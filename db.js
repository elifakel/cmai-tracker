// Tiny IndexedDB layer. All data stays on this device.
const DB_NAME = 'cmai-tracker';
const DB_VERSION = 1;
let dbPromise;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('caregivers')) db.createObjectStore('caregivers', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('patients')) db.createObjectStore('patients', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('events')) {
        const s = db.createObjectStore('events', { keyPath: 'id' });
        s.createIndex('patientId', 'patientId');
      }
      if (!db.objectStoreNames.contains('overrides')) db.createObjectStore('overrides', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(store, mode, fn) {
  return open().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let result;
    Promise.resolve(fn(s)).then((r) => { result = r; });
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

const wrap = (req) => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });

export const db = {
  all: (store) => tx(store, 'readonly', (s) => wrap(s.getAll())),
  get: (store, key) => tx(store, 'readonly', (s) => wrap(s.get(key))),
  put: (store, value) => tx(store, 'readwrite', (s) => wrap(s.put(value))),
  del: (store, key) => tx(store, 'readwrite', (s) => wrap(s.delete(key))),
  clear: (store) => tx(store, 'readwrite', (s) => wrap(s.clear())),
  eventsFor: (patientId) => tx('events', 'readonly', (s) => wrap(s.index('patientId').getAll(patientId)))
};

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

// PIN hashing: PBKDF2-SHA256 with a random salt (never store the PIN itself).
const enc = new TextEncoder();
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
export function newSalt() { const a = new Uint8Array(16); crypto.getRandomValues(a); return toHex(a); }
export async function hashPin(pin, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 120000, hash: 'SHA-256' }, key, 256);
  return toHex(bits);
}

// ---- Dates & periods ----
export const DAY = 86400000;
export function startOfDay(t) { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }
export function addDays(t, n) { const d = new Date(t); d.setDate(d.getDate() + n); return d.getTime(); }
export function dayIndex(start, t) { return Math.round((startOfDay(t) - startOfDay(start)) / DAY); }

// Periods are 14-day blocks starting on the day the patient was added.
export function periodOf(patient, index, days = 14) {
  const start = addDays(startOfDay(patient.startDate), index * days);
  const end = addDays(start, days); // exclusive
  return { index, start, end, days };
}
export function currentPeriodIndex(patient, now = Date.now(), days = 14) {
  return Math.max(0, Math.floor(dayIndex(patient.startDate, now) / days));
}

// ---- Backup ----
export async function exportAll() {
  const [caregivers, patients, events, overrides] = await Promise.all(['caregivers', 'patients', 'events', 'overrides'].map(db.all));
  return { app: 'cmai-tracker', version: 1, exportedAt: new Date().toISOString(), caregivers, patients, events, overrides };
}
export async function importAll(data, { replace = false } = {}) {
  if (!data || data.app !== 'cmai-tracker') throw new Error('This is not a CMAI Tracker backup file.');
  for (const store of ['caregivers', 'patients', 'events', 'overrides']) {
    if (replace) await db.clear(store);
    for (const row of data[store] || []) await db.put(store, row);
  }
}
