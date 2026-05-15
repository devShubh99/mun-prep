-- Run this in your Supabase SQL Editor
-- Creates all tables + Row Level Security policies

-- Conferences
create table if not exists conferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  assigned_country text not null default '',
  committee text not null default '',
  topic text not null default '',
  special_role text,
  deadline date,
  cheat_sheet_data jsonb,
  research_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table conferences enable row level security;

create policy "Users own their conferences" on conferences
  for all using (auth.uid() = user_id);

create policy "Users can insert their own conferences" on conferences
  for insert with check (auth.uid() = user_id);

-- Documents
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references conferences(id) on delete cascade,
  title text not null default 'Untitled',
  content text not null default '{}',
  archived boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table documents enable row level security;

create policy "Users own their documents" on documents
  for all using (
    conference_id in (select id from conferences where user_id = auth.uid())
  );

create policy "Users can insert documents" on documents
  for insert with check (
    conference_id in (select id from conferences where user_id = auth.uid())
  );

-- Debate Q&A
create table if not exists debate_qa (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references conferences(id) on delete cascade,
  role text not null default '',
  question text not null,
  user_answer text,
  evaluation jsonb,
  created_at timestamptz default now()
);

alter table debate_qa enable row level security;

create policy "Users own their debate_qa" on debate_qa
  for all using (
    conference_id in (select id from conferences where user_id = auth.uid())
  );

create policy "Users can insert debate_qa" on debate_qa
  for insert with check (
    conference_id in (select id from conferences where user_id = auth.uid())
  );

-- Research chat messages
create table if not exists research_chat_messages (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references conferences(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

alter table research_chat_messages enable row level security;

create policy "Users own their research_chat" on research_chat_messages
  for all using (
    conference_id in (select id from conferences where user_id = auth.uid())
  );

create policy "Users can insert research_chat" on research_chat_messages
  for insert with check (
    conference_id in (select id from conferences where user_id = auth.uid())
  );
