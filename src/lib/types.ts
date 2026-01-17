


export type TicketTier = {
  id: string;
  nombre: string;
  precio: number;
};

export type Zone = {
  id: string;
  nombre: string;
  capacidad: number;
  precio: number;
  tipo: string;
  estado: string;
};

export type ApiEvent = {
  id: string;
  nombre:string;
  descripcion: string | null;
  inicio: string;
  fin: string | null;
  lugar: string;
  aforoMaximo: number;
  tipo: string;
  estado: string;
  imagenUrl: string | null;
  folletoUrl: string | null;
  organizadorId: string;
  escenarioId: string;
  createdAt: string;
  updatedAt: string;
  zonas?: Zone[];
  categoriaId: string;
  onlineMeetingUrl?: string | null;
};

export type Venue = {
  id: string;
  nombre: string;
  ubicacion: string;
  ciudad: string;
  estado: string;
  pais: string;
  descripcion: string;
  capacidadTotal: number;
  activo: boolean;
};

export type Organizer = {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  fotoPerfil: string;
};

export interface Seat {
  id?: string; // This might be the same as asientoId, unifying
  asientoId: string;
  precioUnitario: number;
  label: string;
  estado?: string; // e.g., 'hold', 'available', 'sold'
}

export interface ApiBooking {
  reservaId: string;
  eventId: string;
  zonaEventoId: string;
  usuarioId: string;
  estado: string;
  creadaEn: string;
  expiraEn: string;
  precioTotal: number;
  asientos: Seat[];
  zonaNombre?: string;
  eventoNombre?: string;
  eventoImagen?: string;
  eventoCategoriaNombre?: string;
  eventoInicio?: string;
  eventoFin?: string;
  escenarioNombre?: string;
  escenarioUbicacion?: string;
  complementaryProducts?: Product[];
  eventoTipo?: string;
  onlineMeetingUrl?: string;
}

export type Payment = {
  idPago: string;
  idMPago: string;
  idExternalPago: string;
  idUsuario: string;
  idReserva: string;
  idEvento: string;
  fechaPago: string;
  monto: number;
};

export type EnrichedPayment = Payment & {
  evento?: {
    nombre: string;
    lugar?: string;
    inicio?: string;
    imagenUrl?: string;
  } | null;
  reserva?: {
    estado: string;
    precioTotal?: number;
  } | null;
  metodoPago?: {
    marca: string;
    ultimos4: string;
    mesExpiracion: number;
    anioExpiracion: number;
  } | null;
};

export type TimeRange = {
  inicio: string;
  fin: string;
};

export type Schedule = {
  dia: string;
  rangos: TimeRange[];
};

export type ComplementaryService = {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string;
  horario: Schedule[];
  fotoServicio: string;
};

export type Product = {
  id: string;
  idServicio: string;
  nombre: string;
  precio: number;
  cantidad: number;
  descripcion: string;
  fotoProducto: string;
};

export type ServiceBookingRecord = {
  id: string;
  idServicio: string;
  idOrganizador: string;
  idEvento: string;
  fechaInicio: string;
  fechaFin: string;
};

export type AssociatedService = {
  bookingId: string;
  serviceId: string;
  serviceName: string;
  serviceType: string;
  servicePhoto?: string | null;
  startDate: string;
  endDate: string;
};

export type MyServiceBooking = {
  id: string;
  idServicio: string;
  idEvento: string;
  fechaInicio: string;
  fechaFin: string;
  serviceName: string;
  servicePhoto: string;
  serviceType: string;
  eventName: string;
  eventLugar: string;
  eventInicio: string;
};

export type Survey = {
  id: string;
  eventoId: string;
  usuarioId: string;
  calificacion: number;
  comentario: string;
  fechaCreacion: string;
};

export type Forum = {
  id: string;
  eventoId: string;
  titulo: string;
  descripcion: string;
  fechaCreacion: string;
  creadorId: string;
};

export type ForumComment = {
  id: string;
  autorId: string;
  contenido: string;
  fechaCreacion: string;
};

export type ForumThread = {
  id: string;
  autorId: string;
  titulo: string;
  contenido: string;
  fechaCreacion: string;
  comentarios: ForumComment[];
};

export type EnrichedForumComment = ForumComment & {
    author?: {
        nombre: string;
        apellido: string;
        fotoPerfil: string | null;
    }
};

export type EnrichedForumThread = Omit<ForumThread, 'comentarios'> & {
    author?: {
        nombre: string;
        apellido: string;
        fotoPerfil: string | null;
    }
    comentarios: EnrichedForumComment[];
};

export type Category = {
    id: string;
    nombre: string;
    descripcion: string;
};

// --- Report Types ---
export type ZoneSale = {
  name: string;
  count: number;
  revenue: number;
};

export type ServiceSale = {
  name: string;
  count: number;
  revenue: number;
};

export type ReportData = {
  event: ApiEvent;
  organizerName: string;
  categoryName: string;
  sales: {
    ticketSales: ZoneSale[];
    serviceSales: ServiceSale[];
    totalTicketRevenue: number;
    totalServiceRevenue: number;
    grandTotal: number;
  };
  conversion: {
    totalReservations: number;
    confirmed: number;
    cancelled: number;
    confirmationRate: number;
  };
  satisfaction: {
    averageRating: number;
    totalSurveys: number;
  };
};

    