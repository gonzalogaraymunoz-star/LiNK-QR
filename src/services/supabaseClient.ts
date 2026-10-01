import { createClient, SupabaseClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
    try {
      supabaseInstance = createClient(url, key);
    } catch (err) {
      console.error('Error instantiating Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase no está configurado. Especifica la URL y Anon Key.',
    };
  }

  try {
    const { error } = await client.from('personas').select('id').limit(1);
    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Conectado a Supabase con éxito (las tablas del esquema aún deben crearse en el SQL Editor).',
        };
      }
      return { success: false, message: `Error Supabase: ${error.message}` };
    }
    return { success: true, message: 'Conexión con Supabase verificada y tablas activas.' };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Fallo de conexión: ${errMsg}` };
  }
}
