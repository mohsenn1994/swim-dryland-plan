/* Supabase connection for the shared log.
   Leave as null to run without a backend (entries save in this browser only).
   Fill in from Supabase → Project Settings → API. The anon key is safe to publish:
   the database rules in supabase/schema.sql decide who can read and write. */
window.SUPABASE_CONFIG = null;
// window.SUPABASE_CONFIG = { url: 'https://YOUR-PROJECT.supabase.co', anonKey: 'YOUR-ANON-KEY' };
