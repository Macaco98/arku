# ARKU — Documento maestro de contexto para Claude Code
**Versión:** 1.0 · **Fecha:** 9 de noviembre de 2026  
**Estado:** Documento de consolidación de Product Discovery, Brand Book y especificación inicial.  
**Uso:** Incorporar al repositorio existente como `docs/ARKU_CONTEXT_MASTER.md`. No sustituye la inspección del código y los diseños actuales.

## 0. Instrucción prioritaria para Claude Code

Ya existe un proyecto de Arku en Claude Code conectado con Figma y con primeras pantallas en desarrollo. **Antes de editar archivos:** inspecciona repositorio, estructura, componentes, tokens, pantallas y conexión con Figma. Identifica lo implementado, lo parcialmente implementado y lo pendiente. **No reinicialices el proyecto, no sobreescribas pantallas, no dupliques componentes y no cambies de stack sin justificación y autorización.** Usa este documento como fuente de verdad de producto; cuando contradiga una decisión de implementación existente, presenta el conflicto y sugiere una migración incremental. No afirmes que una integración funciona sin probarla. Solicita únicamente secretos o configuraciones que sean indispensables, sin incluirlos en el código ni en el repositorio.

## 1. Visión del producto

**Nombre:** Arku. **Eslogan:** «Tu mundo, resuelto.»  
**Mercado inicial:** hogares de Cumbayá y Tumbaco, Quito, Ecuador.  
**Visión:** plataforma confiable de servicios para el hogar que permita descubrir, contratar, pagar y gestionar profesionales verificados con una experiencia sencilla y transparente.  
**MVP:** mantenimiento general de jardines residenciales.  
**Servicios futuros:** limpieza del hogar, plomería, electricidad, limpieza de piscinas y otras categorías; no construirlos en el MVP.  
**Meta de lanzamiento:** 3–4 meses, como objetivo sujeto a validación de capacidad y dependencias.

### Propuesta de valor
- **Cliente:** contratación sencilla, profesionales verificados, precio claro, historial y reutilización del jardín guardado.
- **Profesional:** oportunidades de trabajo, agenda y registro transparente de ingresos.
- **Arku:** operación trazable, calidad y confianza mediante selección y supervisión de profesionales.

## 2. Fundadores y operación

Los fundadores son el usuario y su tío Isidro. Durante el piloto, ambos gestionarán la operación. La incorporación de profesionales combina entrevistas y verificaciones presenciales realizadas por fundadores y colaboradores. Solo profesionales aprobados pueden recibir reservas. Incluir independientes y empresas; cada trabajo debe tener una persona responsable identificada y verificada. La gestión avanzada de cuadrillas es posterior.

**Onboarding del profesional propuesto:** captación → entrevista presencial → verificación de identidad, experiencia, referencias, herramientas y capacidad de transporte → evaluación → aprobación → creación de perfil por Arku → activación → seguimiento de calidad. No permitir autoactivación sin verificación. «Verificado por Arku» solo cuando se cumpla el protocolo documentado.

## 3. Brand Book — base estratégica

- **Esencia:** cercanía, confianza, simplicidad, responsabilidad y modernidad.
- **Personalidad:** cálida, profesional, minimalista, accesible y confiable; no excesivamente corporativa.
- **Promesa:** ayuda confiable para cuidar el hogar sin complicaciones.
- **Propósito propuesto:** devolver tiempo y tranquilidad a las personas.
- **Identidad:** marca generalista de servicios para el hogar, no exclusivamente de jardinería.
- **Origen conceptual:** inspiración en Arcas y el mito de Calisto.
- **Logotipo propuesto:** símbolo abstracto de arco/A, trayectoria orbital y estrella; wordmark «arku» redondeado. No inventar ni sustituir el logo definitivo si ya existe en Figma.
- **Colores de referencia:** deep forest `#10342D`, forest green `#1F5A4F`, sage `#A7D7A8`, ivory `#FAF8F2`, orange accent `#F6A623`. Se había considerado también `#0F2D28`; reconciliar con tokens reales del proyecto y no crear paletas paralelas.
- **Logo principal:** blanco o verde profundo.
- **Tipografía:** sans serif legible, moderna; familia exacta por definir.
- **Tono:** español natural de Ecuador, claro, humano, directo; explicar tarifas y excepciones sin tecnicismos.
- **Fotografía:** jardines, hogares y profesionales reales; no prometer verificación con imágenes decorativas.
- **Design System:** tokens semánticos de color, tipografía, espaciado, radios, elevación, estados y componentes. Escala base de 4 px; referencias 4/8/12/16/24/32/48 y texto 12/14/16/20/24/32. Objetivos de accesibilidad: contraste adecuado, controles táctiles de al menos 44×44 px, foco visible y errores claros.
- **Pendiente:** validar disponibilidad y registro de marca, logo final, tipografía, reglas de uso y librería de ilustraciones/fotografía.

