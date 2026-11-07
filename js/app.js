import { GROUPS, ITEMS, ITEM_BY_ID, GROUP_BY_ID, SCALE, ICONS, computeScores, PERIOD_DAYS } from './cmai.js';
import { db, uid, newSalt, hashPin, DAY, startOfDay, addDays, dayIndex, periodOf, currentPeriodIndex, exportAll, importAll } from './db.js';

const APP_VERSION = '1.1.0';
const app = document.getElementById('app');
const toastEl = document.getElementById('toast');
const dialogEl = document.getElementById('dialog');

// ---------- small helpers ----------
const LS = {
  get(k, d) { try { const v = localStorage.getItem('cmai.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('cmai.' + k, JSON.stringify(v)); } catch { /* private mode */ } },
  del(k) { try { localStorage.removeItem('cmai.' + k); } catch { /* ignore */ } }
};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const enc = encodeURIComponent;
const svg = (d, size = 22, color = 'currentColor', sw = 2) =>
  `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
const I = {
  back: 'M15 6l-6 6 6 6', next: 'M9 6l6 6-6 6', plus: 'M12 5v14M5 12h14', search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4', check: 'M5 12l5 5L20 7', pulse: 'M3 12h4l2-6 4 12 2-6h6',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.8 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3.2 14H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 3.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  record: 'M12 5v14M5 12h14', score: 'M4 20V10M10 20V4M16 20v-7M22 20H2', report: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  history: 'M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5', download: 'M12 3v12M7 10l5 5 5-5M4 21h16', upload: 'M12 21V9M7 14l5-5 5 5M4 3h16',
  calendar: 'M4 5h16v16H4zM4 10h16M9 3v4M15 3v4', down: 'M6 9l6 6 6-6', move: 'M5 12h14M13 6l6 6-6 6', trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3', help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01', edit: 'M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4', install: 'M12 3v12M7 10l5 5 5-5M5 21h14'
};

const pad = (n) => String(n).padStart(2, '0');
const fmtTime = (t) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const fmtDay = (t) => new Date(t).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
const fmtShort = (t) => new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' });
const fmtLong = (t) => new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
const toDateInput = (t) => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fromDateInput = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).getTime(); };
const toDateTimeInput = (t) => { const d = new Date(t); return `${toDateInput(t)}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const hourLabel = (h) => (h === 0 ? '12a' : h < 12 ? h + 'a' : h === 12 ? '12p' : (h - 12) + 'p');
const hourLong = (h) => (h === 0 ? '12 AM' : h < 12 ? h + ' AM' : h === 12 ? '12 PM' : (h - 12) + ' PM');
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const gVar = (g, k) => `var(--${g}-${k})`;
const AVATAR = ['accent', 'vn', 'va', 'pa'];
const avatarStyle = (i) => { const k = AVATAR[i % AVATAR.length]; return k === 'accent' ? 'background:var(--accent-soft);color:var(--accent)' : `background:${gVar(k, 'bg')};color:${gVar(k, 'fg')}`; };
const initials = (name) => (name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2) || '?').toUpperCase();

// ---------- settings: theme & text size ----------
const prefs = { theme: LS.get('theme', 'system'), text: LS.get('text', 'normal') };
const mql = window.matchMedia('(prefers-color-scheme: dark)');
function applyPrefs() {
  const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && mql.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.fontSize = { normal: '16px', large: '18px', xlarge: '20px' }[prefs.text] || '16px';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#050A16' : '#0B1730');
}
mql.addEventListener?.('change', applyPrefs);
applyPrefs();

// ---------- state ----------
let me = null;
let deferredInstall = null;
const ui = { search: '', cat: 'top', period: {}, reportMode: 'period', reportDay: {}, chartSel: null, historyDay: {}, open: {}, error: '' };
let lastRoute = '';
let renderToken = 0;

const route = () => location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
const go = (h) => { if (location.hash === h) render(); else location.hash = h; };

async function loadMe() {
  const id = LS.get('session', null);
  if (!id) return null;
  const cg = await db.get('caregivers', id);
  if (!cg) LS.del('session');
  return cg || null;
}

async function overridesFor(patientId, periodIndex) {
  const all = await db.all('overrides');
  const out = {};
  for (const o of all) if (o.patientId === patientId && o.period === periodIndex) out[o.itemId] = o.rating;
  return out;
}

function inRange(events, start, end) { return events.filter((e) => e.ts >= start && e.ts < end); }

// Each patient belongs to one caregiver (ownerId). Older records only have createdBy.
const ownerOf = (p) => p.ownerId ?? p.createdBy ?? null;
const isMine = (p) => !ownerOf(p) || ownerOf(p) === me?.id;
async function myPatients() { return (await db.all('patients')).filter(isMine).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })); }

// ---------- rendering ----------
async function render() {
  const token = ++renderToken;
  const [r, a, b] = route();
  me = await loadMe();
  let html;
  try {
    if (!r && me) { go('#/patients'); return; }
    if (!r) html = await vAccounts();
    else if (r === 'caregiver' && a === 'new') html = vNewCaregiver();
    else if (r === 'login') html = await vLogin(a);
    else if (!me) { go('#/'); return; }
    else if (r === 'patients' && a === 'new') html = vNewPatient();
    else if (r === 'patients') html = await vPatients();
    else if (r === 'settings') html = await vSettings();
    else if (r === 'p') html = await vPatient(a, b || 'record');
    else html = await vAccounts();
  } catch (err) {
    console.error(err);
    html = `<div class="content"><div class="card"><h2>Something went wrong</h2><p class="muted">${esc(err.message)}</p><a class="btn btn-primary" href="#/">Go home</a></div></div>`;
  }
  if (token !== renderToken) return;
  const key = location.hash;
  const sameRoute = key === lastRoute;
  const y = window.scrollY;
  app.innerHTML = html;
  if (sameRoute) window.scrollTo(0, y); else { window.scrollTo(0, 0); app.querySelector('[autofocus]')?.focus(); }
  lastRoute = key;
  toastEl.classList.toggle('low', !(r === 'p'));
}

// ---- Accounts ----
async function vAccounts() {
  const cgs = (await db.all('caregivers')).sort((x, y) => x.createdAt - y.createdAt);
  const events = await db.all('events');
  const last = {};
  for (const e of events) if (!last[e.caregiverId] || e.ts > last[e.caregiverId]) last[e.caregiverId] = e.ts;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return `
  <header class="hero tall">
    <div class="brand"><div class="logo">${svg(I.pulse, 26, '#fff', 2.2)}</div>CMAI Tracker</div>
    <div style="display:flex;flex-direction:column;gap:.5rem">
      <h1>${cgs.length ? 'Who’s observing today?' : 'Welcome'}</h1>
      <p class="muted" style="margin:0">${cgs.length ? 'Pick your name to start recording behaviors for your patients.' : 'Add yourself as a caregiver to start recording agitation behaviors.'}</p>
    </div>
  </header>
  <main class="content lift">
    ${cgs.map((c, i) => `
      <a class="list-card" href="#/login/${enc(c.id)}">
        <div class="avatar" style="${avatarStyle(i)}">${esc(initials(c.name))}</div>
        <div class="grow"><div class="title ellipsis">${esc(c.name)}</div>
          <div class="small muted">${last[c.id] ? 'Last recorded ' + fmtDay(last[c.id]) + ', ' + fmtTime(last[c.id]) : 'No recordings yet'}</div></div>
        ${svg(I.next, 20, 'var(--muted)')}
      </a>`).join('')}
    <a class="btn btn-dashed" href="#/caregiver/new">${svg(I.plus, 18)} ${cgs.length ? 'Add a caregiver' : 'Add the first caregiver'}</a>
    ${deferredInstall ? `<button class="btn btn-ghost btn-block" data-act="install">${svg(I.install, 18)} Install the app</button>` : ''}
    ${isIOS && !standalone ? `<div class="card small muted">To install on iPhone: tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>. This also keeps your data safer.</div>` : ''}
  </main>
  <footer class="foot">${svg(I.lock, 16)} Data stays on this device · PIN protected</footer>`;
}

