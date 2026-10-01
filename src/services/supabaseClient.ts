import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://zgbnjlrxzvzpigmwidsp.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_RE_eqhBaLeaUMHuBjLUY2Q_OZNBm9_A';

const envUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseConfig(): { url: string; key: string; isConfigured: boolean } {
  const localUrl = localStorage.getItem('link_supabase_url') || envUrl;
  const localKey = localStorage.getItem('link_supabase_key') || envKey;
  const isConfigured = Boolean(localUrl && localKey && localUrl.startsWith('https://'));
  return { url: localUrl, key: localKey, isConfigured };
}

export function saveSupabaseConfig(url: string, key: string) {
  if (url) localStorage.setItem('link_supabase_url', url.trim());
  else localStorage.removeItem('link_supabase_url');

  if (key) localStorage.setItem('link_supabase_key', key.trim());
  else localStorage.removeItem('link_supabase_key');

  supabaseInstance = null;
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseInstance;
}

export async function getCurrentSession(): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

export async function signInWithPassword(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function sendMagicLink(email: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) throw error;
}

export async function signOut() {
  const client = getSupabaseClient();
  if (!client) return;
  await client.auth.signOut();
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase no está configurado.',
    };
  }

  try {
    const { error } = await client.from('link_world_businesses').select('id').limit(1);
    if (error) return { success: false, message: `Error Supabase: ${error.message}` };
    return { success: true, message: 'Conexión con LINK CONTROL CENTRAL verificada.' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, message };
  }
}