## 4. Alcance funcional confirmado del MVP

### Cliente
- Una app con dos perfiles (cliente y profesional), más panel web de administración.
- Registro/inicio de sesión, direcciones, verificación de cobertura, «Mis jardines», creación/edición/reutilización de jardines.
- Mantenimiento general; tamaño del jardín mediante **rangos predefinidos**, no m² exactos.
- Fotografías **opcionales** e instrucciones de acceso.
- Cotización automática o revisión manual, precio final garantizado para el alcance acordado.
- Reservas **para el mismo día** («inmediatas») o programadas.
- Elegir profesional o pedir asignación automática.
- Seguimiento, extras con aprobación, historial, soporte y evaluación (evaluación puede ser P1).

### Profesional
- Perfil creado/activado tras validación presencial; zonas, disponibilidad, tarifas y herramientas.
- Recibir solicitud y **aceptar o rechazar en 10 minutos**.
- Consultar detalles y fotografías, ejecutar trabajo, registrar inicio/finalización y evidencias.
- Solo el profesional puede proponer un costo adicional, con aprobación explícita del cliente en la app.
- Consultar ganancias y liquidaciones.

### Administración
- Verificar y gestionar profesionales, configurar cobertura y rangos de tarifa, gestionar cotizaciones manuales, asignaciones, reservas, incidencias, pagos, reembolsos y liquidaciones.
- Fundadores gestionan el piloto con posibilidad de intervención manual.

### Fuera del MVP
- Mantenimiento recurrente (primero servicios individuales; recurrencia futura).
- Categorías adicionales, gestión avanzada de cuadrillas, seguimiento GPS en vivo, suscripciones, motor de IA y automatizaciones complejas.

## 5. Servicio de jardinería: alcance

**Incluido como propuesta operativa por validar:** corte de césped si existe, poda ligera, deshierbe superficial, limpieza del área, recolección y **retiro de residuos vegetales siempre incluido**. El jardinero aporta herramientas y materiales ordinarios necesarios. Se debe definir un límite operativo de volumen de residuos y condiciones de disposición sin contradecir la promesa al cliente.

**Exclusiones propuestas:** tala/poda en altura, paisajismo, instalación de riego, fumigación, fertilizantes especiales, compra de plantas, maquinaria especializada y trabajos fuera del mantenimiento estándar. Mostrar alcance y exclusiones antes de confirmar la reserva.

## 6. Jardines guardados — requisito esencial

El cliente debe registrar un jardín **una sola vez** y reutilizarlo para futuras reservas. Permitir múltiples jardines, incluso en una misma dirección (p. ej., frontal y posterior). Campos sugeridos:
- `garden_id`, `customer_id`, `name`, `address_id`, `size_band`, `photos[]` (opcionales), `access_notes`, `created_at`, `updated_at`.
- Dirección con etiqueta, referencia y coordenadas cuando estén disponibles; la cobertura debe comprobarse con zonas/polígonos administrables, no solo texto libre.
- Al contratar nuevamente, precargar datos y pedir confirmación de que siguen vigentes.
- Editar un jardín modifica **futuras** cotizaciones, nunca el precio o datos congelados de una reserva existente.
- Almacenar fotografías de manera privada con control de acceso y política de retención.

## 7. Pricing Engine

### Rangos provisionales para diseño (NO validados comercialmente)
| Banda | Superficie orientativa | Sin fotos | Con ≥1 foto |
|---|---|---|---|
| S | Hasta 50 m² | Automática | Automática |
| M | 51–100 m² | Automática | Automática |
| L | 101–200 m² | **Revisión manual** | Automática |
| XL | Más de 200 m² | **Revisión manual** | **Revisión manual** |

Fotos opcionales para **guardar** cualquier jardín. Si no hay fotos y es L, no se bloquea el registro: se envía la cotización a revisión. XL siempre revisión manual. Los umbrales S/M/L/XL son hipótesis configurables.

**Modelo de tarifa:** Arku define rangos de precios permitidos por banda; cada profesional configura su tarifa por banda dentro de ellos. Arku define también el **precio mínimo por visita**. No multiplicar por m² exactos inventados.

`base_price = max(provider_band_tariff, Arku_minimum_price)`

`final_price = confirmed_base_price + customer_approved_extras`

