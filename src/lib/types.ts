
export type TicketTier = {
  id: string;
  nombre: string;
  precio: number;
  // 'available' is not in the API response for now, but might be useful later.
  // available: number; 
};

export type ApiEvent = {
  id: string;
  nombre: string;
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
  localidades: TicketTier[];
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

    
