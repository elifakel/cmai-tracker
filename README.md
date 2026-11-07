# CMAI Tracker (PWA)

A Progressive Web App for recording agitation behaviors in dementia/Alzheimer's care using the **CMAI** (Cohen-Mansfield Agitation Inventory). It runs on Android, iPhone, tablets and desktop. It can be installed to the home screen, works offline, and **all data stays on the device**: nothing is sent to a server.

**Live app:** https://elifakel.github.io/cmai-tracker/

## Features
- Caregiver accounts with PIN login (PINs are never stored in plain text; they are hashed with PBKDF2-SHA256 and a random salt)
- Patient list: each patient has their own 14-day periods, a mini activity chart and the current CMAI total
- **Record:** all 29 CMAI behaviors in 4 groups, search, "most recorded" shortcuts, plus *Undo* and *Time* (change the time) after each entry
- **Score:** total score (29–203), group scores and a 1–7 rating per item. Ratings are calculated automatically from recorded events and can be overridden manually.
- **Report:** 14-day and hourly charts, busiest day/hour, behavior breakdown
- **History:** filter by day, edit times, delete entries (with undo)
- **Settings:** change name and PIN, text size (3 levels), light/dark theme
- **Data export:** events as CSV, scores as CSV, full JSON backup and restore from backup

## Project structure
```
index.html            app shell
manifest.webmanifest  install info (name, icons, colors)
sw.js                 service worker (offline support)
css/styles.css        styles
js/app.js             screens and interactions
js/db.js              IndexedDB, PIN hashing, period calculations, backup
js/cmai.js            the 29 items, groups and scoring rule
icons/                app icons
```
No build step: no framework and no `npm install`. Plain HTML/CSS/JS (ES modules).

## Running locally
Service workers don't run over `file://`, so start a small local server:
```bash
cd cmai-tracker
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser. For a phone-sized view, use Chrome DevTools → Device toolbar.

## Deploying to GitHub Pages (free)
1. Upload the contents of this folder to a GitHub repository, keeping the `css/`, `js/` and `icons/` folders.
2. Repo → **Settings → Pages** → *Source: Deploy from a branch* → `main` / `(root)` → Save.
3. After a minute or two the app is live at `https://<username>.github.io/<repo-name>/`.
4. Open the link on a phone:
   - **Android (Chrome):** menu → *Install app / Add to Home screen*
   - **iPhone (Safari):** Share → *Add to Home Screen*

> All paths are relative (`./`), so the app works when served from a subfolder.

## Publishing an update
Whenever you change a file, also bump `VERSION` in `sw.js` (e.g. `cmai-v1.0.1`). Phones will then download the new version and show a "A new version is ready · Reload" notice in the app.

## Data safety: important
- Data is stored in the browser's IndexedDB. If browser data is cleared, the records are deleted.
- Install the app to the home screen and tap **Protect my data** in Settings (requests persistent storage).
- **Make regular backups with "Download full backup".** A backup can be loaded on another device with "Restore from backup".
- Use study codes (e.g. P001) instead of real patient names.
- Check how and where data is stored against your IRB protocol.

## Scoring rule
The `ratingFromCount` function in `js/cmai.js` converts the number of events in a 14-day period into a 1–7 rating:

| Events (14 days) | Rating |
|---|---|
| 0 | 1 – Never |
| 1 | 2 – Less than once a week |
| 2–4 | 3 – Once or twice a week |
| 5–13 | 4 – Several times a week |
| 14–28 | 5 – Once or twice a day |
| 29–223 | 6 – Several times a day |
| 224+ | 7 – Several times an hour |

To use a different rule, change only this function. The item-to-group mapping is in the same file (`ITEMS`).
