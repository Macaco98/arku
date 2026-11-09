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
docs              Documento maestro y decisiones
```

`apps/admin` (Next.js) y `packages/api` llegan en sprints futuros, cuando haya backend.

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

## Datos de desarrollo

Sprint 01 no tiene backend. La app usa **mocks de desarrollo** marcados como tales:

- Jardines, direcciones, clientes y cotizaciones se guardan en el almacenamiento local del dispositivo (`AsyncStorage`).
- La cobertura usa zonas aproximadas de Cumbayá y Tumbaco (`FIXTURE_COVERAGE_ZONES`), no los polígonos oficiales.
- Los precios son de demostración (`DEMO_PRICING`: S $25, M $35, L $50, mínimo $25). No son tarifas reales.
- El celular de registro es fijo hasta conectar un proveedor de SMS.

No hay secretos en el repositorio. Si más adelante se necesitan claves, van en variables de entorno fuera de git.
