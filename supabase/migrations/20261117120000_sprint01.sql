-- Arku · Sprint 01: clientes, direcciones, jardines, fotos y cotizaciones.
--
-- Modelo de acceso:
-- * La app NO escribe en estas tablas. Todas las escrituras pasan por la función
--   `arku` (supabase/functions/arku), que aplica las reglas de @arku/domain en el
--   servidor (cobertura, cédula, cotización, precios) con la clave de servicio.
-- * Cada cliente solo puede LEER sus propias filas (RLS por auth.uid()).
-- * Las fotos viven en el bucket privado `jardines`, en una carpeta por cliente.
-- * Importes en centavos USD enteros (dentro de quotes.price).

create table public.customers (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text not null check (phone ~ '^09[0-9]{8}$'),
  first_name text not null check (char_length(first_name) between 2 and 60),
  last_name text not null check (char_length(last_name) between 2 and 60),
  id_number text not null check (id_number ~ '^[0-9]{10}$'),
  created_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key,
  customer_id uuid not null references public.customers (id) on delete cascade,
  label text not null check (label in ('Casa', 'Trabajo', 'Familia', 'Otra')),
  line text not null check (char_length(line) >= 5),
  reference text check (char_length(reference) <= 200),
  arrival_instructions text check (char_length(arrival_instructions) <= 300),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  coverage_zone_id text not null,
  created_at timestamptz not null default now()
);
create index addresses_customer_idx on public.addresses (customer_id);

create table public.gardens (
  id uuid primary key,
  customer_id uuid not null references public.customers (id) on delete cascade,
  address_id uuid not null references public.addresses (id) on delete restrict,
  name text not null check (char_length(name) between 2 and 40),
  size_band text not null check (size_band in ('S', 'M', 'L', 'XL')),
  access_notes text not null default '' check (char_length(access_notes) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index gardens_customer_idx on public.gardens (customer_id);

-- Solo la clave de almacenamiento privado; nunca una URL pública.
create table public.garden_photos (
  id uuid primary key,
  garden_id uuid not null references public.gardens (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  storage_key text not null unique check (split_part(storage_key, '/', 1) = customer_id::text),
  created_at timestamptz not null default now()
);
create index garden_photos_garden_idx on public.garden_photos (garden_id);

-- La copia congelada del jardín (snapshot) y el precio no cambian al editar el jardín.
create table public.quotes (
  id uuid primary key,
  customer_id uuid not null references public.customers (id) on delete cascade,
  garden_id uuid not null references public.gardens (id) on delete restrict,
  route text not null check (route in ('automatic', 'manual_review')),
  status text not null check (status in ('automatic', 'pending_review', 'ready', 'expired', 'accepted', 'declined')),
  snapshot jsonb not null,
  price jsonb check (
    price is null or (
      jsonb_typeof(price -> 'tariffCents') = 'number' and (price ->> 'tariffCents') ~ '^[0-9]+$' and
      jsonb_typeof(price -> 'minimumCents') = 'number' and (price ->> 'minimumCents') ~ '^[0-9]+$' and
      jsonb_typeof(price -> 'baseCents') = 'number' and (price ->> 'baseCents') ~ '^[0-9]+$'
    )
  ),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  responded_at timestamptz
);
create index quotes_customer_garden_idx on public.quotes (customer_id, garden_id);

-- RLS: lectura solo del dueño. Sin políticas de escritura: la app escribe a través de la función.
alter table public.customers enable row level security;
alter table public.addresses enable row level security;
alter table public.gardens enable row level security;
alter table public.garden_photos enable row level security;
alter table public.quotes enable row level security;

create policy "El cliente lee su perfil" on public.customers
  for select to authenticated using (id = (select auth.uid()));
create policy "El cliente lee sus direcciones" on public.addresses
  for select to authenticated using (customer_id = (select auth.uid()));
create policy "El cliente lee sus jardines" on public.gardens
  for select to authenticated using (customer_id = (select auth.uid()));
create policy "El cliente lee sus fotos" on public.garden_photos
  for select to authenticated using (customer_id = (select auth.uid()));
create policy "El cliente lee sus cotizaciones" on public.quotes
  for select to authenticated using (customer_id = (select auth.uid()));

revoke insert, update, delete on public.customers, public.addresses, public.gardens, public.garden_photos, public.quotes
  from anon, authenticated;

-- Fotos: bucket privado, máximo 10 MB por foto, una carpeta por cliente (<uid>/archivo.jpg).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('jardines', 'jardines', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy "El cliente sube fotos a su carpeta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'jardines' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "El cliente ve sus fotos" on storage.objects
  for select to authenticated
  using (bucket_id = 'jardines' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "El cliente borra sus fotos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'jardines' and (storage.foldername(name))[1] = (select auth.uid())::text);
