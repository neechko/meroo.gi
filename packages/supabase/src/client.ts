import { createClient, type SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from './database';

export function createSupabaseClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
  options?: SupabaseClientOptions<'public'>
) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or Anon Key.');
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey, options);
}