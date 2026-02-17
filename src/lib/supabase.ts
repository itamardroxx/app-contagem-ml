import { createClient } from '@supabase/supabase-js';

// Hardcoding credentials to guarantee connection on Vercel
// This bypasses any env variable issues.
const supabaseUrl = 'https://nschvzzblbrmvebtjzvp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zY2h2enpibGJybXZlYnRqenZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjg0NTYsImV4cCI6MjA4Njg0NDQ1Nn0.Tgf61l6h07UZ5sXQWB0LssFWo9lv8eDEJjJVT-mUB9c';

let client;

try {
    client = createClient(supabaseUrl, supabaseAnonKey);
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
