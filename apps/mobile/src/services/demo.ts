import type { GardenService } from '@arku/domain';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * DATOS DE DEMOSTRACIÓN. Crea los mismos jardines que el prototipo de Figma
 * para probar las listas sin pasar por el registro. Las fotos son claves
 * ficticias, no imágenes reales.
 */
export async function seedDemoGardens(service: GardenService, customerId: string) {
  const casa = await service.addAddress(customerId, {
    label: 'Casa',
    line: 'Av. Interoceánica km 12',
    reference: 'Portón negro, junto a la panadería',
    coordinates: { lat: -0.2, lng: -78.43 },
  });
  const tumbaco = await service.addAddress(customerId, {
    label: 'Familia',
    line: 'Calle Eugenio Espejo',
    coordinates: { lat: -0.21, lng: -78.4 },
  });
  const morita = await service.addAddress(customerId, {
    label: 'Otra',
    line: 'Vía a La Morita',
    coordinates: { lat: -0.22, lng: -78.38 },
  });

  // Se crean del más antiguo al más reciente: la lista muestra primero el más reciente.
  const plan = [
    { name: 'Quinta La Morita', addressId: morita.id, sizeBand: 'XL', photos: 2 },
    { name: 'Jardín Tumbaco', addressId: tumbaco.id, sizeBand: 'L', photos: 0 },
    { name: 'Casa Cumbayá · Posterior', addressId: casa.id, sizeBand: 'S', photos: 1 },
    { name: 'Casa Cumbayá', addressId: casa.id, sizeBand: 'M', photos: 3, accessNotes: 'Tocar el timbre del portón negro.' },
  ] as const;

  for (const item of plan) {
    const garden = await service.createGarden(customerId, {
      name: item.name,
      addressId: item.addressId,
      sizeBand: item.sizeBand,
      accessNotes: 'accessNotes' in item ? item.accessNotes : '',
    });
    for (let i = 0; i < item.photos; i++) {
      await service.addPhoto(customerId, garden.id, `demo/${garden.id}/${i + 1}.jpg`);
    }
    await wait(5);
  }
}
