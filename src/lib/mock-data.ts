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
            { id: 't3-2', name: 'General', price: 70, available: 2200 },
        ]
    },
    {
        id: '4',
        name: 'Karol G - Mañana Será Bonito Tour',
        date: '12-13 Jul 2024',
        location: 'Estadio El Campín, Bogotá',
        image: PlaceHolderImages.find(p => p.id === 'event-pop-concert-1')!,
        description: 'La superestrella mundial Karol G trae su gira "Mañana Será Bonito" a Bogotá para dos noches espectaculares. ¡No te pierdas a la Bichota en vivo!',
        remainingTickets: 500,
        tiers: [
            { id: 't4-1', name: 'Platino', price: 300, available: 100 },
            { id: 't4-2', name: 'Occidental', price: 150, available: 400 },
        ],
    },
    {
        id: '5',
        name: 'Ópera: La Traviata de Verdi',
        date: '28 Jul 2024',
        location: 'Teatro Colón, Bogotá',
        image: PlaceHolderImages.find(p => p.id === 'event-classical-music-1')!,
        description: 'Una producción impresionante de la obra maestra de Verdi, La Traviata. Vive la trágica historia de amor de Violetta y Alfredo en el histórico Teatro Colón.',
        remainingTickets: 120,
        tiers: [
            { id: 't5-1', name: 'Palco', price: 220, available: 20 },
            { id: 't5-2', name: 'Luneta', price: 110, available: 100 },
        ],
    },
    {
        id: '6',
        name: 'Feria Internacional del Libro de Bogotá (FILBo)',
        date: '17 Abr - 02 May 2024',
        location: 'Corferias, Bogotá',
        image: PlaceHolderImages.find(p => p.id === 'event-art-exhibition-1')!,
        description: 'El evento cultural más importante de Bogotá, que reúne a autores, editoriales y lectores de todo el mundo. Disfruta de lanzamientos de libros, charlas y más.',
        remainingTickets: 10000,
        tiers: [
            { id: 't6-1', name: 'Entrada General', price: 10, available: 10000 },
        ],
    },
    {
        id: '7',
        name: 'Baum Festival 2024',
        date: '20-21 May 2024',
        location: 'Corferias, Bogotá',
        image: PlaceHolderImages.find(p => p.id === 'event-dj-set-1')!,
        description: 'El festival de música electrónica más grande de Colombia regresa con un line-up de DJs internacionales y locales de primer nivel. ¡Prepárate para bailar sin parar!',
        remainingTickets: 800,
        tiers: [
            { id: 't7-1', name: 'VIP', price: 200, available: 200 },
            { id: 't7-2', name: 'General', price: 100, available: 600 },
        ],
    },
    {
        id: '8',
        name: 'Show de Magia: "Ilusiones"',
        date: '10 Jun 2024',
        location: 'Teatro Nacional La Castellana, Bogotá',
        image: PlaceHolderImages.find(p => p.id === 'event-theater-play-1')!,
        description: 'Un espectáculo de magia asombroso que desafiará tus sentidos y te dejará sin aliento. Perfecto para toda la familia.',
        remainingTickets: 400,
        tiers: [
            { id: 't8-1', name: 'Platea', price: 80, available: 100 },
            { id: 't8-2', name: 'Balcón', price: 50, available: 300 },
        ],
    },
];
