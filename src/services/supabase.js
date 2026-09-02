import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qwqhnrhsifuonidcivnp.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cWhucmhzaWZ1b25pZGNpdm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMDA5MzAsImV4cCI6MjEwMzY3NjkzMH0.wHVE76deYiGbzdCO50GDzgFhJHnL7KRuKuegWNmq6r4';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;