Todos los importes deben almacenarse en centavos enteros USD; tarifas, impuestos y reglas versionadas. Los ejemplos anteriores de precios eran **ficticios** y no son tarifas oficiales. La comisión de Arku **no está decidida**: investigar primero con competidores y entrevistas a jardineros y hogares. No hardcodear 15% como regla de negocio.

**Garantía:** el precio confirmado se congela para el alcance declarado. No se cambia unilateralmente. Solo extras aprobados pueden añadirse. Una discrepancia importante de tamaño/alcance requiere intervención y una solución explícita, no recargo automático. La revisión manual debe producir un importe que el cliente acepte antes de confirmar.

## 8. Reserva y asignación

- Reserva «inmediata» significa **atención durante el mismo día**, no promesa de llegada en dos horas.
- También se permiten reservas programadas.
- El cliente puede **elegir profesional** o solicitar **asignación automática**.
- La oferta al profesional expira a los **10 minutos** sin aceptación.
- El tiempo **total** máximo de espera por asignación automática sigue **por definir**.
- Solo mostrar candidatos que cubran zona, tengan capacidad, tarifa compatible y disponibilidad.
- Evitar dobles reservas y carreras de aceptación con controles transaccionales.
- Si el profesional cancela, **intentar reasignación primero**, presentando alternativas de horario/profesional/precio para que **el cliente elija**. No imponer cambios de precio u horario ni cobrar diferencias sin aceptación.
- Si no hay alternativas adecuadas, ofrecer cancelación y gestión de liberación/reembolso según estado financiero.
- Los fundadores pueden intervenir desde administración.

## 9. Pagos — decisión actualizada y precauciones

**Decisión del usuario:** al confirmar una reserva, realizar una **autorización o retención temporal** del importe, y **capturar/cobrar definitivamente después de realizar el servicio**, de forma parecida a un viaje en una app de transporte. Extras propuestos por el profesional o solicitados por el cliente durante el trabajo requieren **propuesta formal del profesional y aprobación explícita del cliente**. El adicional debe ser autorizado/cobrado con mecanismo soportado; una autorización de $40 no necesariamente permite capturar $50.

**No asumir capacidades del PSP:** verificar en Ecuador autorización/captura diferida, vigencia para reservas futuras, tokenización segura, cargos posteriores o segunda autorización, cancelación de autorización, devoluciones, conciliación, liquidación a independientes/empresas y obligaciones fiscales. Si el PSP no soporta el flujo, diseñar una alternativa y solicitar aprobación antes de implementarla. Para efectivo y transferencia no existe preautorización equivalente: definir flujo alternativo; el pago principal se desea dentro de Arku.

**Separar estados de servicio y estados financieros.** Estados de pago sugeridos: `payment_method_saved`, `authorization_pending`, `authorized`, `authorization_failed`, `capture_pending`, `captured`, `additional_payment_pending`, `payment_failed`, `voided`, `refunded`. Idempotencia, webhooks verificados, auditoría y conciliación son obligatorios antes de producción. No capturar por un servicio no realizado. Los fondos no son necesariamente retenidos por Arku: no afirmar escrow.

## 10. Estados de reserva y excepciones

Estados propuestos: `draft`, `searching_provider`, `awaiting_acceptance`, `pending_payment_authorization`, `confirmed`, `en_route`, `in_progress`, `completed`, `cancelled`, `disputed`, `reassignment_pending`. Ajustar la máquina de estados para que la reserva se confirme únicamente tras aceptación y condiciones financieras válidas. Diferenciar «servicio terminado» de «pago capturado» y «liquidación realizada».

Casos que deben diseñarse y probarse:
1. Dirección fuera de cobertura.
2. Jardín XL → revisión manual.
3. Jardín L sin fotos → revisión manual; guardar jardín sí permitido.
4. Sin profesionales o sin horarios para hoy.
5. Profesional rechaza o no responde en 10 min.
6. Cliente abandona solicitud; reintento seguro.
7. Profesional cancela después de autorizar fondos → alternativas elegidas por cliente, sin cambios silenciosos.
8. Autorización rechazada, vencida o no disponible para fecha futura.
9. Cliente rechaza extra → no realizar/cobrar extra; resolver alcance original.
10. Extra aprobado pero autorización adicional falla → no realizar extra hasta resolver.
11. Cliente disputa finalización → revisión, bloqueo de liquidación cuando sea posible.
12. Doble clic, webhook duplicado o red inestable → no duplicar cobro/reserva.
13. Edición del jardín con reserva activa → no alterar snapshot histórico.
14. Subida de foto fallida → permitir reintento o continuar sin foto.
15. Cotización manual sin respuesta → estado pendiente, sin inventar SLA.

