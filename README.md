# Arku

Marketplace de servicios para el hogar en Cumbayá y Tumbaco. El MVP es el mantenimiento residencial de jardines.

- Fuente de verdad del producto: [docs/ARKU_CONTEXT_MASTER.md](docs/ARKU_CONTEXT_MASTER.md)
- Decisiones tomadas: [docs/DECISIONS.md](docs/DECISIONS.md)
- Diseño: [Figma · ARKU — Sprint 01 · Jardines](https://www.figma.com/design/35iOkyKYN5U4DEWfAqRDUy)

## Estructura

```
apps/mobile       App Expo + React Native + TypeScript + Expo Router
packages/domain   Reglas de negocio: tipos, Zod, cotización, cédula, cobertura, repositorios
packages/ui       Tokens del Design System exportados de las variables de Figma
packages/api      Conexión con Supabase: repositorios, función `arku` y cliente para la app
supabase          Migraciones SQL (tablas, permisos, bucket de fotos) y la función `arku` compilada
docs              Documento maestro, decisiones y guía de Supabase
```

`apps/admin` (Next.js) llega en un sprint futuro.

## Requisitos

- Node 22 o superior
- pnpm 10 (`corepack enable`)

## Comandos

```bash
pnpm install          # instala todo el monorepo
pnpm test             # pruebas unitarias e integración (Vitest)
pnpm typecheck        # TypeScript en todos los paquetes
pnpm mobile           # abre Expo (escanea el QR con Expo Go o abre la web con "w")
```

## Backend

La app funciona de dos formas, según `apps/mobile/.env` (ver `.env.example`):

- **Supabase** (con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_KEY`): ingreso con código por SMS, datos en Postgres y fotos en un bucket privado. Las reglas se aplican en el servidor (función `arku`). Guía paso a paso: [docs/SUPABASE.md](docs/SUPABASE.md).
- **Demostración** (sin `.env`): todo vive en el dispositivo. Es lo que usa la vista previa web.

## Datos de demostración

Sin Supabase, la app usa **mocks de desarrollo** marcados como tales:

- Jardines, direcciones, clientes y cotizaciones se guardan en el almacenamiento local del dispositivo (`AsyncStorage`).
- La cobertura usa zonas aproximadas de Cumbayá y Tumbaco (`FIXTURE_COVERAGE_ZONES`), no los polígonos oficiales.
- Los precios son de demostración (`DEMO_PRICING`: S $25, M $35, L $50, mínimo $25). No son tarifas reales.
- No se envía ningún SMS: el código es siempre `123456`.

No hay secretos en el repositorio. Si más adelante se necesitan claves, van en variables de entorno fuera de git.
