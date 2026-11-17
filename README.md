# Swim & Dry-Land 12-Week Plan

A 12-week swim, gym and nutrition plan for Ahmed and Yousr (Sat 28 Nov 2026 – Fri 19 Feb 2027),
built as a static web app with a shared log. Hosting is Cloudflare Pages and the backend is Supabase,
both on free tiers.

## How it works

- Plain HTML + JS, no build step.
- `config.js` decides where data is saved:
  - **Supabase config filled in:** sign-in by email, and a shared log that syncs live between both of you.
  - **`null`:** saves in this browser only (good for trying it locally).
- `supabase/schema.sql` creates one `docs` table (every log entry is a JSON row), an allow-list of
  the two emails, and row-level security so nobody else can read or write.

## Setup (about 15 minutes)

### 1. Supabase (database + sign-in)
1. Create a free project at supabase.com.
2. **SQL Editor:** paste `supabase/schema.sql`, put both your emails in the `insert` (lowercase), run it.
3. **Authentication → Email Templates → Magic Link:** add the line `Your code: {{ .Token }}` so the
   email includes a 6-digit code (handy on phones where the link opens a different browser).
4. **Project Settings → API:** copy the Project URL and the `anon` public key.

### 2. Connect the app
Edit `config.js`:
```js
window.SUPABASE_CONFIG = { url: 'https://YOUR-PROJECT.supabase.co', anonKey: 'YOUR-ANON-KEY' };
```
The anon key is meant to be public; the database rules protect the data. Commit and push.

### 3. Cloudflare Pages (hosting)
1. dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git → pick this repo.
2. Framework preset: **None**. Build command: *(empty)*. Output directory: **/**.
3. Deploy. You get `https://<name>.pages.dev`.

### 4. Tell Supabase your site address
Supabase → **Authentication → URL Configuration**: set **Site URL** to your `pages.dev` address and
add it under **Redirect URLs**.

### 5. Move your data over from the Claude version
1. In the claude.ai version: Progress → Overview → **Everything** (downloads a .json backup).
2. In the new site, sign in, then go to Progress → Overview → **Import a backup** and choose that file.

### 6. On your phones
Open the `pages.dev` link, sign in with your email, then Share → **Add to Home Screen**.

## Files

| File | What's in it |
|---|---|
| `index.html` | Page shell, styles (light + dark), dialogs, sign-in screen |
| `config.js` | Supabase connection (or `null` for browser-only) |
| `app.js` | App logic: Today checklist, views, workout mode, timer, logs, analytics, shopping list, backup/import, storage (Supabase / claude.ai / local) |
| `data.js` … `data5.js` | Plan content: exercises, sessions, meals, recipes, Ramadan, supplements, tests, bloodwork, rules |
| `supabase/schema.sql` | Database table, allow-list and security rules |

Load order: `config.js` → Supabase library → `data.js` → `data2.js` → `data3.js` → `data4.js` → `data5.js` → `app.js`.

## Running locally
Open `index.html`, or run `python3 -m http.server 8000` and visit http://localhost:8000.
For sign-in to work locally, add `http://localhost:8000` to Supabase's Redirect URLs.

## Adding or removing a person
Supabase → Table Editor → `allowed_users`: add or delete the email.