function vNewCaregiver() {
  return `
  <header class="hero">
    <div class="hero-row"><a class="icon-btn" href="#/" aria-label="Back">${svg(I.back, 20)}</a><div class="brand" style="font-size:1.05rem">CMAI Tracker</div></div>
    <h1>New caregiver</h1>
  </header>
  <main class="content">
    <form class="card form" data-form="newCaregiver" novalidate>
      <div class="field"><label for="f-name">Your name</label><input class="input" id="f-name" name="name" autocomplete="name" maxlength="40" required autofocus></div>
      <div class="field"><label for="f-pin">Choose a PIN (4–8 digits)</label><input class="input pin" id="f-pin" name="pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="new-password" required></div>
      <div class="field"><label for="f-pin2">Repeat the PIN</label><input class="input pin" id="f-pin2" name="pin2" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="new-password" required></div>
      ${ui.error ? `<div class="error" role="alert">${esc(ui.error)}</div>` : ''}
      <button class="btn btn-primary btn-block" type="submit">Create account</button>
    </form>
  </main>`;
}

async function vLogin(id) {
  const cg = await db.get('caregivers', id);
  if (!cg) return vAccounts();
  return `
  <header class="hero">
    <div class="brand"><div class="logo">${svg(I.pulse, 26, '#fff', 2.2)}</div>CMAI Tracker</div>
    <div style="display:flex;flex-direction:column;gap:.35rem"><h1>Hello, ${esc(cg.name)}</h1><p class="muted" style="margin:0">Enter your PIN to sign in.</p></div>
  </header>
  <main class="content">
    <form class="card form" data-form="login" data-id="${esc(cg.id)}" novalidate>
      <div class="field"><label for="f-pin">PIN</label><input class="input pin" id="f-pin" name="pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="current-password" required autofocus></div>
      ${ui.error ? `<div class="error" role="alert">${esc(ui.error)}</div>` : ''}
      <button class="btn btn-primary btn-block" type="submit">Sign in</button>
    </form>
    <a class="btn-link" href="#/">${svg(I.back, 18)} Not you? Choose another name</a>
  </main>
  <footer class="foot">${svg(I.lock, 16)} Data stays on this device</footer>`;
}

// ---- Patients ----
async function patientSummaries() {
  const patients = await myPatients();
  const allOv = await db.all('overrides');
  const now = Date.now();
  const out = [];
  for (const p of patients) {
    const evs = await db.eventsFor(p.id);
    const idx = currentPeriodIndex(p, now);
    const per = periodOf(p, idx);
    const inPer = inRange(evs, per.start, per.end);
    const ov = {};
    for (const o of allOv) if (o.patientId === p.id && o.period === idx) ov[o.itemId] = o.rating;
    const days = Array(PERIOD_DAYS).fill(0);
    for (const e of inPer) days[dayIndex(per.start, e.ts)]++;
    const last = evs.reduce((m, e) => Math.max(m, e.ts), 0);
    const today = evs.filter((e) => e.ts >= startOfDay(now)).length;
    out.push({ p, idx, per, inPer, days, last, today, dayOfPeriod: dayIndex(per.start, now) + 1, total: computeScores(inPer, ov).total });
  }
  return out.sort((a, b) => (b.last || b.p.createdAt) - (a.last || a.p.createdAt));
}

async function vPatients() {
  const list = await patientSummaries();
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const todayN = list.reduce((s, x) => s + x.today, 0);
  const perN = list.reduce((s, x) => s + x.inPer.length, 0);
  return `
  <header class="hero">
    <div class="hero-row" style="justify-content:space-between">
      <div><div class="muted small">${greet}, ${esc(me.name)}</div><h1>Your patients</h1></div>
      <a class="icon-btn" href="#/settings" aria-label="Settings">${svg(I.gear, 22)}</a>
    </div>
    <div class="hero-card">
      <div class="stats3">
        <div><div class="stat-num">${todayN}</div><div class="stat-lbl">events today</div></div>
        <div><div class="stat-num">${perN}</div><div class="stat-lbl">this period</div></div>
        <div><div class="stat-num">${list.length}</div><div class="stat-lbl">${list.length === 1 ? 'patient' : 'patients'}</div></div>
      </div>
    </div>
  </header>
  <main class="content" style="padding-bottom:7rem">
    <div class="section-head"><h2>${list.length ? 'Tap a patient to record' : 'No patients yet'}</h2>${list.length ? '<span class="small muted">Most recent first</span>' : ''}</div>
    ${list.length ? '' : `<div class="card muted">Add your first patient to start recording behaviors. Each patient gets 14-day observation periods starting from the day they are added.</div>`}
    ${list.map((x) => `
      <a class="list-card" href="#/p/${enc(x.p.id)}/record">
        <div class="avatar" style="background:var(--accent-soft);color:var(--accent);font-size:.85rem">${esc(x.p.id.slice(0, 5))}</div>
        <div class="grow">
          <div class="title ellipsis">Patient ${esc(x.p.id)}</div>
          <div class="small muted">${plural(x.inPer.length, 'event')} · ${x.last ? 'last ' + fmtDay(x.last) + ', ' + fmtTime(x.last) : 'nothing recorded yet'}</div>
          <div class="spark" aria-hidden="true">${x.days.map((v, i) => `<span class="${v ? 'on' : ''} ${i === x.dayOfPeriod - 1 ? 'today' : ''}" style="height:${v ? Math.min(18, 4 + v * 2) : 3}px"></span>`).join('')}</div>
          <div class="tiny muted" style="margin-top:.2rem">Period ${x.idx + 1} · day ${x.dayOfPeriod} of ${PERIOD_DAYS}</div>
        </div>
        <div class="score-col"><span class="tiny muted" style="font-weight:600;letter-spacing:.04em">CMAI</span><span class="big">${x.total}</span><span class="tiny muted">/ 203</span></div>
      </a>`).join('')}
  </main>
  <a class="btn btn-primary fab" href="#/patients/new">${svg(I.plus, 20, 'currentColor', 2.4)} New patient</a>`;
}

function vNewPatient() {
  return `
  <header class="hero">
    <div class="hero-row"><a class="icon-btn" href="#/patients" aria-label="Back">${svg(I.back, 20)}</a></div>
    <h1>New patient</h1>
  </header>
  <main class="content">
    <form class="card form" data-form="newPatient" novalidate>
      <div class="field"><label for="f-id">Patient ID</label><input class="input" id="f-id" name="id" placeholder="e.g. P006" maxlength="20" autocomplete="off" autocapitalize="characters" required autofocus>
        <span class="small muted">Use a study code, not the patient’s real name.</span></div>
      <div class="field"><label for="f-start">First day of observation</label><input class="input" id="f-start" name="start" type="date" value="${toDateInput(Date.now())}" required>
        <span class="small muted">14-day periods start from this day.</span></div>
      ${ui.error ? `<div class="error" role="alert">${esc(ui.error)}</div>` : ''}
      <button class="btn btn-primary btn-block" type="submit">Add patient</button>
    </form>
  </main>`;
}