## 11. Flujos de experiencia

**Cliente:** Home → Mis jardines / Crear jardín → Dirección/cobertura → Tamaño → Fotos opcionales/notas → Revisar y guardar → Cotización automática o revisión manual → Hoy/programar → Elegir profesional o asignación → Aceptación → Autorización de pago → Reserva confirmada → Seguimiento → Propuesta de extras (aprobar/rechazar) → Servicio finalizado → Captura/cobro → Historial y volver a contratar.

**Profesional:** activación verificada → disponibilidad → solicitud entrante con temporizador 10 min → aceptar/rechazar → detalle y traslado → iniciar trabajo → proponer extras (si procede) → esperar aprobación → evidencia y finalizar → consultar liquidación.

**Administración:** revisar candidatos y documentación → activar proveedor → configurar tarifas y cobertura → gestionar cotizaciones manuales → supervisar reservas y reasignaciones → atender disputas → conciliar pagos y liquidaciones.

## 12. Inventario de pantallas (referencia, no obligación de crear una pantalla por cada estado)

### Cliente
C01 Splash; C02 Bienvenida/login; C03 Registro; C04 Home; C05 Dirección/cobertura; C06 Servicio; C07 Tamaño; C08 Fotos/notas; C09 Fecha/horario; C10 Elegir/asignación; C11 Listado de profesionales; C12 Perfil; C13 Resumen; C14 Esperando aceptación; C15 Método de pago; C16 Confirmación; C17 Seguimiento; C18 Extra propuesto; C19 Finalización; C20 Historial; C21 Perfil/direcciones; C22 Soporte; C23 Calificación; C24 Mis jardines; C25 Crear jardín; C26 Detalle jardín; C27 Editar jardín; C28 Seleccionar jardín; C29 Revisión manual; C30 Autorización; C31 Cobro final; C32 Aprobar/rechazar extras; C33 Reasignación.

### Profesional
P01 Activación; P02 Login; P03 Dashboard; P04 Agenda; P05 Solicitud temporizada; P06 Detalle solicitud; P07 Aceptación; P08 Trabajo confirmado; P09 Ejecución; P10 Proponer extra; P11 Evidencia; P12 Ganancias; P13 Perfil; P14 Historial; P15 Soporte; P16/P17 variantes de propuesta/estado de extra.

### Administración
A01 Login; A02 Dashboard; A03 Profesionales; A04 Verificación; A05 Tarifas; A06 Cobertura; A07 Reservas; A08 Detalle/intervención; A09 Pagos/reembolsos; A10 Disputas/extras; A11 Usuarios/soporte; A12 Métricas; A13 Cotización manual; A14 Autorizaciones/capturas; A15 Reasignación.

Las ~65 vistas funcionales del inventario histórico **no** son 65 pantallas independientes a construir en Sprint 01. Consolidar componentes y variantes.

## 13. Sprint 01 — alcance aprobado

**Objetivo:** el cliente crea, guarda, edita y reutiliza jardines, y recibe cotización automática o estado de revisión manual.

**Pantallas principales:** S01 Home; S02 Mis jardines; S03 Dirección; S04 Tamaño; S05 Fotos y detalles; S06 Revisar y guardar; S07 Cotización; S08 Revisión manual. Además: detalle/editar jardín y estados vacío/carga/error/sin conexión/sin cobertura/subida fallida.

**Fuera del Sprint 01:** pagos reales, selección y asignación de profesionales, aceptación, notificaciones, seguimiento, extras y liquidaciones. Pueden quedar como rutas placeholder sin acciones financieras reales.

**Criterios de aceptación:**
- Crear varios jardines y recuperarlos entre sesiones según la persistencia de desarrollo seleccionada.
- Editar nombre, dirección, tamaño, notas y fotos; eliminar fotos.
- Guardar sin fotos en cualquier tamaño.
- S/M con o sin fotos → cotización automática.
- L sin fotos → revisión manual; L con fotos → automática.
- XL siempre → revisión manual.
- Aplicar mínimo de Arku a tarifa simulada; mostrar «precio de demostración» en prototipo.
- La cotización no depende de m² exactos inventados.
- Validar cobertura con servicio abstraído y fixtures explícitos, no por texto libre.
- No modificar cotizaciones históricas cuando se edita un jardín.
- Manejar errores, estados vacíos, carga, reintentos y accesibilidad.
- Pruebas unitarias de rutas de cotización, mínimo y edición; prueba de integración crear→guardar→reutilizar.

