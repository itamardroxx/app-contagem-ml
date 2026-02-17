-- Corrige permissões e RLS para package_counts
-- Rode isso no SQL Editor do Supabase

-- 1. Garante que a tabela existe (ja deve existir, mas ok)
CREATE TABLE IF NOT EXISTS public.package_counts (
  id uuid primary key default gen_random_uuid(),
  nfe_key text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date_only date default current_date not null
);

-- 2. Habilita RLS
ALTER TABLE public.package_counts ENABLE ROW LEVEL SECURITY;

-- 3. Limpa politicas antigas para evitar conflito
DROP POLICY IF EXISTS "Enable all access for all users" ON public.package_counts;
DROP POLICY IF EXISTS "Enable insert for anon" ON public.package_counts;
DROP POLICY IF EXISTS "Enable select for anon" ON public.package_counts;

-- 4. Cria política permissiva para inserção e leitura (ideal para app interno sem auth complexa)
CREATE POLICY "Enable all access for all users"
ON public.package_counts
FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Garante permissões para o role anon (importante!)
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON TABLE public.package_counts TO anon;
GRANT ALL ON TABLE public.package_counts TO authenticated;
GRANT ALL ON TABLE public.package_counts TO service_role;
