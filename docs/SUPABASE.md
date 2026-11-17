# Supabase: guía para conectar Arku

Arku usa Supabase para la base de datos (Postgres), el ingreso con código por SMS y las fotos privadas. Todo se hace desde el navegador, en el panel de Supabase; no hace falta instalar nada.

## Cómo está armado

- **Tablas** (`supabase/migrations`): clientes, direcciones, jardines, fotos y cotizaciones. Cada cliente solo puede leer lo suyo (RLS) y nadie escribe directo desde la app.
- **Función `arku`** (`supabase/functions/arku/index.ts`): recibe cada pedido de la app, revisa quién es el usuario y aplica las reglas de `packages/domain` en el servidor. Es un archivo generado: el código fuente está en `packages/api`.
- **Bucket `jardines`**: privado. Cada cliente sube fotos solo a su carpeta. La base guarda la clave, nunca una URL pública.
- **SMS**: Supabase Auth envía el código con Twilio.

## 1. Crear el proyecto

1. En [supabase.com](https://supabase.com), crea una cuenta y toca **New project**.
2. Nombre: `arku`. Región: **South America (São Paulo)**. Guarda la contraseña de la base en un lugar seguro (no se comparte ni va al repositorio).

## 2. Crear las tablas

1. Abre **SQL Editor** › **New query**.
2. Pega todo el contenido de `supabase/migrations/20261117120000_sprint01.sql` y toca **Run**.

## 3. Publicar la función `arku`

1. Abre **Edge Functions** › **Deploy a new function** › **Via Editor**.
2. Nombre: `arku`. Pega todo el contenido de `supabase/functions/arku/index.ts` y toca **Deploy**.
3. Deja activada la verificación de JWT (viene así por defecto).

Supabase le da a la función su URL y su clave de servicio automáticamente; no hay que copiar ninguna clave.

## 4. Activar el ingreso por SMS

1. Abre **Authentication** › **Sign In / Providers** › **Phone** y actívalo.
2. Para probar sin enviar SMS reales, agrega números de prueba con un código fijo (por ejemplo `+593990000001` con `123456`) en la sección de números de prueba.
3. Para SMS reales, crea una cuenta en Twilio y pega sus datos (Account SID, Auth Token y Message Service SID) **solo en ese formulario de Supabase**. En Twilio, habilita Ecuador en *Messaging › Geo permissions*. Con una cuenta de prueba de Twilio solo llegan SMS a números verificados en Twilio.

## 5. Conectar la app

En **Project Settings** › **API** están la **Project URL** y la **publishable key** (o *anon key*). Las dos se pueden usar dentro de la app. Van en `apps/mobile/.env` (no se sube al repositorio):

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_xxxx
```

La **service_role key** y la contraseña de la base nunca van en la app ni en el repositorio.

## Cuando cambia el código

Si cambian las reglas (`packages/domain`) o la conexión (`packages/api`), hay que volver a compilar y publicar la función:

```bash
pnpm --filter @arku/api build:function
```

y repetir el paso 3 con el archivo nuevo. Si hay una migración nueva en `supabase/migrations`, se corre en el SQL Editor (paso 2).
