
import { PlaceHolderImages, ImagePlaceholder } from './placeholder-images';
import type { ApiEvent, TicketTier } from './types';


// This data is now for reference and backup, the app primarily uses the API.

export const mockEvents: ApiEvent[] = [
    {
        id: '1',
        nombre: 'Estéreo Picnic 2024',
        inicio: '2024-03-21T12:00:00Z',
        fin: '2024-03-24T23:59:59Z',
        lugar: 'Parque Simón Bolívar, Bogotá',
        imagenUrl: PlaceHolderImages.find(p => p.id === 'event-music-festival-1')!.imageUrl,
        descripcion: 'El Festival Estéreo Picnic es uno de los festivales de música más grandes e importantes de Colombia y de Sudamérica. Presenta una mezcla diversa de artistas de rock, pop, electrónica y más.',
        aforoMaximo: 50000,
        tipo: 'Festival',
        estado: 'Activo',
        folletoUrl: null,
        organizadorId: 'org1',
        escenarioId: 'esc1',
        createdAt: '2024-01-01T12:00:00Z',
        updatedAt: '2024-01-01T12:00:00Z',
        categoriaId: '6b4c3e7a-1f8d-42e0-b0b3-0987c6e5a4d2',
    },
];

// mockBookings is no longer used as the page connects to the real API.
// It is kept here for reference or potential testing scenarios.
export const mockBookings = [];
