-- Cria tabela de contagem de pacotes
create table public.package_counts (
  id uuid primary key default gen_random_uuid(),
  nfe_key text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date_only date default current_date not null
);

-- Habilita RLS
alter table public.package_counts enable row level security;

-- Cria políticas de acesso (permite tudo para simplificar neste app operacional interno, 
-- idealmente restringiria se fosse público, mas para uso interno/local ok)
create policy "Enable all access for all users" on public.package_counts
for all using (true) with check (true);

-- Função para registrar chave com verificação de duplicidade (transactional)
-- Na verdade, a constraint UNIQUE já garante duplicidade, mas podemos criar uma função wrapper se quiser logica custom extra.
-- Mas vamos usar a API direta do supabase que lida com o erro 23505 (unique_violation).
