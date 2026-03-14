-- JurisTrack - Schema
-- Prefixo: jt_

-- Usuários (espelha auth.users do Supabase)
create table jt_usuarios (
  id uuid references auth.users(id) on delete cascade primary key,
  nome text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'advogado')) default 'advogado',
  ativo boolean not null default true,
  created_at timestamptz default now()
);

-- Processos (sem responsavel_id direto — usa tabela de relacionamento)
create table jt_processos (
  id uuid default gen_random_uuid() primary key,
  numero_cnj text not null,
  tribunal text not null,
  cliente text not null,
  pasta text,
  discussao text,
  andamento_atual text,
  data_andamento timestamptz,
  status text not null check (status in ('ativo', 'arquivado')) default 'ativo',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Relacionamento processo ↔ responsáveis (muitos para muitos)
create table jt_processo_responsaveis (
  processo_id uuid references jt_processos(id) on delete cascade,
  usuario_id  uuid references jt_usuarios(id) on delete cascade,
  primary key (processo_id, usuario_id)
);

-- Histórico de andamentos
create table jt_andamentos (
  id uuid default gen_random_uuid() primary key,
  processo_id uuid references jt_processos(id) on delete cascade,
  descricao text not null,
  data_andamento timestamptz not null,
  detectado_em timestamptz default now()
);

-- Log de monitoramentos
create table jt_monitoramentos (
  id uuid default gen_random_uuid() primary key,
  iniciado_em timestamptz default now(),
  finalizado_em timestamptz,
  total_processos integer default 0,
  total_mudancas integer default 0,
  total_nao_encontrados integer default 0,
  iniciado_por uuid references jt_usuarios(id),
  status text not null check (status in ('rodando', 'concluido', 'erro')) default 'rodando'
);

-- Indexes
create index on jt_processos(status);
create index on jt_processos(tribunal);
create index on jt_processo_responsaveis(usuario_id);
create index on jt_andamentos(processo_id);
create index on jt_andamentos(data_andamento desc);

-- RLS
alter table jt_usuarios enable row level security;
alter table jt_processos enable row level security;
alter table jt_processo_responsaveis enable row level security;
alter table jt_andamentos enable row level security;
alter table jt_monitoramentos enable row level security;

-- Políticas
create policy "usuarios: leitura própria ou admin"
  on jt_usuarios for select
  using (
    id = auth.uid() or
    exists (select 1 from jt_usuarios where id = auth.uid() and role = 'admin')
  );

create policy "processos: admin vê todos"
  on jt_processos for all
  using (
    exists (select 1 from jt_usuarios where id = auth.uid() and role = 'admin')
  );

create policy "processos: advogado vê os seus"
  on jt_processos for select
  using (
    exists (
      select 1 from jt_processo_responsaveis
      where processo_id = id and usuario_id = auth.uid()
    )
  );

create policy "responsaveis: admin gerencia"
  on jt_processo_responsaveis for all
  using (
    exists (select 1 from jt_usuarios where id = auth.uid() and role = 'admin')
  );

create policy "responsaveis: advogado lê os seus"
  on jt_processo_responsaveis for select
  using (usuario_id = auth.uid());

create policy "andamentos: via processo permitido"
  on jt_andamentos for select
  using (
    exists (
      select 1 from jt_processos p
      left join jt_processo_responsaveis r on r.processo_id = p.id
      where p.id = processo_id
        and (r.usuario_id = auth.uid() or
             exists (select 1 from jt_usuarios where id = auth.uid() and role = 'admin'))
    )
  );

create policy "monitoramentos: só admin"
  on jt_monitoramentos for all
  using (
    exists (select 1 from jt_usuarios where id = auth.uid() and role = 'admin')
  );

-- Trigger: cria registro em jt_usuarios quando novo auth.user é criado
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into jt_usuarios (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'advogado')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