// ---- Patient (tabs) ----
async function vPatient(id, tab) {
  const p = await db.get('patients', id);
  if (!p) return `<main class="content"><div class="card"><h2>Patient not found</h2><a class="btn btn-primary" href="#/patients">Back to patients</a></div></main>`;
  if (!isMine(p)) return `<main class="content"><div class="card form"><h2>This patient belongs to another caregiver</h2><p class="muted" style="margin:0">Only the caregiver this patient is assigned to can open it. They can move it to you from Settings › My patients.</p><a class="btn btn-primary" href="#/patients">Back to my patients</a></div></main>`;
  const events = (await db.eventsFor(p.id)).sort((a, b) => b.ts - a.ts);
  const cur = currentPeriodIndex(p);
  const curPer = periodOf(p, cur);
  const curTotal = computeScores(inRange(events, curPer.start, curPer.end), await overridesFor(p.id, cur)).total;
  const idx = Math.min(ui.period[p.id] ?? cur, cur);
  const ctx = { p, events, cur, idx, per: periodOf(p, idx) };
  let body = '';
  if (tab === 'record') body = vRecord({ ...ctx, idx: cur, per: curPer });
  else if (tab === 'score') body = await vScore(ctx);
  else if (tab === 'report') body = vReport(ctx);
  else if (tab === 'history') body = vHistory(ctx);
  const tabs = [['record', 'Record', I.record], ['score', 'Score', I.score], ['report', 'Report', I.report], ['history', 'History', I.history]];
  const mine = await myPatients();
  const allEv = await db.all('events');
  const today = startOfDay(Date.now());
  const todayN = {};
  for (const e of allEv) if (e.ts >= today) todayN[e.patientId] = (todayN[e.patientId] || 0) + 1;
  return `
  <header class="p-head">
    <a class="icon-btn" href="#/patients" aria-label="Back to patients">${svg(I.back, 20)}</a>
    <details class="switch grow">
      <summary aria-label="Patient ${esc(p.id)}. Tap to switch patient">
        <span class="grow" style="min-width:0"><span class="title ellipsis" style="font-weight:800;display:block">Patient ${esc(p.id)}</span><span class="small muted ellipsis" style="display:block">Caregiver ${esc(me.name)} · ID ${esc(p.id)}</span></span>
        ${svg(I.down, 18, 'var(--muted)')}
      </summary>
      <div class="switch-menu">
        <div class="switch-head">Switch patient</div>
        ${mine.map((x) => `<a class="switch-item" href="#/p/${enc(x.id)}/${tab}" ${x.id === p.id ? 'aria-current="page"' : ''}>
          <span class="switch-check">${x.id === p.id ? svg(I.check, 18, 'var(--accent)', 2.6) : ''}</span>
          <span class="grow" style="min-width:0"><span class="ellipsis" style="display:block;font-weight:700">Patient ${esc(x.id)}</span><span class="tiny muted ellipsis" style="display:block">ID ${esc(x.id)} · Today: ${plural(todayN[x.id] || 0, 'event')}</span></span></a>`).join('')}
        <a class="switch-all" href="#/patients">All patients</a>
      </div>
    </details>
    <span class="pill">CMAI ${curTotal}</span>
  </header>
  <main class="content with-nav">${body}</main>
  <nav class="nav" aria-label="Patient sections">
    ${tabs.map(([k, l, d]) => `<a href="#/p/${enc(p.id)}/${k}" ${k === tab ? 'aria-current="page"' : ''}><span class="pillbg">${svg(d, 22)}</span>${l}</a>`).join('')}
  </nav>`;
}

function periodNav({ p, idx, cur, per }) {
  return `
  <div class="period">
    <button class="icon-btn" data-act="period" data-id="${esc(p.id)}" data-to="${idx - 1}" ${idx <= 0 ? 'disabled' : ''} aria-label="Previous period">${svg(I.back, 18)}</button>
    <div class="mid"><div class="title">Period ${idx + 1}${idx === cur ? ' (current)' : ''}</div><div class="small muted">${fmtShort(per.start)} – ${fmtLong(addDays(per.end, -1))}</div></div>
    <button class="icon-btn" data-act="period" data-id="${esc(p.id)}" data-to="${idx + 1}" ${idx >= cur ? 'disabled' : ''} aria-label="Next period">${svg(I.next, 18)}</button>
  </div>`;
}

// Record
function tileList(p, events, per) {
  const counts = {}; const allCounts = {};
  for (const e of events) { allCounts[e.itemId] = (allCounts[e.itemId] || 0) + 1; if (e.ts >= per.start && e.ts < per.end) counts[e.itemId] = (counts[e.itemId] || 0) + 1; }
  const q = ui.search.trim().toLowerCase();
  let items;
  if (q) items = ITEMS.filter((i) => (i.name + ' ' + i.short + ' ' + i.kw).toLowerCase().includes(q));
  else if (ui.cat === 'top') {
    const used = ITEMS.filter((i) => allCounts[i.id]).sort((a, b) => allCounts[b.id] - allCounts[a.id]).slice(0, 8);
    const defaults = [16, 6, 13, 7, 23, 12, 1, 29].map((n) => ITEM_BY_ID[n]).filter((i) => !used.includes(i));
    items = [...used, ...defaults].slice(0, 8);
  } else if (ui.cat === 'all') items = ITEMS;
  else items = ITEMS.filter((i) => i.group === ui.cat);
  if (!items.length) return `<div class="empty" style="grid-column:1/-1">No behavior matches “${esc(ui.search)}”.</div>`;
  return items.map((it) => {
    const g = it.group; const n = counts[it.id] || 0;
    return `<button class="tile" data-act="rec" data-pid="${esc(p.id)}" data-item="${it.id}" aria-label="Record ${esc(it.name)}">
      <div class="tile-top"><div class="ico" style="background:${gVar(g, 'bg')}">${svg(ICONS[it.icon], 22, gVar(g, 'fg'))}</div>
        ${n ? `<span class="badge" style="background:${gVar(g, 'bg')};color:${gVar(g, 'fg')}">×${n}</span>` : ''}</div>
      <div><div class="tile-name">${esc(it.short)}</div><div class="tiny muted">${esc(GROUP_BY_ID[g].short)}</div></div>
    </button>`;
  }).join('');
}

function vRecord({ p, events, per }) {
  const cats = [['top', 'Most recorded'], ...GROUPS.map((g) => [g.id, g.short]), ['all', 'All 29']];
  return `
  <label class="search">${svg(I.search, 18)}<span class="sr-only">Search behaviors</span>
    <input id="search" type="search" placeholder="Search (e.g. hit, scream)" value="${esc(ui.search)}" data-pid="${esc(p.id)}" autocomplete="off"></label>
  <div class="chips" role="group" aria-label="Behavior groups">
    ${cats.map(([k, l]) => `<button class="chip" data-act="cat" data-cat="${k}" aria-pressed="${!ui.search && ui.cat === k}">${GROUP_BY_ID[k] ? `<span class="dot" style="background:${gVar(k, 'fg')}"></span>` : ''}${esc(l)}</button>`).join('')}
  </div>
  <div class="tiles" id="tiles">${tileList(p, events, per)}</div>
  <p class="small muted" style="text-align:center;margin:.5rem 0 0">Tap a behavior the moment you see it. You can undo or change the time right after.</p>`;
}