## 14. Arquitectura técnica propuesta (no impuesta)

Si el proyecto existente usa otra arquitectura válida, conservarla hasta justificar cambios.
- Mobile: Expo + React Native + TypeScript + Expo Router.
- Admin futuro: Next.js.
- Backend candidato: Supabase + PostgreSQL, pendiente de validación.
- Validación: Zod; formularios: React Hook Form.
- Repositorio modular: `apps/mobile`, `apps/admin`, `packages/ui`, `packages/domain`, `packages/api`, `docs`, `tests`.
- Interfaces de repositorios para `Customer`, `Address`, `Garden`, `GardenPhoto`, `CoverageZone`, `SizeBand`, `ProviderTariff`, `PricingRule`, `Quote`, y en sprints futuros `Booking`, `Assignment`, `Payment`, `ExtraRequest`, `Payout`, `AuditLog`.
- Precios en centavos USD, validación server-side y snapshots/versiones.
- Fotografías privadas; autenticación/autorización y reglas de acceso por propietario.
- Para Sprint 01 usar mocks persistentes de desarrollo si no hay backend configurado; distinguir claramente mock vs producción.
- No introducir secretos ni integrar pasarela de pago en Sprint 01.

### Pseudocódigo de enrutamiento de cotización
```ts
type SizeBand = 'S' | 'M' | 'L' | 'XL';
function determineQuoteRoute(size: SizeBand, photoCount: number) {
  if (size === 'XL') return 'manual_review';
  if (size === 'L' && photoCount === 0) return 'manual_review';
  return 'automatic';
}
function basePriceCents(providerBandTariffCents: number, arkuMinimumCents: number) {
  if (![providerBandTariffCents, arkuMinimumCents].every(n => Number.isSafeInteger(n) && n >= 0)) throw new Error('Invalid price');
  return Math.max(providerBandTariffCents, arkuMinimumCents);
}
```

## 15. Investigación pendiente y decisiones abiertas

1. Tarifas reales y tamaños de jardín: benchmark de competencia **y** entrevistas con 8–10 profesionales y 8–10 hogares (propuesta de muestra).
2. Monetización: comisión profesional, cargo cliente o mixto; **sin decisión tomada**. Comparar disposición a pagar y contribución neta.
3. Capacidad de pasarela de pagos en Ecuador: autorización al reservar, captura después, expiración, extras, liquidación y reembolsos.
4. Definición de reserva programada a largo plazo y momento alternativo de autorización si la retención caduca.
5. Tiempo máximo **total** de búsqueda automática; cada profesional tiene 10 min.
6. Política de cancelación, no-show, reprogramación, disputas y compensaciones.
7. Límites de retiro de residuos y trabajos fuera de alcance.
8. Rangos de precios por tamaño, mínimo por visita, tratamiento de impuestos y facturación.
9. Polígonos reales de cobertura y validación de direcciones.
10. Protocolo y responsabilidad legal de verificación presencial; tratamiento de datos personales.
11. Si hay proveedores empresariales, modelo de trabajador responsable y pagos a empresa.
12. Identidad visual final y disponibilidad registral de marca.

## 16. Secuencia recomendada para Claude ahora

1. **Auditar el estado actual:** enumerar archivos, rutas, pantallas, componentes, tokens, mocks, pruebas y lo que ya está conectado a Figma.
2. **Hacer matriz de brechas:** `requisito / existente / parcial / pendiente / conflicto / acción sugerida`.
3. **Sin borrar trabajo previo**, alinear Sprint 01 con reglas confirmadas y actualizar la navegación y componentes existentes.
4. Implementar modelos, repositorios y persistencia de jardines; luego cobertura, fotos, cotización y estados de revisión.
5. Escribir pruebas de reglas y flujo; ejecutar las disponibles y reportar resultados reales.
6. Presentar demo de Sprint 01 y lista de pendientes. No avanzar a pagos reales ni Sprint 02 sin revisión del usuario.

### Prompt corto para pegar junto a este archivo
> Lee `docs/ARKU_CONTEXT_MASTER.md` como fuente de verdad de producto. Ya estás conectado a Figma y has creado pantallas; inspecciona y preserva todo el trabajo existente. Primero entrégame un inventario de lo implementado y una matriz de brechas frente al Sprint 01. Señala contradicciones entre este PRD y el diseño/código actual. Luego propón un plan incremental, sin reiniciar el proyecto ni duplicar componentes. Espera mi aprobación antes de cambios estructurales o integraciones externas. Mantén los textos de UI en español, las reglas de cotización centralizadas y las decisiones pendientes explícitas.
