
import { PlaceHolderImages, ImagePlaceholder } from './placeholder-images';
import type { ApiEvent as MockEvent, TicketTier } from './types';


// This data is now for reference and backup, the app primarily uses the API.

export const mockEvents: MockEvent[] = [
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
        localidades: [
            { id: 't1-1', nombre: 'VIP', precio: 250 },
            { id: 't1-2', nombre: 'General', precio: 120 },
        ],
    },
];

export type MockBooking = {
    id: string;
    event: MockEvent;
    tier: TicketTier;
    quantity: number;
    totalPrice: number;
    seat: string;
    status: 'Confirmed' | 'Pending Payment' | 'Cancelled';
};

export const mockBookings: MockBooking[] = [
    {
        id: 'b1',
        event: {
          ...mockEvents[0],
          name: 'Concierto de Rock Sinfónico',
          date: '15 Abr 2024',
          location: 'Teatro Mayor Julio Mario Santo Domingo, Bogotá',
          image: PlaceHolderImages.find(p => p.id === 'event-rock-band-1')!,
        } as any,
        tier: { id: 't2-1', nombre: 'Platea', precio: 180 },
        quantity: 2,
        totalPrice: 360,
        seat: 'Platea, Fila 5, Asientos 12-13',
        status: 'Confirmed',
    },
    {
        id: 'b2',
        event: {
          ...mockEvents[0],
          name: 'Karol G - Mañana Será Bonito Tour',
          date: '12-13 Jul 2024',
          location: 'Estadio El Campín, Bogotá',
          image: PlaceHolderImages.find(p => p.id === 'event-pop-concert-1')!,
        } as any,
        tier: { id: 't4-2', nombre: 'Occidental', precio: 150 },
        quantity: 4,
        totalPrice: 600,
        seat: 'Sección 204, Fila 8',
        status: 'Pending Payment',
    },
];
