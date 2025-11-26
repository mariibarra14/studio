
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
};
