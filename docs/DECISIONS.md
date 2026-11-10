# Decisiones de producto y diseño

Registro de decisiones tomadas por Bernardo. Complementa al documento maestro; si algo choca, gana la decisión más reciente.

## 2026-11-09

| # | Tema | Decisión |
|---|------|----------|
| 1 | Tipografía | Plus Jakarta Sans, final. Se maneja como token (`font/family`). |
| 2 | Paleta | Paleta con identidad propia: marfil 60 %, bosque 25 %, salvia 10 %, naranja 5 %. Rampas tonales; `forest/950` = `#0F2D28`. |
| 3 | Logo | Marcador de texto "arku" hasta tener el logo final (se trabaja en paralelo). |
| 4 | Precios | Se mantienen los precios de demostración (S $25, M $35, L $50, mínimo $25) hasta definir profesionales y sus tarifas. |
| 5 | Residuos | El jardinero se lleva los residuos vegetales (incluido siempre). |
| 6 | Texto S08 | "La verás en Mis jardines cuando esté lista." |
| 7 | Registro | Además del celular con SMS: nombre, apellido y cédula ecuatoriana validada (10 dígitos, provincia, tercer dígito y verificador módulo 10). |
| 8 | Código | Proyecto nuevo desde cero: monorepo con Expo. |

## Reglas que el código ya aplica (`packages/domain`)

- Ruta de cotización: S/M automáticas; L automática solo con ≥1 foto; XL siempre revisión manual.
- `precio base = máx(tarifa del profesional, mínimo de Arku)`, en centavos enteros. Nunca por m².
- Guardar un jardín nunca exige fotos.
- La cotización guarda una copia congelada del jardín; editar el jardín no cambia cotizaciones existentes.
- La revisión manual termina con un precio que el cliente debe aceptar; las cotizaciones vencen (72 h provisional).
- La cobertura se valida por zonas (polígonos), no por texto.

## Pendientes (no decididos)

- Comisión de Arku, tarifas reales y umbrales de tamaño.
- Vigencia real de una cotización.
- Polígonos oficiales de cobertura.
- Límite de volumen de residuos.
- Backend (Supabase candidato) y proveedor de SMS.
- Logo final.
