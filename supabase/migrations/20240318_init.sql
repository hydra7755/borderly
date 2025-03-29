-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing functions and triggers first
drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_updated_at() cascade;

-- Create the handle_updated_at function before we need it
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Drop existing tables if they exist (in correct order to handle dependencies)
drop table if exists documents cascade;
drop table if exists saved_countries cascade;
drop table if exists travel_history cascade;
drop table if exists subscriptions cascade;
drop table if exists upcoming_trips cascade;
drop table if exists profiles cascade;

-- First create all tables
-- Create profiles table without foreign key constraint initially
create table profiles (
    id uuid primary key,
    email text unique,
    full_name text,
    nationality text,
    residency text,
    travel_score int8 default 0,
    subscription_tier text default 'free',
    questionnaire_completed boolean default false,
    created_at timestamptz default timezone('utc'::text, now()),
    updated_at timestamptz default timezone('utc'::text, now()),
    role text default 'user'
);

-- Create subscriptions table
create table subscriptions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id) on delete cascade,
    plan_type text not null,
    start_date timestamptz default timezone('utc'::text, now()),
    end_date timestamptz,
    status text default 'active',
    created_at timestamptz default timezone('utc'::text, now()),
    updated_at timestamptz default timezone('utc'::text, now())
);

-- Create upcoming_trips table
create table upcoming_trips (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id) on delete cascade,
    destination text not null,
    start_date timestamptz not null,
    end_date timestamptz,
    status text default 'planned',
    created_at timestamptz default timezone('utc'::text, now()),
    updated_at timestamptz default timezone('utc'::text, now())
);

-- Create travel_history table
create table travel_history (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id) on delete cascade,
    country_code text not null,
    visit_date timestamptz default timezone('utc'::text, now()),
    created_at timestamptz default timezone('utc'::text, now())
);

-- Create saved_countries table
create table saved_countries (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id) on delete cascade,
    country_code text not null,
    created_at timestamptz default timezone('utc'::text, now()),
    unique(user_id, country_code)
);

-- Create documents table
create table documents (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id) on delete cascade,
    name text not null,
    type text not null,
    url text not null,
    size int8,
    expiry_date timestamptz,
    uploaded_at timestamptz default timezone('utc'::text, now()),
    created_at timestamptz default timezone('utc'::text, now())
);

-- Now add the auth foreign key if auth.users exists
do $$
begin
    if exists (
        select 1 from information_schema.tables 
        where table_schema = 'auth' 
        and table_name = 'users'
    ) then
        alter table profiles
        add constraint profiles_id_fkey
        foreign key (id)
        references auth.users(id);
    end if;
end $$;

-- Now create all triggers
create trigger handle_profiles_updated_at
    before update on profiles
    for each row execute procedure public.handle_updated_at();

create trigger handle_subscriptions_updated_at
    before update on subscriptions
    for each row execute procedure public.handle_updated_at();

create trigger handle_upcoming_trips_updated_at
    before update on upcoming_trips
    for each row execute procedure public.handle_updated_at();

create trigger handle_documents_updated_at
    before update on documents
    for each row execute procedure public.handle_updated_at();

-- Now enable RLS on all tables
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table upcoming_trips enable row level security;
alter table travel_history enable row level security;
alter table saved_countries enable row level security;
alter table documents enable row level security;

-- Now create all policies
create policy "Users can view own profile"
    on profiles for select
    using ( auth.uid() = id );

create policy "Users can update own profile"
    on profiles for update
    using ( auth.uid() = id );

create policy "Users can view own subscriptions"
    on subscriptions for select
    using ( auth.uid() = user_id );

create policy "Users can update own subscriptions"
    on subscriptions for update
    using ( auth.uid() = user_id );

create policy "Users can view own trips"
    on upcoming_trips for select
    using ( auth.uid() = user_id );

create policy "Users can insert own trips"
    on upcoming_trips for insert
    with check ( auth.uid() = user_id );

create policy "Users can update own trips"
    on upcoming_trips for update
    using ( auth.uid() = user_id );

create policy "Users can delete own trips"
    on upcoming_trips for delete
    using ( auth.uid() = user_id );

create policy "Users can view own travel history"
    on travel_history for select
    using ( auth.uid() = user_id );

create policy "Users can insert own travel history"
    on travel_history for insert
    with check ( auth.uid() = user_id );

create policy "Users can delete own travel history"
    on travel_history for delete
    using ( auth.uid() = user_id );

create policy "Users can view own saved countries"
    on saved_countries for select
    using ( auth.uid() = user_id );

create policy "Users can insert own saved countries"
    on saved_countries for insert
    with check ( auth.uid() = user_id );

create policy "Users can delete own saved countries"
    on saved_countries for delete
    using ( auth.uid() = user_id );

create policy "Users can view own documents"
    on documents for select
    using ( auth.uid() = user_id );

create policy "Users can insert own documents"
    on documents for insert
    with check ( auth.uid() = user_id );

create policy "Users can update own documents"
    on documents for update
    using ( auth.uid() = user_id );

create policy "Users can delete own documents"
    on documents for delete
    using ( auth.uid() = user_id );

-- Finally, create the new user handler function and trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, full_name)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', 'New User')
    );
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation if auth.users exists
do $$
begin
    if exists (
        select 1 from information_schema.tables 
        where table_schema = 'auth' 
        and table_name = 'users'
    ) then
        drop trigger if exists on_auth_user_created on auth.users;
        create trigger on_auth_user_created
            after insert on auth.users
            for each row execute procedure public.handle_new_user();
    end if;
end $$; 