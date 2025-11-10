import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import 'react-native-url-polyfill/auto';

const envUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL;
const envKey  = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const extra   = (Constants?.expoConfig?.extra ?? {}) as any;
const extraUrl = extra.supabaseUrl;
const extraKey = extra.supabaseAnonKey;

// LOG: veja no console do Metro/terminal
console.log('[SUPABASE] URL/env:', envUrl?.slice(0, 30), '...'); 
console.log('[SUPABASE] URL/extra:', extraUrl?.slice(0, 30), '...');
console.log('[SUPABASE] KEY/env prefix:', envKey?.slice(0, 8));
console.log('[SUPABASE] KEY/extra prefix:', extraKey?.slice(0, 8));

const SUPABASE_URL =
  envUrl || extraUrl || '';
const SUPABASE_KEY =
  envKey || extraKey || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
