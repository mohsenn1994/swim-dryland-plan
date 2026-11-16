# Swim & Dry-Land 12-Week Plan

Source for the 12-week swim, gym and nutrition plan for Ahmed and Yousr
(Sat 28 Nov 2026 – Fri 19 Feb 2027). The live version runs as a Claude artifact:
https://claude.ai/artifact/GcRNTprefLVVgmUgmCqX88

## Files

| File | What's in it |
|---|---|
| `index.html` | Page shell, styles (light + dark), dialogs |
| `app.js` | All app logic: Today checklist, day/week/month views, workout mode, timer, logs, analytics, shopping list, backup |
| `data.js` | Exercise poses, exercise library, the four sessions, warm-ups, base day plans |
| `data2.js` | Meals (grams + household units), Ramadan plan, key lifts, supplements, benchmarks, weigh-in schedule, conversions |
| `data3.js` | Muscle targets, tagged alternatives, recipes, Yousr's stack |
| `data4.js` | Bloodwork, badges, session purposes, trims, whey-free defaults |
| `data5.js` | Missed/sick rules, home versions, flex meals and free days |

Load order matters: `data.js` → `data2.js` → `data3.js` → `data4.js` → `data5.js` → `app.js`.

## Running it

Open `index.html` in a browser. Everything renders, but saving falls back to
**this browser only** (localStorage). The shared log between both of you uses
Claude's artifact storage (`window.claude.use('db')`), which only exists on claude.ai.

To run it independently with a shared log, replace the store functions in `app.js`
(`put`, `del`, `putCfg`, `initDb`) with a backend such as Supabase or Firebase.

## Data

Logs live in the artifact's database, not in this repo. Use
Progress → Overview → "Everything" to download a JSON backup.
