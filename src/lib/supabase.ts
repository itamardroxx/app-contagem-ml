import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client;

try {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn("Supabase credentials missing! Using fallback/mock client to prevent crash.");
        // Cria um client dummy ou tenta criar mesmo assim mas tratando erro
        client = createClient('https://placeholder.supabase.co', 'placeholder');
    } else {
        client = createClient(supabaseUrl, supabaseAnonKey);
    }
} catch (error) {
    console.error("Critical: Failed to initialize Supabase client", error);
    // Fallback extremo para não quebrar import
    client = {
        from: () => ({ select: () => ({ data: [], error: { message: "Client init failed" } }) }),
        channel: () => ({ on: () => ({ subscribe: () => { } }) }),
        removeChannel: () => { },
    } as any;
}

export const supabase = client;

export type PackageCount = {
    id: string;
    nfe_key: string;
    created_at: string;
    date_only: string;
};
