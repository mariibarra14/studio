
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
  eventoCategoria?: string;
  eventoInicio?: string;
  eventoFin?: string;
  escenarioNombre?: string;
  escenarioUbicacion?: string;
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
