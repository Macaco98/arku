# Arku — guía para Claude Code

Lee primero `docs/ARKU_CONTEXT_MASTER.md` (fuente de verdad) y `docs/DECISIONS.md` (decisiones ya tomadas; no las vuelvas a preguntar).

## Reglas

- No reinicies el proyecto, no dupliques componentes ni cambies el stack sin aprobación de Bernardo. Muestra diferencias y propuestas antes de cambios estructurales.
- No inventes reglas comerciales. Los precios son de demostración; la comisión de Arku no está decidida.
- Sprint 01 excluye pagos reales, asignación de profesionales, notificaciones y seguimiento.
- Sin secretos en el código. Las fotos de jardines son privadas: guarda claves de almacenamiento, nunca URLs públicas.
- Importes siempre en centavos USD enteros.
- Textos de la app en español de Ecuador.

## Dónde va cada cosa

- Reglas de negocio puras y probadas: `packages/domain`. La app no reimplementa reglas.
- Tokens visuales: `packages/ui/tokens/figma-variables.json`, exportado de las variables de Figma. No escribas colores, tamaños ni radios a mano en la app; usa `@arku/ui`.
- Componentes de la app: `apps/mobile/src/components`, con los mismos nombres que en Figma (PrimaryButton, TextField, GardenCard…).
- Pantallas: `apps/mobile/src/app` (Expo Router). Ver también `apps/mobile/AGENTS.md` para reglas de Expo.

## Antes de terminar una tarea

```bash
pnpm test && pnpm typecheck
```

Reporta los resultados reales.
