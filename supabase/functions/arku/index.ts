// ARCHIVO GENERADO. No editar: cambia packages/api/src/function.ts y corre `pnpm --filter @arku/api build:function`.
// deno-lint-ignore-file
// @ts-nocheck

// ../domain/src/types.ts
var SIZE_BANDS = ["S", "M", "L", "XL"];
var ADDRESS_LABELS = ["Casa", "Trabajo", "Familia", "Otra"];

// ../domain/src/money.ts
function assertCents(value) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Importe inv\xE1lido: ${value}. Use centavos enteros no negativos.`);
  }
}

// ../domain/src/quote.ts
var HOUR_MS = 36e5;
var DEFAULT_QUOTE_VALIDITY_HOURS = 72;
function determineQuoteRoute(size, photoCount) {
  if (!Number.isInteger(photoCount) || photoCount < 0) {
    throw new Error(`N\xFAmero de fotos inv\xE1lido: ${photoCount}`);
  }
  if (size === "XL") return "manual_review";
  if (size === "L" && photoCount === 0) return "manual_review";
  return "automatic";
}
function basePriceCents(providerBandTariffCents, arkuMinimumCents) {
  assertCents(providerBandTariffCents);
  assertCents(arkuMinimumCents);
  return Math.max(providerBandTariffCents, arkuMinimumCents);
}
function tariffFor(pricing, size) {
  const tariff = pricing.tariffs.find((t) => t.sizeBand === size);
  if (!tariff) throw new Error(`No hay tarifa autom\xE1tica para la banda ${size}`);
  return tariff.amountCents;
}
function snapshotGarden(garden, address) {
  return {
    gardenName: garden.name,
    addressLine: address.line,
    sizeBand: garden.sizeBand,
    photoCount: garden.photos.length,
    accessNotes: garden.accessNotes,
    arrivalInstructions: address.arrivalInstructions ?? ""
  };
}
function priceFor(tariffCents, pricing) {
  return {
    tariffCents,
    minimumCents: pricing.arkuMinimumCents,
    baseCents: basePriceCents(tariffCents, pricing.arkuMinimumCents),
    pricingVersion: pricing.version,
    isDemo: pricing.isDemo
  };
}
function buildQuote({
  id,
  garden,
  address,
  pricing,
  now,
  validityHours = DEFAULT_QUOTE_VALIDITY_HOURS
}) {
  if (address.id !== garden.addressId) throw new Error("La direcci\xF3n no corresponde al jard\xEDn");
  const snapshot = snapshotGarden(garden, address);
  const route = determineQuoteRoute(snapshot.sizeBand, snapshot.photoCount);
  const base = {
    id,
    gardenId: garden.id,
    customerId: garden.customerId,
    route,
    snapshot,
    createdAt: now.toISOString()
  };
  if (route === "manual_review") return { ...base, status: "pending_review" };
  return {
    ...base,
    status: "automatic",
    expiresAt: new Date(now.getTime() + validityHours * HOUR_MS).toISOString(),
    price: priceFor(tariffFor(pricing, snapshot.sizeBand), pricing)
  };
}
function completeManualReview(quote, reviewedTariffCents, pricing, now, validityHours = DEFAULT_QUOTE_VALIDITY_HOURS) {
  if (quote.status !== "pending_review") throw new Error("La cotizaci\xF3n no est\xE1 en revisi\xF3n manual");
  return {
    ...quote,
    status: "ready",
    expiresAt: new Date(now.getTime() + validityHours * HOUR_MS).toISOString(),
    price: priceFor(reviewedTariffCents, pricing)
  };
}
function withExpiry(quote, now) {
  const open = quote.status === "automatic" || quote.status === "ready";
  if (open && quote.expiresAt && new Date(quote.expiresAt) <= now) {
    return { ...quote, status: "expired" };
  }
  return quote;
}
function respondToQuote(quote, answer, now) {
  const current = withExpiry(quote, now);
  if (current.status === "expired") throw new Error("Esta cotizaci\xF3n ya no est\xE1 vigente.");
  if (current.status !== "automatic" && current.status !== "ready") {
    throw new Error("Esta cotizaci\xF3n todav\xEDa no tiene un precio para aceptar.");
  }
  return { ...current, status: answer, respondedAt: now.toISOString() };
}

// ../domain/src/pricing-demo.ts
var DEMO_PRICING = {
  version: "demo-2026-11-09",
  arkuMinimumCents: 2500,
  isDemo: true,
  tariffs: [
    { sizeBand: "S", amountCents: 2500 },
    { sizeBand: "M", amountCents: 3500 },
    { sizeBand: "L", amountCents: 5e3 }
  ]
};

// ../domain/src/cedula.ts
var COEFFICIENTS = [2, 1, 2, 1, 2, 1, 2, 1, 2];
function cedulaChecksumOk(digits) {
  if (!/^\d{10}$/.test(digits)) return false;
  const sum = COEFFICIENTS.reduce((acc, coef, i) => {
    const product = Number(digits[i]) * coef;
    return acc + (product > 9 ? product - 9 : product);
  }, 0);
  const check2 = (10 - sum % 10) % 10;
  return check2 === Number(digits[9]);
}
function validateCedula(input) {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 0) return { status: "empty", digits, message: "" };
  if (digits.length < 10) {
    const missing = 10 - digits.length;
    return {
      status: "incomplete",
      digits,
      message: `Faltan ${missing} ${missing === 1 ? "d\xEDgito" : "d\xEDgitos"}. La c\xE9dula tiene 10.`
    };
  }
  const province = Number(digits.slice(0, 2));
  const third = Number(digits[2]);
  const provinceOk = province >= 1 && province <= 24 || province === 30;
  if (digits.length > 10 || !provinceOk || third >= 6 || !cedulaChecksumOk(digits)) {
    return { status: "invalid", digits, message: "Esta c\xE9dula no es v\xE1lida. Revisa los n\xFAmeros." };
  }
  return { status: "valid", digits, message: "C\xE9dula v\xE1lida" };
}

// ../domain/src/coverage.ts
function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const crosses = yi > point.lat !== yj > point.lat && point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}
var FIXTURE_COVERAGE_ZONES = [
  {
    id: "zone-cumbaya",
    name: "Cumbay\xE1",
    polygon: [
      [-78.45, -0.225],
      [-78.415, -0.225],
      [-78.415, -0.18],
      [-78.45, -0.18]
    ]
  },
  {
    id: "zone-tumbaco",
    name: "Tumbaco",
    polygon: [
      [-78.415, -0.24],
      [-78.37, -0.24],
      [-78.37, -0.19],
      [-78.415, -0.19]
    ]
  }
];
var FixtureCoverageService = class {
  constructor(zones = FIXTURE_COVERAGE_ZONES) {
    this.zones = zones;
  }
  zones;
  async check(point) {
    const zone = this.zones.find((z2) => pointInPolygon(point, z2.polygon));
    return zone ? { covered: true, zone } : { covered: false };
  }
};

// ../domain/src/schemas.ts
import { z } from "npm:zod@4.6.7";
var MAX_PHOTOS_PER_GARDEN = 6;
var MAX_ACCESS_NOTES = 300;
var MAX_ARRIVAL_INSTRUCTIONS = 300;
var name = (field) => z.string().trim().min(2, `Escribe tu ${field}.`).max(60, `El ${field} es demasiado largo.`);
var phoneSchema = z.string().transform((v) => v.replace(/\D/g, "")).refine((v) => /^09\d{8}$/.test(v), "Ingresa un celular de 10 d\xEDgitos que empiece con 09.");
var customerProfileSchema = z.object({
  firstName: name("nombre"),
  lastName: name("apellido"),
  idNumber: z.string().superRefine((value, ctx) => {
    const result = validateCedula(value);
    if (result.status !== "valid") {
      ctx.addIssue({ code: "custom", message: result.message || "Ingresa tu n\xFAmero de c\xE9dula." });
    }
  }).transform((v) => v.replace(/\D/g, ""))
});
var coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});
var addressInputSchema = z.object({
  label: z.enum(ADDRESS_LABELS),
  line: z.string().trim().min(5, "Escribe la direcci\xF3n."),
  reference: z.string().trim().max(200).optional(),
  arrivalInstructions: z.string().trim().max(MAX_ARRIVAL_INSTRUCTIONS).optional(),
  coordinates: coordinatesSchema
});
var gardenInputSchema = z.object({
  name: z.string().trim().min(2, "Ponle un nombre a tu jard\xEDn.").max(40),
  addressId: z.string().min(1),
  sizeBand: z.enum(SIZE_BANDS),
  accessNotes: z.string().trim().max(MAX_ACCESS_NOTES, `M\xE1ximo ${MAX_ACCESS_NOTES} caracteres.`).default("")
});
var gardenUpdateSchema = gardenInputSchema.partial();

// ../domain/src/garden-service.ts
var OutOfCoverageError = class extends Error {
  constructor() {
    super("Por ahora atendemos solo en Cumbay\xE1 y Tumbaco.");
    this.name = "OutOfCoverageError";
  }
};
var NotFoundError = class extends Error {
  constructor(what) {
    super(`${what} no encontrado`);
    this.name = "NotFoundError";
  }
};
var GardenService = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  /** A03. Con backend, `id` es el del usuario que verificó su celular por SMS. */
  async registerCustomer(phoneInput, profile, id) {
    const phone = phoneSchema.parse(phoneInput);
    const data = customerProfileSchema.parse(profile);
    const customer = { id: id ?? this.deps.newId(), phone, ...data, createdAt: this.deps.now().toISOString() };
    return this.deps.repos.customers.save(customer);
  }
  /** P01 · Datos personales: nombre, apellido y cédula. El celular no cambia aquí (se verifica por SMS). */
  async updateCustomerProfile(customerId, profile) {
    const customer = await this.deps.repos.customers.get(customerId);
    if (!customer) throw new NotFoundError("Cliente");
    const data = customerProfileSchema.parse(profile);
    return this.deps.repos.customers.save({ ...customer, ...data });
  }
  getCustomer(customerId) {
    return this.deps.repos.customers.get(customerId);
  }
  /** S03: aviso en vivo de cobertura mientras el cliente escribe o usa su ubicación. */
  checkCoverage(point) {
    return this.deps.coverage.check(point);
  }
  /** S03: la dirección solo se guarda si cae en una zona de cobertura. */
  async addAddress(customerId, input) {
    const fields = await this.coveredAddress(input);
    const address = { id: this.deps.newId(), customerId, ...fields, createdAt: this.deps.now().toISOString() };
    return this.deps.repos.addresses.save(address);
  }
  /**
   * P01 · Mis direcciones: corregir una dirección guardada. Vuelve a validar la cobertura.
   * Los jardines que la usan toman los datos nuevos; las cotizaciones existentes no cambian (copia congelada).
   */
  async updateAddress(customerId, addressId, input) {
    const current = await this.requireAddress(customerId, addressId);
    const fields = await this.coveredAddress(input);
    return this.deps.repos.addresses.save({ id: current.id, customerId, ...fields, createdAt: current.createdAt });
  }
  /** Valida la dirección y su cobertura. Los opcionales vacíos no se guardan. */
  async coveredAddress(input) {
    const data = addressInputSchema.parse(input);
    const coverage = await this.deps.coverage.check(data.coordinates);
    if (!coverage.covered) throw new OutOfCoverageError();
    return {
      label: data.label,
      line: data.line,
      ...data.reference ? { reference: data.reference } : {},
      ...data.arrivalInstructions ? { arrivalInstructions: data.arrivalInstructions } : {},
      coordinates: data.coordinates,
      coverageZoneId: coverage.zone.id
    };
  }
  listAddresses(customerId) {
    return this.deps.repos.addresses.list({ customerId });
  }
  /** S06: guardar nunca exige fotos, en ningún tamaño. */
  async createGarden(customerId, input) {
    const data = gardenInputSchema.parse(input);
    await this.requireAddress(customerId, data.addressId);
    const now = this.deps.now().toISOString();
    const garden = {
      id: this.deps.newId(),
      customerId,
      name: data.name,
      addressId: data.addressId,
      sizeBand: data.sizeBand,
      accessNotes: data.accessNotes,
      photos: [],
      createdAt: now,
      updatedAt: now
    };
    return this.deps.repos.gardens.save(garden);
  }
  /** S06 · Guardar jardín: usa una dirección guardada o crea una nueva, y adjunta las fotos. */
  async registerGarden(customerId, input) {
    if (input.photoKeys.length > MAX_PHOTOS_PER_GARDEN) {
      throw new Error(`Puedes subir hasta ${MAX_PHOTOS_PER_GARDEN} fotos por jard\xEDn.`);
    }
    gardenInputSchema.parse({ ...input.garden, addressId: "pendiente" });
    const addressId = "addressId" in input.address ? (await this.requireAddress(customerId, input.address.addressId)).id : (await this.addAddress(customerId, input.address)).id;
    let garden = await this.createGarden(customerId, { ...input.garden, addressId });
    for (const key of input.photoKeys) garden = await this.addPhoto(customerId, garden.id, key);
    return garden;
  }
  /** D01: un jardín del cliente con su dirección. */
  async getGarden(customerId, gardenId) {
    const garden = await this.requireGarden(customerId, gardenId);
    return { garden, address: await this.requireAddress(customerId, garden.addressId) };
  }
  /** Jardines del cliente, del más reciente al más antiguo. */
  async listGardens(customerId) {
    const gardens = await this.deps.repos.gardens.list({ customerId });
    return gardens.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  /** D02: editar cambia cotizaciones futuras, nunca las existentes. */
  async updateGarden(customerId, gardenId, changes) {
    const garden = await this.requireGarden(customerId, gardenId);
    const data = gardenUpdateSchema.parse(changes);
    if (data.addressId) await this.requireAddress(customerId, data.addressId);
    const updated = {
      ...garden,
      ...data.name !== void 0 ? { name: data.name } : {},
      ...data.addressId !== void 0 ? { addressId: data.addressId } : {},
      ...data.sizeBand !== void 0 ? { sizeBand: data.sizeBand } : {},
      ...changes.accessNotes !== void 0 ? { accessNotes: changes.accessNotes.trim() } : {},
      updatedAt: this.deps.now().toISOString()
    };
    return this.deps.repos.gardens.save(updated);
  }
  /** D02/D04: guarda todos los cambios. Las cotizaciones existentes no cambian (copia congelada). */
  async editGarden(customerId, gardenId, edits) {
    const { addPhotoKeys = [], removePhotoIds = [], ...changes } = edits;
    const garden = await this.requireGarden(customerId, gardenId);
    const kept = garden.photos.filter((p) => !removePhotoIds.includes(p.id)).length;
    if (kept + addPhotoKeys.length > MAX_PHOTOS_PER_GARDEN) {
      throw new Error(`Puedes subir hasta ${MAX_PHOTOS_PER_GARDEN} fotos por jard\xEDn.`);
    }
    let updated = await this.updateGarden(customerId, gardenId, changes);
    for (const id of removePhotoIds) updated = await this.removePhoto(customerId, gardenId, id);
    for (const key of addPhotoKeys) updated = await this.addPhoto(customerId, gardenId, key);
    return updated;
  }
  /** S05: la subida real a almacenamiento privado ocurre antes; aquí solo se registra la clave. */
  async addPhoto(customerId, gardenId, storageKey) {
    const garden = await this.requireGarden(customerId, gardenId);
    if (garden.photos.length >= MAX_PHOTOS_PER_GARDEN) {
      throw new Error(`Puedes subir hasta ${MAX_PHOTOS_PER_GARDEN} fotos por jard\xEDn.`);
    }
    const now = this.deps.now().toISOString();
    const photo = { id: this.deps.newId(), gardenId, storageKey, createdAt: now };
    return this.deps.repos.gardens.save({ ...garden, photos: [...garden.photos, photo], updatedAt: now });
  }
  async removePhoto(customerId, gardenId, photoId) {
    const garden = await this.requireGarden(customerId, gardenId);
    const photos = garden.photos.filter((p) => p.id !== photoId);
    return this.deps.repos.gardens.save({ ...garden, photos, updatedAt: this.deps.now().toISOString() });
  }
  /** S07/S08 y R02: cotizar (o volver a cotizar) un jardín guardado. */
  async requestQuote(customerId, gardenId) {
    const garden = await this.requireGarden(customerId, gardenId);
    const address = await this.requireAddress(customerId, garden.addressId);
    const quote = buildQuote({ id: this.deps.newId(), garden, address, pricing: this.deps.pricing, now: this.deps.now() });
    return this.deps.repos.quotes.save(quote);
  }
  async listQuotes(customerId, gardenId) {
    const now = this.deps.now();
    const quotes = await this.deps.repos.quotes.list({ customerId, gardenId });
    return quotes.map((q) => withExpiry(q, now));
  }
  /** S07/S08: una cotización, marcada como vencida si ya pasó su vigencia. */
  async getQuote(customerId, quoteId) {
    return withExpiry(await this.requireQuote(customerId, quoteId), this.deps.now());
  }
  /** La cotización más reciente de un jardín, si tiene alguna. */
  async latestQuote(customerId, gardenId) {
    const quotes = (await this.listQuotes(customerId, gardenId)).reverse();
    return quotes.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }
  /** S07/S08: aceptar o rechazar un precio vigente. Aceptar no agenda ni cobra en Sprint 01. */
  async respondToQuote(customerId, quoteId, answer) {
    const quote = await this.requireQuote(customerId, quoteId);
    return this.deps.repos.quotes.save(respondToQuote(quote, answer, this.deps.now()));
  }
  /**
   * Arku termina una revisión manual con un importe. Lo usará el panel de Arku;
   * mientras no exista, la app lo llama con importes de demostración.
   */
  async completeReview(quoteId, reviewedTariffCents) {
    const quote = await this.deps.repos.quotes.get(quoteId);
    if (!quote) throw new NotFoundError("Cotizaci\xF3n");
    return this.deps.repos.quotes.save(completeManualReview(quote, reviewedTariffCents, this.deps.pricing, this.deps.now()));
  }
  async requireQuote(customerId, quoteId) {
    const quote = await this.deps.repos.quotes.get(quoteId);
    if (!quote || quote.customerId !== customerId) throw new NotFoundError("Cotizaci\xF3n");
    return quote;
  }
  async requireGarden(customerId, gardenId) {
    const garden = await this.deps.repos.gardens.get(gardenId);
    if (!garden || garden.customerId !== customerId) throw new NotFoundError("Jard\xEDn");
    return garden;
  }
  async requireAddress(customerId, addressId) {
    const address = await this.deps.repos.addresses.get(addressId);
    if (!address || address.customerId !== customerId) throw new NotFoundError("Direcci\xF3n");
    return address;
  }
};

// src/function.ts
import { createClient } from "npm:@supabase/supabase-js@2.118.0";

// src/protocol.ts
var CUSTOMER_METHODS = [
  "getCustomer",
  "updateCustomerProfile",
  "listAddresses",
  "addAddress",
  "updateAddress",
  "createGarden",
  "registerGarden",
  "getGarden",
  "listGardens",
  "updateGarden",
  "editGarden",
  "addPhoto",
  "removePhoto",
  "requestQuote",
  "listQuotes",
  "getQuote",
  "latestQuote",
  "respondToQuote"
];
function serializeError(error) {
  if (error && typeof error === "object" && "issues" in error && Array.isArray(error.issues)) {
    const first = error.issues[0];
    return { name: "ValidationError", message: first?.message ?? "Revisa los datos." };
  }
  if (error instanceof Error) return { name: error.name, message: error.message };
  return { name: "Error", message: "Algo sali\xF3 mal. Int\xE9ntalo de nuevo." };
}

// src/server.ts
var ForbiddenError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ForbiddenError";
  }
};
function localPhone(phone) {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.startsWith("593") ? `0${digits.slice(3)}` : digits;
}
var CUSTOMER_SET = new Set(CUSTOMER_METHODS);
var KEY_PATTERN = /^[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,80}$/;
function assertOwnKeys(user, keys) {
  if (keys === void 0) return;
  if (!Array.isArray(keys)) throw new ForbiddenError("Fotos inv\xE1lidas.");
  for (const key of keys) {
    if (typeof key !== "string" || !KEY_PATTERN.test(key) || !key.startsWith(`${user.id}/`)) {
      throw new ForbiddenError("Esa foto no pertenece a tu cuenta.");
    }
  }
}
async function handleArkuCall(service, user, request) {
  const { method } = request;
  const args = Array.isArray(request.args) ? [...request.args] : [];
  if (method === "checkCoverage") return service.checkCoverage(args[0]);
  if (method === "registerCustomer") {
    if (!user.phone) throw new ForbiddenError("Verifica tu celular antes de registrarte.");
    if (await service.getCustomer(user.id)) throw new ForbiddenError("Ya tienes una cuenta registrada.");
    return service.registerCustomer(localPhone(user.phone), args[1], user.id);
  }
  if (method === "completeReview") throw new ForbiddenError("Solo Arku puede terminar una revisi\xF3n.");
  if (!CUSTOMER_SET.has(method)) throw new ForbiddenError("Operaci\xF3n no permitida.");
  args[0] = user.id;
  if (method === "addPhoto") assertOwnKeys(user, [args[2]]);
  if (method === "registerGarden") assertOwnKeys(user, args[1]?.photoKeys ?? []);
  if (method === "editGarden") assertOwnKeys(user, args[2]?.addPhotoKeys);
  const fn = service[method];
  return fn.apply(service, args);
}

// src/rows.ts
var iso = (value) => new Date(value).toISOString();
var optional = (key, value) => value === null || value === void 0 ? {} : { [key]: value };
var customerMapper = {
  toRow: (c) => ({
    id: c.id,
    phone: c.phone,
    first_name: c.firstName,
    last_name: c.lastName,
    id_number: c.idNumber,
    created_at: c.createdAt
  }),
  fromRow: (r) => ({
    id: r.id,
    phone: r.phone,
    firstName: r.first_name,
    lastName: r.last_name,
    idNumber: r.id_number,
    createdAt: iso(r.created_at)
  })
};
var addressMapper = {
  toRow: (a) => ({
    id: a.id,
    customer_id: a.customerId,
    label: a.label,
    line: a.line,
    reference: a.reference ?? null,
    arrival_instructions: a.arrivalInstructions ?? null,
    lat: a.coordinates.lat,
    lng: a.coordinates.lng,
    coverage_zone_id: a.coverageZoneId,
    created_at: a.createdAt
  }),
  fromRow: (r) => ({
    id: r.id,
    customerId: r.customer_id,
    label: r.label,
    line: r.line,
    ...optional("reference", r.reference),
    ...optional("arrivalInstructions", r.arrival_instructions),
    coordinates: { lat: r.lat, lng: r.lng },
    coverageZoneId: r.coverage_zone_id,
    createdAt: iso(r.created_at)
  })
};
var photoMapper = {
  toRow: (p, customerId) => ({
    id: p.id,
    garden_id: p.gardenId,
    customer_id: customerId,
    storage_key: p.storageKey,
    created_at: p.createdAt
  }),
  fromRow: (r) => ({
    id: r.id,
    gardenId: r.garden_id,
    storageKey: r.storage_key,
    createdAt: iso(r.created_at)
  })
};
var gardenMapper = {
  /** Sin las fotos: van en su propia tabla. */
  toRow: (g) => ({
    id: g.id,
    customer_id: g.customerId,
    address_id: g.addressId,
    name: g.name,
    size_band: g.sizeBand,
    access_notes: g.accessNotes,
    created_at: g.createdAt,
    updated_at: g.updatedAt
  }),
  fromRow: (r) => ({
    id: r.id,
    customerId: r.customer_id,
    addressId: r.address_id,
    name: r.name,
    sizeBand: r.size_band,
    accessNotes: r.access_notes,
    // Mismo orden en que se agregaron.
    photos: (r.garden_photos ?? []).map(photoMapper.fromRow).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at)
  })
};
var quoteMapper = {
  toRow: (q) => ({
    id: q.id,
    customer_id: q.customerId,
    garden_id: q.gardenId,
    route: q.route,
    status: q.status,
    snapshot: q.snapshot,
    price: q.price ?? null,
    created_at: q.createdAt,
    expires_at: q.expiresAt ?? null,
    responded_at: q.respondedAt ?? null
  }),
  fromRow: (r) => ({
    id: r.id,
    customerId: r.customer_id,
    gardenId: r.garden_id,
    route: r.route,
    status: r.status,
    snapshot: r.snapshot,
    ...optional("price", r.price),
    createdAt: iso(r.created_at),
    ...optional("expiresAt", r.expires_at ? iso(r.expires_at) : null),
    ...optional("respondedAt", r.responded_at ? iso(r.responded_at) : null)
  })
};
var toColumn = (field) => field.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

// src/supabase-repositories.ts
function check(result, what) {
  if (result.error) throw new Error(`No se pudo ${what}: ${result.error.message}`);
  return result.data;
}
function columns(where = {}) {
  return Object.fromEntries(Object.entries(where).map(([k, v]) => [toColumn(k), v]));
}
var TableRepository = class {
  constructor(db, table, map) {
    this.db = db;
    this.table = table;
    this.map = map;
  }
  db;
  table;
  map;
  async get(id) {
    const row = check(await this.db.from(this.table).select("*").eq("id", id).maybeSingle(), `leer ${this.table}`);
    return row ? this.map.fromRow(row) : void 0;
  }
  async list(where) {
    const rows = check(await this.db.from(this.table).select("*").match(columns(where)), `listar ${this.table}`);
    return rows.map(this.map.fromRow);
  }
  async save(item) {
    check(await this.db.from(this.table).upsert(this.map.toRow(item)), `guardar en ${this.table}`);
    return item;
  }
  async remove(id) {
    check(await this.db.from(this.table).delete().eq("id", id), `borrar de ${this.table}`);
  }
};
var GardenTableRepository = class {
  constructor(db) {
    this.db = db;
  }
  db;
  async get(id) {
    const row = check(await this.db.from("gardens").select("*, garden_photos(*)").eq("id", id).maybeSingle(), "leer el jard\xEDn");
    return row ? gardenMapper.fromRow(row) : void 0;
  }
  async list(where) {
    const rows = check(await this.db.from("gardens").select("*, garden_photos(*)").match(columns(where)), "listar jardines");
    return rows.map(gardenMapper.fromRow);
  }
  async save(garden) {
    check(await this.db.from("gardens").upsert(gardenMapper.toRow(garden)), "guardar el jard\xEDn");
    const keep = garden.photos.map((p) => p.id);
    let stale = this.db.from("garden_photos").delete().eq("garden_id", garden.id);
    if (keep.length) stale = stale.not("id", "in", `(${keep.join(",")})`);
    check(await stale, "quitar fotos del jard\xEDn");
    if (keep.length) {
      check(
        await this.db.from("garden_photos").upsert(garden.photos.map((p) => photoMapper.toRow(p, garden.customerId))),
        "guardar las fotos del jard\xEDn"
      );
    }
    return garden;
  }
  async remove(id) {
    check(await this.db.from("gardens").delete().eq("id", id), "borrar el jard\xEDn");
  }
};
function createSupabaseRepositories(db) {
  return {
    customers: new TableRepository(db, "customers", customerMapper),
    addresses: new TableRepository(db, "addresses", addressMapper),
    gardens: new GardenTableRepository(db),
    quotes: new TableRepository(db, "quotes", quoteMapper)
  };
}

// src/function.ts
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
var json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: { name: "Error", message: "Usa POST." } }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json({ ok: false, error: { name: "Error", message: "Servidor sin configurar." } }, 500);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return json({ ok: false, error: { name: "AuthError", message: "Inicia sesi\xF3n de nuevo." } }, 401);
  try {
    const request = await req.json();
    const service = new GardenService({
      repos: createSupabaseRepositories(admin),
      coverage: new FixtureCoverageService(),
      pricing: DEMO_PRICING,
      newId: () => crypto.randomUUID(),
      now: () => /* @__PURE__ */ new Date()
    });
    const result = await handleArkuCall(service, { id: data.user.id, phone: data.user.phone }, request);
    return json({ ok: true, result: result ?? null });
  } catch (e) {
    return json({ ok: false, error: serializeError(e) });
  }
});
