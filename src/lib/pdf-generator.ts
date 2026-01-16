
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ApiBooking } from "./types";

const generateQRCode = async (text: string): Promise<string> => {
    try {
        const qrDataUrl = await QRCode.toDataURL(text, {
            width: 128,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        return qrDataUrl;
    } catch (err) {
        console.error('Error generating QR code:', err);
        return '';
    }
};

const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), "dd MMMM, yyyy - h:mm a", { locale: es });
}

export const generateBookingPDF = async (booking: ApiBooking) => {
    const doc = new jsPDF();
    
    // --- Header ---
    const primaryColor = '#4F46E5'; // Indigo-600
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text('VIVOPASS TICKET', 20, 18);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    
    let yPosition = 45;

    // --- Event Info ---
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(booking.eventoNombre || 'Nombre del Evento no Disponible', 20, yPosition);
    yPosition += 8;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setFillColor(243, 244, 246); // gray-100
    doc.setDrawColor(229, 231, 235); // gray-200
    doc.roundedRect(18, yPosition - 3, 174, 30, 3, 3, 'FD');

    doc.text(`Categoría: ${booking.eventoCategoria || 'N/A'}`, 22, yPosition + 5);
    doc.text(`Inicio: ${formatDate(booking.eventoInicio)}`, 22, yPosition + 12);
    doc.text(`Lugar: ${booking.escenarioNombre || 'N/A'} - ${booking.escenarioUbicacion || 'N/A'}`, 22, yPosition + 19);
    yPosition += 35;
    
    // --- Booking Info ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('Detalles de tu Reserva', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Zona: ${booking.zonaNombre || 'N/A'}`, 22, yPosition);
    yPosition += 7;
    doc.text(`Asientos:`, 22, yPosition);
    yPosition += 7;

    booking.asientos.forEach((asiento, index) => {
        doc.text(`  • ${asiento.label} - $${asiento.precioUnitario.toFixed(2)}`, 25, yPosition);
        yPosition += 6;
    });
    
    yPosition += 5;

    if (booking.complementaryProducts && booking.complementaryProducts.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text('Productos Adicionales:', 22, yPosition);
        yPosition += 7;
        doc.setFont("helvetica", "normal");
        booking.complementaryProducts.forEach(product => {
            doc.text(`  • ${product.nombre} - $${product.precio.toFixed(2)}`, 25, yPosition);
            yPosition += 6;
        });
        yPosition += 2;
    }
    
    const ticketsTotal = booking.precioTotal;
    const productsTotal = booking.complementaryProducts?.reduce((sum, p) => sum + p.precio, 0) || 0;
    const grandTotal = ticketsTotal + productsTotal;

    doc.setFont("helvetica", "bold");
    doc.text(`Total Pagado: $${grandTotal.toFixed(2)}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Estado: Confirmada`, 20, yPosition);
    yPosition += 15;


    // --- QR Code ---
    const qrData = await generateQRCode(booking.reservaId);
    if (qrData) {
        doc.addImage(qrData, 'PNG', 130, yPosition - 40, 60, 60);
    } else {
        doc.text('No se pudo generar el QR', 130, yPosition - 10);
    }
    
    // --- Footer ---
    doc.setLineWidth(0.2);
    doc.setDrawColor(156, 163, 175); // gray-400
    doc.line(20, yPosition + 5, 190, yPosition + 5);
    yPosition += 15;

    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text(`ID de Reserva: ${booking.reservaId}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Fecha de Impresión: ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}`, 20, yPosition);
    
    // --- Save ---
    doc.save(`reserva-${booking.reservaId.substring(0, 8)}.pdf`);
};
