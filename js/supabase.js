// Supabase client — shared across all pages.
//
// Keys are injected at build time by Vite from environment variables.
// The ANON key is PUBLIC and safe to ship to the browser; it is NOT a secret.
// Row Level Security (see supabase-schema.sql) is what actually protects data.
//
// Set these in Vercel → Project → Settings → Environment Variables:
//   VITE_SUPABASE_URL       = https://YOUR-PROJECT.supabase.co
//   VITE_SUPABASE_ANON_KEY  = eyJ... (the "anon public" key)
//
// For local dev, put the same two lines in a .env file (see .env.example).

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If keys are missing we export null so the rest of the app degrades gracefully
// (cart falls back to localStorage-only, login button hides).
export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true, // needed for magic-link redirects
        },
      })
    : null;

export const isSupabaseEnabled = () => supabase !== null;
