import type { AddressLabel, Coordinates, SizeBand } from '@arku/domain';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { PickedPhoto } from './photos';

/** Dirección nueva que se escribe en S03. Se guarda recién en S06. */
export interface NewAddressDraft {
  label: AddressLabel;
  line: string;
  reference: string;
  arrivalInstructions: string;
  coordinates?: Coordinates;
  /** Nombre de la zona de cobertura que validó el punto. */
  zoneName?: string;
}

/** Borrador del registro S03–S06. Vive en memoria hasta "Guardar jardín". */
export interface GardenDraft {
  /** Dirección guardada elegida; si no hay, se usa newAddress. */
  savedAddressId?: string;
  newAddress: NewAddressDraft;
  name: string;
  sizeBand?: SizeBand;
  photos: PickedPhoto[];
  accessNotes: string;
}

const EMPTY: GardenDraft = {
  newAddress: { label: 'Casa', line: '', reference: '', arrivalInstructions: '' },
  name: '',
  photos: [],
  accessNotes: '',
};

interface RegistroValue {
  draft: GardenDraft;
  update: (changes: Partial<GardenDraft>) => void;
  updateAddress: (changes: Partial<NewAddressDraft>) => void;
  /** true si el cliente ya escribió algo, para preguntar antes de salir. */
  dirty: boolean;
}

const RegistroContext = createContext<RegistroValue | null>(null);

export function RegistroProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<GardenDraft>(EMPTY);

  const update = useCallback((changes: Partial<GardenDraft>) => setDraft((d) => ({ ...d, ...changes })), []);
  const updateAddress = useCallback(
    (changes: Partial<NewAddressDraft>) => setDraft((d) => ({ ...d, newAddress: { ...d.newAddress, ...changes } })),
    [],
  );
  const dirty =
    draft.name.trim() !== '' ||
    draft.newAddress.line.trim() !== '' ||
    draft.sizeBand !== undefined ||
    draft.photos.length > 0 ||
    draft.accessNotes.trim() !== '';

  const value = useMemo(() => ({ draft, update, updateAddress, dirty }), [draft, update, updateAddress, dirty]);
  return <RegistroContext.Provider value={value}>{children}</RegistroContext.Provider>;
}

export function useRegistro() {
  const value = useContext(RegistroContext);
  if (!value) throw new Error('useRegistro debe usarse dentro de RegistroProvider');
  return value;
}

/** Salir del registro: requestExit pregunta si hay datos; exit cierra sin preguntar. */
export const RegistroExitContext = createContext<{ requestExit: () => void; exit: (opts?: { keepPhotos?: boolean }) => void } | null>(null);

export function useRegistroExit() {
  const value = useContext(RegistroExitContext);
  if (!value) throw new Error('useRegistroExit debe usarse dentro del registro');
  return value;
}
