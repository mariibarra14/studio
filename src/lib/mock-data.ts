import { PlaceHolderImages, ImagePlaceholder } from './placeholder-images';

export type TicketTier = {
    id: string;
    name: string;
    price: number;
    available: number;
};

export type MockEvent = {
    id: string;
    name: string;
    date: string;
    location: string;
    image: ImagePlaceholder;
    description: string;
    remainingTickets: number;
    tiers: TicketTier[];
};

export const mockEvents: MockEvent[] = [
    {
        id: '1',
        name: 'Estéreo Picnic 2024',
        date: '21-24 Mar 2024',
        location: 'Parque Simón Bolívar, Bogotá',
        image: PlaceHolderImages.find(p => p.id === 'event-music-festival-1')!,
        description: 'El Festival Estéreo Picnic es uno de los festivales de música más grandes e importantes de Colombia y de Sudamérica. Presenta una mezcla diversa de artistas de rock, pop, electrónica y más.',
        remainingTickets: 1500,
        tiers: [
            { id: 't1-1', name: 'VIP', price: 250, available: 100 },
            { id: 't1-2', name: 'General', price: 120, available: 1400 },
        ],
    },
    {
        id: '2',
        name: 'Concierto de Rock Sinfónico',
        date: '15 Abr 2024',
        location: 'Teatro Mayor Julio Mario Santo Domingo, Bogotá',
        image: PlaceHolderImages.find(p => p.id === 'event-rock-band-1')!,
        description: 'Una fusión única de rock clásico y música sinfónica, con una orquesta completa acompañando a una legendaria banda de rock. Una noche inolvidable de poder musical.',
        remainingTickets: 300,
        tiers: [
            { id: 't2-1', name: 'Platea', price: 180, available: 50 },
            { id: 't2-2', name: 'Balcón', price: 90, available: 250 },
        ],
    },
    {
        id: '3',
        name: 'Noche de Comedia con Andrés López',
        date: '05 May 2024',
        location: 'Movistar Arena, Bogotá',
        image: PlaceHolderImages.find(p => p.id === 'event-standup-comedy-1')!,
        description: 'Disfruta de una noche de risas con el pionero del stand-up comedy en Colombia, Andrés López. Un espectáculo lleno de humor, anécdotas y la famosa "Pelota de Letras".',
        remainingTickets: 2500,
        tiers: [
            { id: 't3-1', name: 'VIP', price: 150, available: 300 },
            { id