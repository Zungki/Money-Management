import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Client SDK is initialized only when the local environment has Supabase credentials. */
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
