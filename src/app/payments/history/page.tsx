"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, RefreshCw, Printer, Calendar, CreditCard, UserCheck, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/context/app-context";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Tipos TypeScript
type Evento = {
  id: string;
  nombre: string;
  organizadorId: string;
  lugar?: string;
  inicio?: string;
  imagenUrl?: string;
};

type PagoBase = {
  idPago: string;
  idMPago: string;
  idExternalPago: string;
  idUsuario: string;
  idReserva: string;
  idEvento: string;
  fechaPago: string;
  monto: number;
};

type PagoCompleto = PagoBase & {
  reserva?: {
    estado: string;
    precioTotal?: number;
    asientos?: any[];
  } | null;
  usuario?: {
    nombre: string;
    apellido: string;
    correo: string;
    telefono?: string;
  } | null;
  evento?: Evento;
};

export default function PaymentsHistoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userRole, isLoadingUser } = useApp();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [pagosEvento, setPagosEvento] = useState<PagoCompleto[]>([]);
  const [isLoading, setIsLoading] = useState({ eventos: true, pagos: false });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoadingUser && userRole !== 'organizador' && userRole !== 'administrador') {
      toast({
        variant: "destructive",
        title: "Acceso no autorizado",
        description: "Esta sección es solo para organizadores y administradores.",
      });
      router.push('/profile');
    } else if (!isLoadingUser) {
      cargarEventosOrganizador();
    }
  }, [userRole, isLoadingUser, router, toast]);

  const cargarEventosOrganizador = async () => {
    setIsLoading(prev => ({ ...prev, eventos: true }));
    setError(null);

    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
      setError("No autenticado. Por favor inicia sesión.");
      setIsLoading(prev => ({ ...prev, eventos: false }));
      return;
    }

    try {
      const response = await fetch('http://localhost:44335/api/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("Error al cargar eventos");
      }

      const todosEventos = await response.json();
      
      const eventosOrganizador = (userRole === 'administrador') 
        ? todosEventos 
        : todosEventos.filter((evento: any) => evento.organizadorId === userId);

      setEventos(eventosOrganizador);

      if (eventosOrganizador.length > 0) {
        cargarPagosEvento(eventosOrganizador[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(prev => ({ ...prev, eventos: false }));
    }
  };

  const cargarPagosEvento = async (evento: Evento) => {
    setEventoSeleccionado(evento);
    setIsLoading(prev => ({ ...prev, pagos: true }));
    setPagosEvento([]);

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError("No autenticado");
      setIsLoading(prev => ({ ...prev, pagos: false }));
      return;
    }

    try {
      const responsePagos = await fetch(
        `http://localhost:44335/api/Pagos/GetPagoPorIdEvento?idEvento=${evento.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!responsePagos.ok) {
        if (responsePagos.status === 404) {
          setPagosEvento([]);
          return;
        }
        throw new Error("Error al cargar pagos del evento");
      }

      const pagosData = await responsePagos.json();
      
      const pagosEnriquecidos = await Promise.all(
        pagosData.map(async (pago: PagoBase) => {
          try {
            const [reservaInfo, usuarioInfo] = await Promise.all([
              obtenerInfoReserva(pago.idReserva, token),
              obtenerInfoUsuario(pago.idUsuario, token)
            ]);

            return {
              ...pago,
              reserva: reservaInfo,
              usuario: usuarioInfo,
              evento: evento
            };
          } catch (error) {
            console.error(`Error enriqueciendo pago ${pago.idPago}:`, error);
            return { ...pago, reserva: null, usuario: null, evento };
          }
        })
      );

      setPagosEvento(pagosEnriquecidos);
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setIsLoading(prev => ({ ...prev, pagos: false }));
    }
  };

  const obtenerInfoReserva = async (reservaId: string, token: string) => {
    try {
      const response = await fetch(
        `http://localhost:44335/api/Reservas/${reservaId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const reserva = await response.json();
        return {
          estado: reserva.estado,
          precioTotal: reserva.precioTotal,
          asientos: reserva.asientos || []
        };
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo info reserva:', error);
      return null;
    }
  };

  const obtenerInfoUsuario = async (usuarioId: string, token: string) => {
    try {
      const response = await fetch(
        `http://localhost:44335/api/Usuarios/getUsuarioById?id=${usuarioId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const usuario = await response.json();
        return {
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          correo: usuario.correo,
          telefono: usuario.telefono
        };
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo info usuario:', error);
      return null;
    }
  };

  const imprimirReporteEvento = async (evento: Evento, pagos: PagoCompleto[]) => {
    const { default: jsPDF } = await import('jspdf');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // --- Header ---
    const primaryColor = '#4F46E5'; 
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text('REPORTE DE PAGOS', margin, 18);
    doc.setFontSize(12);
    doc.text('Organizador', pageWidth - margin - 30, 18);


    doc.setTextColor(0, 0, 0);
    let yPosition = 45;

    // --- Event Info ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text('Información del Evento', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Evento: ${evento.nombre}`, margin, yPosition);
    yPosition += 6;
    if (evento.lugar) {
      doc.text(`Lugar: ${evento.lugar}`, margin, yPosition);
      yPosition += 6;
    }
    doc.text(`Fecha de Reporte: ${format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}`, margin, yPosition);
    yPosition += 10;
    
    // --- Summary ---
    doc.setLineWidth(0.2);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    const totalRecaudado = pagos.reduce((sum, pago) => sum + pago.monto, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('Resumen General', margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total de Pagos Registrados: ${pagos.length}`, margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Recaudado: $${totalRecaudado.toFixed(2)}`, margin, yPosition);
    yPosition += 15;


    // --- Payments Table ---
    if (pagos.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text('Desglose de Pagos', margin, yPosition);
      yPosition += 10;
      
      const addPageIfNeeded = () => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = margin;
        }
      };

      pagos.forEach((pago, index) => {
        addPageIfNeeded();
        
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`Pago #${index + 1}`, margin, yPosition + 5);
        
        doc.setFont("helvetica", "normal");
        const usuarioNombre = pago.usuario ? `${pago.usuario.nombre} ${pago.usuario.apellido}` : 'Usuario no disponible';
        doc.text(`Usuario: ${usuarioNombre}`, margin, yPosition + 12);
        
        const fechaPago = format(new Date(pago.fechaPago), "dd/MM/yyyy h:mm a", { locale: es });
        doc.text(`Fecha: ${fechaPago}`, margin, yPosition + 18);
        
        doc.text(`ID Pago: ${pago.idPago}`, margin, yPosition + 24);
        
        doc.setFont("helvetica", "bold");
        doc.text(`Monto: $${pago.monto.toFixed(2)}`, pageWidth - margin - 50, yPosition + 12);
        
        yPosition += 35;
      });
    }

    doc.save(`reporte-pagos-${evento.nombre.replace(/ /g, "_").substring(0, 20)}.pdf`);
  };

  const PagoEventoCard = ({ pago }: { pago: PagoCompleto }) => {
    const [isPrinting, setIsPrinting] = useState(false);

    const handleImprimirRecibo = async () => {
      setIsPrinting(true);
      try {
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();

        // --- Header ---
        const primaryColor = '#4F46E5';
        doc.setFillColor(primaryColor);
        doc.rect(0, 0, pageWidth, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text('RECIBO DE PAGO', margin, 18);
        doc.setFontSize(12);
        doc.text('VIVOPASS', pageWidth - margin - 35, 18);

        let yPosition = 45;
        doc.setTextColor(0, 0, 0);

        // --- Details ---
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`Evento: ${pago.evento?.nombre || 'N/A'}`, margin, yPosition);
        yPosition += 7;
        doc.text(`Usuario: ${pago.usuario?.nombre || 'N/A'} ${pago.usuario?.apellido || ''}`, margin, yPosition);
        yPosition += 7;
        doc.text(`Monto Pagado: $${pago.monto.toFixed(2)}`, margin, yPosition);
        yPosition += 7;
        doc.text(`Fecha de Pago: ${format(new Date(pago.fechaPago), "dd 'de' MMMM, yyyy", { locale: es })}`, margin, yPosition);
        yPosition += 7;
        doc.text(`ID de Pago: ${pago.idPago}`, margin, yPosition);
        yPosition += 7;
        doc.text(`ID de Reserva: ${pago.idReserva}`, margin, yPosition);

        doc.save(`recibo-${pago.idPago.substring(0, 8)}.pdf`);
      } catch (error) {
        console.error('Error generando recibo:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo generar el recibo",
        });
      } finally {
        setIsPrinting(false);
      }
    };

    return (
      <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div className="space-y-3 flex-1">
            {pago.usuario && (
              <div>
                <p className="font-semibold">{pago.usuario.nombre} {pago.usuario.apellido}</p>
                <p className="text-sm text-muted-foreground">{pago.usuario.correo}{pago.usuario.telefono && ` • ${pago.usuario.telefono}`}</p>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Monto</p>
                <p className="font-semibold text-green-600">${pago.monto.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fecha</p>
                <p className="font-medium">{new Date(pago.fechaPago).toLocaleDateString('es-ES')}</p>
                <p className="text-xs text-muted-foreground">{new Date(pago.fechaPago).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Estado</p>
                <Badge variant={pago.reserva?.estado === 'Confirmada' ? 'default' : 'secondary'}>
                  {pago.reserva?.estado || 'N/A'}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">ID Pago</p>
                <p className="font-mono text-xs bg-muted px-2 py-1 rounded">{pago.idPago.substring(0, 8)}...</p>
              </div>
            </div>
          </div>
          <Button onClick={handleImprimirRecibo} disabled={isPrinting} variant="outline" size="sm" className="ml-4 flex-shrink-0">
            {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    );
  };
  
  if (isLoadingUser || (userRole !== 'organizador' && userRole !== 'administrador')) {
    return (
       <AuthenticatedLayout>
          <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
            {isLoadingUser ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                 <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Acceso Restringido</AlertTitle>
                    <AlertDescription>Esta sección es solo para organizadores y administradores.</AlertDescription>
                 </Alert>
            )}
          </main>
       </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">Historial de Pagos</h1>
              <p className="text-muted-foreground mt-2">Consulta los pagos realizados a tus eventos.</p>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                <UserCheck className="h-4 w-4" />
                Rol: {userRole === 'administrador' ? 'Administrador' : 'Organizador'}
              </div>
            </div>
            <Button onClick={cargarEventosOrganizador} variant="outline" disabled={isLoading.eventos}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading.eventos ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Mis Eventos</CardTitle>
              <CardDescription>Selecciona un evento para ver sus pagos.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading.eventos ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : eventos.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tienes eventos creados</h3>
                  <p className="text-muted-foreground mb-4">Crea tu primer evento para comenzar a recibir pagos.</p>
                  <Button asChild><Link href="/events/my"><Plus className="h-4 w-4 mr-2" />Crear Evento</Link></Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {eventos.map((evento) => (
                    <div key={evento.id} className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${eventoSeleccionado?.id === evento.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-muted'}`} onClick={() => cargarPagosEvento(evento)}>
                      <div className="flex items-start gap-3">
                        {evento.imagenUrl && <div className="flex-shrink-0"><Image src={evento.imagenUrl} alt={evento.nombre} width={50} height={50} className="rounded object-cover aspect-square" /></div>}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2">{evento.nombre}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{evento.lugar}</p>
                          {evento.inicio && <p className="text-xs text-muted-foreground">{new Date(evento.inicio).toLocaleDateString('es-ES')}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {eventoSeleccionado && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Pagos de: {eventoSeleccionado.nombre}</CardTitle>
                    <CardDescription>
                      {pagosEvento.length} pago(s) realizados
                      {pagosEvento.length > 0 && <span className="ml-2 text-green-600 font-semibold">• Total recaudado: ${pagosEvento.reduce((sum, pago) => sum + pago.monto, 0).toFixed(2)}</span>}
                    </CardDescription>
                  </div>
                  {pagosEvento.length > 0 && <Button onClick={() => imprimirReporteEvento(eventoSeleccionado, pagosEvento)} variant="outline" size="sm"><Printer className="h-4 w-4 mr-2" />Exportar Reporte</Button>}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading.pagos ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : pagosEvento.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay pagos para este evento</h3>
                    <p className="text-muted-foreground">Aún no se han realizado pagos para "{eventoSeleccionado.nombre}"</p>
                  </div>
                ) : (
                  <div className="space-y-4">{pagosEvento.map((pago) => <PagoEventoCard key={pago.idPago} pago={pago} />)}</div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
