
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
  asientoId: string;
  precioUnitario: number;
  label: string;
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
}
