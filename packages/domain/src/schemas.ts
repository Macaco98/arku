import { z } from 'zod';
import { validateCedula } from './cedula';
import { ADDRESS_LABELS, SIZE_BANDS } from './types';

export const MAX_PHOTOS_PER_GARDEN = 6;
export const MAX_ACCESS_NOTES = 300;
export const MAX_ARRIVAL_INSTRUCTIONS = 300;

const name = (field: string) =>
  z
    .string()
    .trim()
    .min(2, `Escribe tu ${field}.`)
    .max(60, `El ${field} es demasiado largo.`);

/** A01/A02: celular ecuatoriano verificado por SMS. */
export const phoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => /^09\d{8}$/.test(v), 'Ingresa un celular de 10 dígitos que empiece con 09.');

/** A03 · Tus datos. */
export const customerProfileSchema = z.object({
  firstName: name('nombre'),
  lastName: name('apellido'),
  idNumber: z
    .string()
    .superRefine((value, ctx) => {
      const result = validateCedula(value);
      if (result.status !== 'valid') {
        ctx.addIssue({ code: 'custom', message: result.message || 'Ingresa tu número de cédula.' });
      }
    })
    .transform((v) => v.replace(/\D/g, '')),
});
export type CustomerProfileInput = z.input<typeof customerProfileSchema>;

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/** S03 · Dirección. */
export const addressInputSchema = z.object({
  label: z.enum(ADDRESS_LABELS as [string, ...string[]]),
  line: z.string().trim().min(5, 'Escribe la dirección.'),
  reference: z.string().trim().max(200).optional(),
  arrivalInstructions: z.string().trim().max(MAX_ARRIVAL_INSTRUCTIONS).optional(),
  coordinates: coordinatesSchema,
});
export type AddressInput = z.input<typeof addressInputSchema>;

/** S03–S05 · Datos del jardín. Las fotos son opcionales para guardar. */
export const gardenInputSchema = z.object({
  name: z.string().trim().min(2, 'Ponle un nombre a tu jardín.').max(40),
  addressId: z.string().min(1),
  sizeBand: z.enum(SIZE_BANDS as [string, ...string[]]),
  accessNotes: z.string().trim().max(MAX_ACCESS_NOTES, `Máximo ${MAX_ACCESS_NOTES} caracteres.`).default(''),
});
export type GardenInput = z.input<typeof gardenInputSchema>;

export const gardenUpdateSchema = gardenInputSchema.partial();
export type GardenUpdate = z.input<typeof gardenUpdateSchema>;