// Score
const scaleColor = (n) => `background:var(--s${n});color:var(--s${n}t)`;
async function vScore(ctx) {
  const { p, events, idx, cur, per } = ctx;
  const ov = await overridesFor(p.id, idx);
  const inPer = inRange(events, per.start, per.end);
  const sc = computeScores(inPer, ov);
  const C = 2 * Math.PI * 66;
  const frac = sc.total / sc.max;
  const day = dayIndex(per.start, Date.now()) + 1;
  const status = idx === cur ? `In progress · day ${day} of ${PERIOD_DAYS}` : 'Completed';
  const anyOpen = GROUPS.some((g) => ui.open[g.id]);
  return `
  ${periodNav(ctx)}
  <section class="card" style="background:var(--hero);color:var(--hero-ink);display:flex;align-items:center;gap:1.1rem">
    <div class="ring-wrap"><svg role="img" aria-label="CMAI total ${sc.total} of ${sc.max}" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r="66" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="14"/>
      <circle cx="80" cy="80" r="66" fill="none" stroke="var(--mint)" stroke-width="14" stroke-linecap="round" stroke-dasharray="${(C * frac).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 80 80)"/></svg>
      <div class="ring-center"><span class="num">${sc.total}</span><span class="small" style="color:var(--hero-muted)">of ${sc.max}</span></div></div>
    <div style="display:flex;flex-direction:column;gap:.55rem">
      <span class="tiny" style="font-weight:600;letter-spacing:.06em;color:var(--hero-muted)">CMAI TOTAL SCORE</span>
      <span class="small" style="color:#E6EAF5">${plural(inPer.length, 'event')} recorded.${idx === cur ? ` Scores may still go up until ${fmtShort(addDays(per.end, -1))}.` : ''}</span>
      <span class="status-pill">${status}</span>
    </div>
  </section>
  <div class="section-head"><h2>Scores by group</h2><button class="btn-link" data-act="openAll" data-v="${anyOpen ? 0 : 1}">${anyOpen ? 'Close all' : 'Open all'}</button></div>
  ${sc.groups.map((g) => {
    const w = Math.max(3, Math.round(((g.score - g.min) / (g.max - g.min)) * 100));
    const open = !!ui.open[g.id];
    return `<section class="group-card">
      <button class="group-head" data-act="toggleGroup" data-g="${g.id}" aria-expanded="${open}">
        <div class="group-row"><span class="dot" style="background:${gVar(g.id, 'fg')};width:.65rem;height:.65rem"></span>
          <span class="grow title" style="font-size:1rem">${esc(g.name)}</span><span class="num">${g.score}</span><span class="tiny muted" style="width:2.6rem">/ ${g.max}</span>${svg(open ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6', 18, 'var(--muted)')}</div>
        <div class="bar" style="background:${gVar(g.id, 'bg')}"><div style="width:${w}%;background:${gVar(g.id, 'fg')}"></div></div>
        <div class="tiny muted">Range ${g.min}–${g.max} · ${g.n} behaviors</div>
      </button>
      ${open ? `<div class="items">${g.items.map((it) => `
        <div class="item">
          <div style="display:flex;align-items:center;gap:.6rem"><div class="ico" style="width:2.2rem;height:2.2rem;border-radius:.7rem;background:${gVar(g.id, 'bg')}">${svg(ICONS[it.icon], 18, gVar(g.id, 'fg'))}</div>
            <div class="grow"><div style="font-weight:600">${esc(it.name)}</div><div class="tiny muted">${SCALE[it.rating - 1].label} · ${plural(it.count, 'event')}${it.manual ? ' · set by hand' : ''}</div></div>
            ${it.manual ? `<button class="btn-link small" data-act="unrate" data-pid="${esc(p.id)}" data-period="${idx}" data-item="${it.id}">Reset</button>` : ''}</div>
          <div class="rates" role="group" aria-label="Rating for ${esc(it.name)}">${SCALE.map((s) => `<button class="rate" data-act="rate" data-pid="${esc(p.id)}" data-period="${idx}" data-item="${it.id}" data-n="${s.n}" aria-pressed="${it.rating === s.n}" aria-label="${s.n}: ${s.label}" ${it.rating === s.n ? `style="${scaleColor(s.n)}"` : ''}>${s.n}</button>`).join('')}</div>
        </div>`).join('')}</div>` : ''}
    </section>`;
  }).join('')}
  <section class="card">
    <h2 style="font-size:1rem">What the ratings mean</h2>
    <div class="legend">${SCALE.map((s) => `<div><span class="sw" style="${scaleColor(s.n)}">${s.n}</span>${s.label}</div>`).join('')}</div>
    <p class="small muted" style="margin:.75rem 0 0">Ratings are calculated from the events recorded in this 14-day period. Open a group and tap a number to set a rating by hand.</p>
  </section>`;
}

// Charts
function lineChart(values, { labels, tickEvery, sel, label }) {
  const W = 340, H = 180, L = 26, R = 10, T = 22, B = 28;
  const n = values.length; const max = Math.max(1, ...values);
  const x = (i) => L + (i * (W - L - R)) / (n - 1);
  const y = (v) => T + (1 - v / max) * (H - T - B);
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const area = `${line}L${x(n - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`;
  const step = (W - L - R) / (n - 1);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
    <line x1="${L}" x2="${W - R}" y1="${y(max)}" y2="${y(max)}" stroke="var(--line)"/><line x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" stroke="var(--line)"/>
    <text x="${L - 6}" y="${y(max) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${max}</text><text x="${L - 6}" y="${y(0) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">0</text>
    <path d="${area}" fill="var(--accent)" opacity=".12"/><path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>
    ${values.map((v, i) => (i % tickEvery === 0 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--muted)">${labels[i]}</text>` : '')).join('')}
    ${values.map((v, i) => (v || i === sel ? `<circle cx="${x(i)}" cy="${y(v)}" r="${i === sel ? 6 : 4}" fill="${i === sel ? 'var(--accent)' : 'var(--surface)'}" stroke="var(--accent)" stroke-width="2.5"/>${v ? `<text x="${x(i)}" y="${y(v) - 10}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">${v}</text>` : ''}` : '')).join('')}
    ${values.map((v, i) => `<rect class="hit" data-act="chartSel" data-i="${i}" x="${(x(i) - step / 2).toFixed(1)}" y="0" width="${step.toFixed(1)}" height="${H}" fill="transparent"/>`).join('')}
  </svg>`;
}

function behaviorBars(evs) {
  const counts = {};
  for (const e of evs) counts[e.itemId] = (counts[e.itemId] || 0) + 1;
  const rows = Object.entries(counts).map(([id, c]) => ({ it: ITEM_BY_ID[id], c })).filter((r) => r.it).sort((a, b) => b.c - a.c);
  if (!rows.length) return '<p class="muted small" style="margin:.25rem 0">Nothing recorded.</p>';
  const max = rows[0].c;
  return rows.map(({ it, c }) => `<div class="hbar"><div class="hbar-top">${svg(ICONS[it.icon], 16, gVar(it.group, 'fg'))}<span class="grow">${esc(it.short)}</span><strong>${c}</strong></div>
    <div class="hbar-track"><div style="width:${Math.max(4, (c / max) * 100)}%;background:${gVar(it.group, 'fg')}"></div></div></div>`).join('');
}

function vReport(ctx) {
  const { p, events, per } = ctx;
  const inPer = inRange(events, per.start, per.end);
  const seg = `<div class="seg" role="group" aria-label="Report range"><button data-act="reportMode" data-v="period" aria-pressed="${ui.reportMode === 'period'}">14 days</button><button data-act="reportMode" data-v="daily" aria-pressed="${ui.reportMode === 'daily'}">Daily</button></div>`;
  if (ui.reportMode === 'period') {
    const days = Array(PERIOD_DAYS).fill(0);
    for (const e of inPer) days[dayIndex(per.start, e.ts)]++;
    const best = days.indexOf(Math.max(...days));
    const sel = ui.chartSel;
    const info = sel != null && sel < PERIOD_DAYS ? `<strong>Day ${sel + 1}</strong> · ${fmtDay(addDays(per.start, sel))} · ${plural(days[sel], 'event')}` : 'Tap the chart to see the exact date and count.';
    return `${seg}${periodNav(ctx)}
    <div class="stats2"><div class="stat-card"><div class="small muted">Events</div><div class="v">${inPer.length}</div></div>
      <div class="stat-card"><div class="small muted">Busiest day</div><div class="v">${inPer.length ? fmtShort(addDays(per.start, best)) : '—'}</div><div class="tiny muted">${inPer.length ? plural(days[best], 'event') : 'no events yet'}</div></div></div>
    <section class="card chart"><h2 style="font-size:1rem;margin-bottom:.5rem">Events per day</h2>
      ${lineChart(days, { labels: days.map((_, i) => i + 1), tickEvery: 1, sel, label: `Events per day: ${days.join(', ')}` })}
      <div class="tiny muted">Day of the period (1–14)</div><div class="chart-info" aria-live="polite">${info}</div></section>
    <section class="card"><h2 style="font-size:1rem;margin-bottom:.25rem">Behaviors this period</h2>${behaviorBars(inPer)}</section>`;
  }
  const today = startOfDay(Date.now());
  let d = ui.reportDay[p.id] ?? (today >= per.start && today < per.end ? today : per.start);
  if (d < per.start || d >= per.end) d = per.start;
  const dayEvs = inRange(events, d, addDays(d, 1));
  const hours = Array(24).fill(0);
  for (const e of dayEvs) hours[new Date(e.ts).getHours()]++;
  const bestH = hours.indexOf(Math.max(...hours));
  const sel = ui.chartSel;
  const info = sel != null && sel < 24 ? `<strong>${hourLong(sel)}–${hourLong((sel + 1) % 24)}</strong> · ${plural(hours[sel], 'event')}` : 'Tap the chart to see the exact hour and count.';
  const prev = addDays(d, -1), next = addDays(d, 1);
  return `${seg}${periodNav(ctx)}
  <div class="day-pick">
    <button class="icon-btn" data-act="reportDay" data-id="${esc(p.id)}" data-t="${prev}" ${prev < per.start ? 'disabled' : ''} aria-label="Previous day">${svg(I.back, 18)}</button>
    <label class="sr-only" for="day-input">Day</label><input class="input" id="day-input" type="date" data-change="reportDay" data-id="${esc(p.id)}" value="${toDateInput(d)}" min="${toDateInput(per.start)}" max="${toDateInput(addDays(per.end, -1))}">
    <button class="icon-btn" data-act="reportDay" data-id="${esc(p.id)}" data-t="${next}" ${next >= per.end || next > today ? 'disabled' : ''} aria-label="Next day">${svg(I.next, 18)}</button>
  </div>
  <div class="small muted" style="text-align:center">${fmtDay(d)}${d === today ? ' (today)' : ''} · day ${dayIndex(per.start, d) + 1} of period ${ctx.idx + 1}</div>
  <div class="stats2"><div class="stat-card"><div class="small muted">Events</div><div class="v">${dayEvs.length}</div></div>
    <div class="stat-card"><div class="small muted">Busiest hour</div><div class="v">${dayEvs.length ? hourLong(bestH) : '—'}</div><div class="tiny muted">${dayEvs.length ? plural(hours[bestH], 'event') : 'no events'}</div></div></div>
  <section class="card chart"><h2 style="font-size:1rem;margin-bottom:.5rem">Events per hour</h2>
    ${lineChart(hours, { labels: hours.map((_, i) => hourLabel(i)), tickEvery: 3, sel, label: `Events per hour on ${fmtDay(d)}` })}
    <div class="chart-info" aria-live="polite">${info}</div></section>
  <section class="card"><h2 style="font-size:1rem;margin-bottom:.25rem">Behaviors on this day</h2>${behaviorBars(dayEvs)}</section>`;
}

function vHistory(ctx) {
  const { p, events, per } = ctx;
  let list = inRange(events, per.start, per.end);
  const fd = ui.historyDay[p.id];
  if (fd) list = inRange(list, fd, addDays(fd, 1));
  const byDay = new Map();
  for (const e of list) { const k = startOfDay(e.ts); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(e); }
  return `${periodNav(ctx)}
  <div class="day-pick">
    <label class="small muted" for="hist-day" style="white-space:nowrap;font-weight:600">Show one day</label>
    <input class="input" id="hist-day" type="date" data-change="historyDay" data-id="${esc(p.id)}" value="${fd ? toDateInput(fd) : ''}" min="${toDateInput(per.start)}" max="${toDateInput(addDays(per.end, -1))}">
    ${fd ? `<button class="btn btn-ghost" data-act="historyAll" data-id="${esc(p.id)}">All days</button>` : ''}
  </div>
  <div class="section-head"><h2>${plural(list.length, 'event')}</h2><span class="small muted">${fd ? fmtDay(fd) : 'whole period'}</span></div>
  ${list.length ? '' : '<div class="card muted">No events recorded here yet.</div>'}
  ${[...byDay.entries()].map(([day, evs]) => `
    <div class="day-head">${fmtDay(day)} · ${plural(evs.length, 'event')}</div>
    ${evs.map((e) => { const it = ITEM_BY_ID[e.itemId]; if (!it) return ''; return `
      <div class="ev"><div class="ico" style="background:${gVar(it.group, 'bg')}">${svg(ICONS[it.icon], 20, gVar(it.group, 'fg'))}</div>
        <div class="grow"><div style="font-weight:600">${esc(it.short)}</div><div class="tiny muted">${fmtTime(e.ts)} · recorded by ${esc(e.caregiverName || '—')}</div></div>
        <button class="icon-btn" data-act="editTime" data-id="${esc(e.id)}" aria-label="Change time of ${esc(it.short)} at ${fmtTime(e.ts)}">${svg(I.edit, 18, 'var(--accent)')}</button>
        <button class="del" data-act="delEvent" data-id="${esc(e.id)}" aria-label="Delete ${esc(it.short)} at ${fmtTime(e.ts)}">Delete</button></div>`; }).join('')}`).join('')}`;
}

// ---- Settings ----
async function vSettings() {
  let persisted = null;
  try { persisted = await navigator.storage?.persisted?.(); } catch { /* unsupported */ }
  const mine = await myPatients();
  const evCount = {};
  for (const e of await db.all('events')) evCount[e.patientId] = (evCount[e.patientId] || 0) + 1;
  const radio = (name, v, label, cur) => `<label class="radio"><input type="radio" name="${name}" value="${v}" data-change="${name}" ${cur === v ? 'checked' : ''}>${label}</label>`;
  return `
  <header class="p-head"><a class="icon-btn" href="#/patients" aria-label="Back">${svg(I.back, 20)}</a><h1 class="grow" style="font-size:1.3rem">Settings</h1></header>
  <main class="content">
    <h2 class="section-head" style="font-size:1rem">My account</h2>
    <section class="card settings-group">
      <div class="kv"><span class="small muted">Name</span><span class="title">${esc(me.name)}</span></div>
      <button class="btn btn-ghost btn-block" data-act="rename">Change my name</button>
      <button class="btn btn-ghost btn-block" data-act="changePin">Change my PIN</button>
      <button class="btn btn-ghost btn-block" data-act="signOut">Sign out</button>
    </section>
    <h2 class="section-head" style="font-size:1rem">My patients</h2>
    <section class="card settings-group">
      <p class="small muted" style="margin:0">Rename, move or delete a patient here. Moving gives the patient and all of their records to another caregiver on this device.</p>
      ${mine.length ? mine.map((p) => `
        <div class="manage-row">
          <div class="grow" style="min-width:0"><div class="title ellipsis">Patient ${esc(p.id)}</div><div class="tiny muted">${plural(evCount[p.id] || 0, 'event')} · since ${fmtLong(p.startDate)}</div></div>
          <div class="manage-btns">
            <button class="btn btn-ghost btn-sm" data-act="renamePatient" data-id="${esc(p.id)}" aria-label="Rename patient ${esc(p.id)}">${svg(I.edit, 16)} Rename</button>
            <button class="btn btn-ghost btn-sm" data-act="movePatient" data-id="${esc(p.id)}" aria-label="Move patient ${esc(p.id)} to another caregiver">${svg(I.move, 16)} Move</button>
            <button class="btn btn-danger btn-sm" data-act="deletePatient" data-id="${esc(p.id)}" aria-label="Delete patient ${esc(p.id)}">${svg(I.trash, 16)} Delete</button>
          </div>
        </div>`).join('') : '<p class="small muted" style="margin:0">You have no patients yet.</p>'}
    </section>
    <h2 class="section-head" style="font-size:1rem">Help</h2>
    <section class="card">
      <details class="help">
        <summary>${svg(I.help, 20, 'var(--accent)')}<span class="grow">How to use CMAI Tracker</span>${svg(I.down, 18, 'var(--muted)')}</summary>
        <ol class="help-steps">
          <li><strong>Add a patient.</strong> On <em>Your patients</em>, tap <em>New patient</em>. Use a study code (e.g. P006), not a real name. 14-day periods start on the first day you choose.</li>
          <li><strong>Record a behavior.</strong> Open the patient and tap the behavior the moment you see it. Use the search box or the group buttons to find it.</li>
          <li><strong>Fix a mistake.</strong> Right after recording, tap <em>Undo</em> or <em>Time</em>. Later, open <em>History</em> to change the time or delete an event.</li>
          <li><strong>See the score.</strong> <em>Score</em> shows the CMAI total and group scores for the 14-day period. Open a group and tap a number to set a rating by hand.</li>
          <li><strong>See patterns.</strong> <em>Report</em> shows events per day for the period, or per hour for one day.</li>
          <li><strong>Switch patients.</strong> Tap the patient’s name at the top of any screen to jump to another patient, or choose <em>All patients</em>.</li>
          <li><strong>Hand over a patient.</strong> In <em>Settings › My patients</em>, tap <em>Move</em> and choose the caregiver.</li>
          <li><strong>Keep data safe.</strong> Tap <em>Download full backup</em> below regularly. Data lives only on this device.</li>
        </ol>
      </details>
    </section>
    <h2 class="section-head" style="font-size:1rem">Text size</h2>
    <section class="card" role="radiogroup" aria-label="Text size"><p class="small muted" style="margin:0 0 .25rem">Changes the size of the text in the whole app.</p>
      ${radio('text', 'normal', 'Normal', prefs.text)}${radio('text', 'large', 'Large', prefs.text)}${radio('text', 'xlarge', 'Extra large', prefs.text)}</section>
    <h2 class="section-head" style="font-size:1rem">Appearance</h2>
    <section class="card" role="radiogroup" aria-label="Appearance">${radio('theme', 'system', 'Follow phone setting', prefs.theme)}${radio('theme', 'light', 'Light', prefs.theme)}${radio('theme', 'dark', 'Dark', prefs.theme)}</section>
    <h2 class="section-head" style="font-size:1rem">Data &amp; backup</h2>
    <section class="card settings-group">
      <p class="small muted" style="margin:0">Everything is stored only in this browser on this device. Download a backup regularly so nothing is lost if browser data is cleared.</p>
      <div class="small" style="font-weight:600">${persisted ? '✓ Protected from automatic clearing' : 'The browser may clear data when storage runs low.'}</div>
      ${persisted ? '' : '<button class="btn btn-ghost btn-block" data-act="persist">Protect my data</button>'}
      <button class="btn btn-primary btn-block" data-act="exportCsv">${svg(I.download, 18)} Export events (CSV)</button>
      <button class="btn btn-ghost btn-block" data-act="exportScores">${svg(I.download, 18)} Export scores (CSV)</button>
      <button class="btn btn-ghost btn-block" data-act="backup">${svg(I.download, 18)} Download full backup</button>
      <label class="btn btn-ghost btn-block">${svg(I.upload, 18)} Restore from backup<input type="file" accept="application/json,.json" class="sr-only" data-change="restore"></label>
    </section>
    ${deferredInstall ? `<button class="btn btn-ghost btn-block" data-act="install">${svg(I.install, 18)} Install the app</button>` : ''}
    <p class="small muted" style="text-align:center">CMAI Tracker ${APP_VERSION} · works offline</p>
  </main>`;
}

// ---------- toast & dialog ----------
let toastTimer;
function toast(text, actions = [], ms = 5000) {
  clearTimeout(toastTimer);
  toastEl.innerHTML = `<div class="toast" role="status"><span class="ok">${svg(I.check, 16, '#0B1730', 3)}</span><span class="grow small">${text}</span>
    ${actions.map((a) => `<button data-act="${a.act}" ${Object.entries(a.data || {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')}>${esc(a.label)}</button>`).join('')}</div>`;
  toastTimer = setTimeout(() => { toastEl.innerHTML = ''; }, ms);
}
const hideToast = () => { clearTimeout(toastTimer); toastEl.innerHTML = ''; };

function dialog(html) {
  dialogEl.innerHTML = `<form method="dialog">${html}</form>`;
  dialogEl.returnValue = '';
  dialogEl.showModal();
  dialogEl.querySelector('[autofocus]')?.focus();
  return new Promise((res) => { dialogEl.onclose = () => res(dialogEl.returnValue); });
}
const val = (name) => dialogEl.querySelector(`[name="${name}"]`)?.value ?? '';
const dlgButtons = (ok, danger) => `<div class="dlg-actions"><button class="btn btn-ghost" value="cancel" formnovalidate>Cancel</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" value="ok">${ok}</button></div>`;
async function confirmDlg(title, text, ok = 'OK', danger = false) {
  return (await dialog(`<h2>${esc(title)}</h2><p class="muted" style="margin:0">${esc(text)}</p>${dlgButtons(esc(ok), danger)}`)) === 'ok';
}

// ---------- files ----------
function download(name, content, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const csvCell = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = (rows) => '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\n');
const stamp = () => toDateInput(Date.now());

// ---------- actions ----------
const actions = {
  async install() { if (!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; render(); },
  cat(el) { ui.cat = el.dataset.cat; ui.search = ''; render(); },
  async rec(el) {
    const item = ITEM_BY_ID[el.dataset.item];
    const e = { id: uid(), patientId: el.dataset.pid, itemId: item.id, ts: Date.now(), caregiverId: me.id, caregiverName: me.name };
    await db.put('events', e);
    navigator.vibrate?.(25);
    toast(`<strong>${esc(item.short)}</strong> recorded · ${fmtTime(e.ts)}`, [{ label: 'Time', act: 'editTime', data: { id: e.id } }, { label: 'Undo', act: 'undo', data: { id: e.id } }], 6000);
    render();
  },
  async undo(el) { await db.del('events', el.dataset.id); hideToast(); toast('Removed'); render(); },
  async editTime(el) {
    const e = await db.get('events', el.dataset.id);
    if (!e) return;
    hideToast();
    const r = await dialog(`<h2>Change time</h2><p class="muted small" style="margin:0 0 .75rem">${esc(ITEM_BY_ID[e.itemId].short)}</p>
      <label class="sr-only" for="dt">Date and time</label><input class="input" id="dt" name="dt" type="datetime-local" value="${toDateTimeInput(e.ts)}" max="${toDateTimeInput(Date.now())}" required autofocus>${dlgButtons('Save')}`);
    if (r !== 'ok' || !val('dt')) return;
    const t = new Date(val('dt')).getTime();
    if (Number.isNaN(t) || t > Date.now() + 60000) { toast('That time is in the future.'); return; }
    await db.put('events', { ...e, ts: t });
    toast(`Time changed to ${fmtDay(t)}, ${fmtTime(t)}`);
    render();
  },
  period(el) { ui.period[el.dataset.id] = Number(el.dataset.to); ui.chartSel = null; delete ui.reportDay[el.dataset.id]; delete ui.historyDay[el.dataset.id]; render(); },
  toggleGroup(el) { ui.open[el.dataset.g] = !ui.open[el.dataset.g]; render(); },
  openAll(el) { for (const g of GROUPS) ui.open[g.id] = el.dataset.v === '1'; render(); },
  async rate(el) {
    const { pid, period, item, n } = el.dataset;
    await db.put('overrides', { key: `${pid}|${period}|${item}`, patientId: pid, period: Number(period), itemId: Number(item), rating: Number(n), by: me.id, at: Date.now() });
    render();
  },
  async unrate(el) { const { pid, period, item } = el.dataset; await db.del('overrides', `${pid}|${period}|${item}`); render(); },
  reportMode(el) { ui.reportMode = el.dataset.v; ui.chartSel = null; render(); },
  reportDay(el) { ui.reportDay[el.dataset.id] = Number(el.dataset.t); ui.chartSel = null; render(); },
  chartSel(el) { const i = Number(el.dataset.i); ui.chartSel = ui.chartSel === i ? null : i; render(); },
  historyAll(el) { delete ui.historyDay[el.dataset.id]; render(); },
  async delEvent(el) {
    const e = await db.get('events', el.dataset.id);
    if (!e) return;
    if (!(await confirmDlg('Delete this event?', `${ITEM_BY_ID[e.itemId].short} · ${fmtDay(e.ts)}, ${fmtTime(e.ts)}`, 'Delete', true))) return;
    await db.del('events', e.id);
    toast('Event deleted', [{ label: 'Undo', act: 'restoreEvent', data: { json: JSON.stringify(e) } }]);
    render();
  },
  async restoreEvent(el) { await db.put('events', JSON.parse(el.dataset.json)); hideToast(); render(); },
  async rename() {
    const r = await dialog(`<h2>Change my name</h2><label class="sr-only" for="nm">Name</label><input class="input" id="nm" name="nm" value="${esc(me.name)}" maxlength="40" required autofocus>${dlgButtons('Save')}`);
    const name = val('nm').trim();
    if (r !== 'ok' || !name) return;
    const taken = (await db.all('caregivers')).some((c) => c.id !== me.id && c.name.toLowerCase() === name.toLowerCase());
    if (taken) { toast('Another caregiver already uses that name.'); return; }
    await db.put('caregivers', { ...me, name });
    toast('Name updated'); render();
  },
  async changePin() {
    const r = await dialog(`<h2>Change my PIN</h2><div class="form">
      <div class="field"><label for="p0">Current PIN</label><input class="input pin" id="p0" name="p0" type="password" inputmode="numeric" maxlength="8" autocomplete="current-password" autofocus></div>
      <div class="field"><label for="p1">New PIN (4–8 digits)</label><input class="input pin" id="p1" name="p1" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password"></div>
      <div class="field"><label for="p2">Repeat new PIN</label><input class="input pin" id="p2" name="p2" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password"></div></div>${dlgButtons('Save')}`);
    if (r !== 'ok') return;
    const [p0, p1, p2] = [val('p0'), val('p1'), val('p2')];
    if ((await hashPin(p0, me.salt)) !== me.pinHash) { toast('Current PIN is not correct.'); return; }
    if (!/^\d{4,8}$/.test(p1)) { toast('The new PIN must be 4–8 digits.'); return; }
    if (p1 !== p2) { toast('The new PINs do not match.'); return; }
    const salt = newSalt();
    await db.put('caregivers', { ...me, salt, pinHash: await hashPin(p1, salt) });
    toast('PIN changed');
  },
  async renamePatient(el) {
    const p = await db.get('patients', el.dataset.id);
    if (!p || !isMine(p)) return;
    const r = await dialog(`<h2>Rename patient</h2><p class="muted small" style="margin:0 0 .75rem">All records stay with the patient under the new ID.</p>
      <label class="sr-only" for="nid">New patient ID</label><input class="input" id="nid" name="nid" value="${esc(p.id)}" maxlength="20" autocomplete="off" autocapitalize="characters" required autofocus>${dlgButtons('Save')}`);
    const nid = val('nid').trim().replace(/\s+/g, '-');
    if (r !== 'ok' || !nid || nid === p.id) return;
    if (await db.get('patients', nid)) { toast('A patient with this ID already exists on this device.'); return; }
    await db.put('patients', { ...p, id: nid });
    for (const e of await db.eventsFor(p.id)) await db.put('events', { ...e, patientId: nid });
    for (const o of (await db.all('overrides')).filter((o) => o.patientId === p.id)) {
      await db.del('overrides', o.key);
      await db.put('overrides', { ...o, key: `${nid}|${o.period}|${o.itemId}`, patientId: nid });
    }
    await db.del('patients', p.id);
    for (const m of [ui.period, ui.reportDay, ui.historyDay]) delete m[p.id];
    toast(`Patient ${esc(p.id)} renamed to ${esc(nid)}`); render();
  },
  async movePatient(el) {
    const p = await db.get('patients', el.dataset.id);
    if (!p || !isMine(p)) return;
    const others = (await db.all('caregivers')).filter((c) => c.id !== me.id).sort((a, b) => a.name.localeCompare(b.name));
    if (!others.length) { toast('There is no other caregiver on this device yet.'); return; }
    const r = await dialog(`<h2>Move patient ${esc(p.id)}</h2><p class="muted small" style="margin:0 0 .75rem">The patient and all of their records go to the caregiver you choose. It will no longer appear in your list.</p>
      <label class="small" for="to" style="font-weight:600">Move to</label>
      <select class="input" id="to" name="to" style="margin-top:.4rem" autofocus>${others.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select>${dlgButtons('Move')}`);
    if (r !== 'ok') return;
    const to = others.find((c) => c.id === val('to'));
    if (!to) return;
    await db.put('patients', { ...p, ownerId: to.id, movedAt: Date.now(), movedFrom: me.id });
    toast(`Patient ${esc(p.id)} moved to ${esc(to.name)}`, [{ label: 'Undo', act: 'undoMove', data: { id: p.id } }]);
    render();
  },
  async undoMove(el) {
    const p = await db.get('patients', el.dataset.id);
    if (!p || p.movedFrom !== me.id) return;
    await db.put('patients', { ...p, ownerId: me.id });
    hideToast(); toast('Move undone'); render();
  },
  async deletePatient(el) {
    const p = await db.get('patients', el.dataset.id);
    if (!p || !isMine(p)) return;
    const evs = await db.eventsFor(p.id);
    const r = await dialog(`<h2>Delete patient ${esc(p.id)}?</h2><p class="muted small" style="margin:0 0 .75rem">This permanently deletes the patient, ${plural(evs.length, 'event')} and all scores. It cannot be undone. Download a backup first if you may need them.</p>
      <label class="small" for="cf" style="font-weight:600">Type <strong>${esc(p.id)}</strong> to confirm</label>
      <input class="input" id="cf" name="cf" autocomplete="off" autocapitalize="characters" style="margin-top:.4rem" autofocus>${dlgButtons('Delete', true)}`);
    if (r !== 'ok') return;
    if (val('cf').trim() !== p.id) { toast('The ID did not match. Nothing was deleted.'); return; }
    for (const e of evs) await db.del('events', e.id);
    for (const o of (await db.all('overrides')).filter((o) => o.patientId === p.id)) await db.del('overrides', o.key);
    await db.del('patients', p.id);
    for (const m of [ui.period, ui.reportDay, ui.historyDay]) delete m[p.id];
    toast(`Patient ${esc(p.id)} deleted`); render();
  },
  signOut() { LS.del('session'); ui.period = {}; go('#/'); },
  async persist() { const ok = await navigator.storage?.persist?.(); toast(ok ? 'Your data is now protected.' : 'The browser did not allow it yet. Installing the app usually helps.'); render(); },
  async exportCsv() {
    const [events, patients] = await Promise.all([db.all('events'), db.all('patients')]);
    const pmap = Object.fromEntries(patients.map((p) => [p.id, p]));
    events.sort((a, b) => a.ts - b.ts);
    const rows = [['event_id', 'patient_id', 'period', 'day_of_period', 'item_number', 'behavior', 'group', 'timestamp_iso', 'local_date', 'local_time', 'caregiver']];
    for (const e of events) {
      const p = pmap[e.patientId]; const it = ITEM_BY_ID[e.itemId]; if (!p || !it) continue;
      const di = dayIndex(p.startDate, e.ts);
      rows.push([e.id, e.patientId, Math.floor(di / PERIOD_DAYS) + 1, (di % PERIOD_DAYS) + 1, it.id, it.name, GROUP_BY_ID[it.group].name, new Date(e.ts).toISOString(), toDateInput(e.ts), fmtTime(e.ts), e.caregiverName || '']);
    }
    download(`cmai-events-${stamp()}.csv`, csv(rows), 'text/csv');
  },
  async exportScores() {
    const [patients, allEv, allOv] = await Promise.all([db.all('patients'), db.all('events'), db.all('overrides')]);
    const rows = [['patient_id', 'period', 'period_start', 'period_end', 'item_number', 'behavior', 'group', 'events', 'rating', 'rating_source', 'group_score', 'total_score']];
    for (const p of patients) {
      const evs = allEv.filter((e) => e.patientId === p.id);
      for (let i = 0; i <= currentPeriodIndex(p); i++) {
        const per = periodOf(p, i);
        const ov = {}; for (const o of allOv) if (o.patientId === p.id && o.period === i) ov[o.itemId] = o.rating;
        const sc = computeScores(inRange(evs, per.start, per.end), ov);
        const gs = Object.fromEntries(sc.groups.map((g) => [g.id, g.score]));
        for (const it of sc.items) rows.push([p.id, i + 1, toDateInput(per.start), toDateInput(addDays(per.end, -1)), it.id, it.name, GROUP_BY_ID[it.group].name, it.count, it.rating, it.manual ? 'manual' : 'auto', gs[it.group], sc.total]);
      }
    }
    download(`cmai-scores-${stamp()}.csv`, csv(rows), 'text/csv');
  },
  async backup() { download(`cmai-backup-${stamp()}.json`, JSON.stringify(await exportAll(), null, 1), 'application/json'); }
};

const changes = {
  text(el) { prefs.text = el.value; LS.set('text', el.value); applyPrefs(); },
  theme(el) { prefs.theme = el.value; LS.set('theme', el.value); applyPrefs(); },
  reportDay(el) { if (el.value) { ui.reportDay[el.dataset.id] = fromDateInput(el.value); ui.chartSel = null; render(); } },
  historyDay(el) { if (el.value) ui.historyDay[el.dataset.id] = fromDateInput(el.value); else delete ui.historyDay[el.dataset.id]; render(); },
  async restore(el) {
    const file = el.files?.[0]; el.value = '';
    if (!file) return;
    let data;
    try { data = JSON.parse(await file.text()); } catch { toast('That file could not be read.'); return; }
    if (!(await confirmDlg('Restore this backup?', `Records from ${file.name} will be added to this device. Existing records with the same ID are replaced.`, 'Restore'))) return;
    try { await importAll(data); toast('Backup restored'); render(); } catch (err) { toast(esc(err.message)); }
  }
};

const forms = {
  async newCaregiver(f) {
    const name = f.name.value.trim(); const pin = f.pin.value; const pin2 = f.pin2.value;
    const cgs = await db.all('caregivers');
    if (!name) ui.error = 'Please enter your name.';
    else if (cgs.some((c) => c.name.toLowerCase() === name.toLowerCase())) ui.error = 'A caregiver with this name already exists.';
    else if (!/^\d{4,8}$/.test(pin)) ui.error = 'The PIN must be 4 to 8 digits.';
    else if (pin !== pin2) ui.error = 'The two PINs do not match.';
    else ui.error = '';
    if (ui.error) { render(); return; }
    const salt = newSalt();
    const cg = { id: uid(), name, salt, pinHash: await hashPin(pin, salt), createdAt: Date.now() };
    await db.put('caregivers', cg);
    LS.set('session', cg.id);
    navigator.storage?.persist?.().catch(() => {});
    go('#/patients');
  },
  async login(f) {
    const cg = await db.get('caregivers', f.dataset.id);
    if (!cg) { go('#/'); return; }
    if ((await hashPin(f.pin.value, cg.salt)) !== cg.pinHash) {
      ui.error = 'That PIN is not correct. Try again.'; await render(); document.getElementById('f-pin')?.focus(); return;
    }
    ui.error = '';
    LS.set('session', cg.id);
    navigator.storage?.persist?.().catch(() => {});
    go('#/patients');
  },
  async newPatient(f) {
    const id = f.id.value.trim().replace(/\s+/g, '-');
    const start = f.start.value ? fromDateInput(f.start.value) : startOfDay(Date.now());
    if (!id) ui.error = 'Please enter a patient ID.';
    else if (await db.get('patients', id)) ui.error = 'A patient with this ID already exists on this device. Choose another ID.';
    else if (start > Date.now()) ui.error = 'The first day cannot be in the future.';
    else ui.error = '';
    if (ui.error) { render(); return; }
    await db.put('patients', { id, startDate: start, createdAt: Date.now(), createdBy: me.id, ownerId: me.id });
    go(`#/p/${enc(id)}/record`);
  }
};

// ---------- event wiring ----------
document.addEventListener('click', (ev) => {
  document.querySelectorAll('details.switch[open]').forEach((d) => { if (!d.contains(ev.target)) d.open = false; });
  const el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) { ev.preventDefault(); fn(el); }
});
document.addEventListener('change', (ev) => {
  const el = ev.target.closest('[data-change]');
  if (el && changes[el.dataset.change]) changes[el.dataset.change](el);
});
document.addEventListener('submit', (ev) => {
  const f = ev.target.closest('[data-form]');
  if (f && forms[f.dataset.form]) { ev.preventDefault(); forms[f.dataset.form](f); }
});
document.addEventListener('input', async (ev) => {
  if (ev.target.id !== 'search') return;
  ui.search = ev.target.value;
  const p = await db.get('patients', ev.target.dataset.pid);
  const events = await db.eventsFor(p.id);
  document.getElementById('tiles').innerHTML = tileList(p, events, periodOf(p, currentPeriodIndex(p)));
  document.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(!ui.search && c.dataset.cat === ui.cat)));
});

document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') document.querySelectorAll('details.switch[open]').forEach((d) => { d.open = false; d.querySelector('summary')?.focus(); }); });
window.addEventListener('hashchange', () => { ui.chartSel = null; ui.error = ''; hideToast(); render(); });
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; const [r] = route(); if (!r || r === 'settings') render(); });
window.addEventListener('appinstalled', () => { deferredInstall = null; });
// Re-render when the app comes back to the foreground (dates, "today", periods may have moved on).
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !dialogEl.open) render(); });

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw?.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) toast('A new version is ready.', [{ label: 'Reload', act: 'reload' }], 15000);
      });
    });
  }).catch((err) => console.warn('SW registration failed', err));
}
actions.reload = () => location.reload();

render();
