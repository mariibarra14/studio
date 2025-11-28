"use client";

import jsPDF from 'jspdf';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { EnrichedPayment } from "./types";

export const generateReceiptPDF = async (payment: EnrichedPayment) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // --- Header ---
    const primaryColor = '#6246EA'; // Theme primary color
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text('VIVOPASS', margin, 18);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text('Recibo de Pago', pageWidth - margin - 35, 18);

    doc.setTextColor(0, 0, 0);
    let yPosition = 45;

    // --- Payment Info ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text('Transacción Exitosa', margin, yPosition);
    yPosition += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`ID de Pago: ${payment.idPago}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Fecha: ${format(new Date(payment.fechaPago), "dd 'de' MMMM, yyyy, h:mm a", { locale: es })}`, margin, yPosition);
    yPosition += 12;

    // --- Event Details ---
    if (payment.evento) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text('Detalles del Evento', margin, yPosition);
        yPosition += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Evento: ${payment.evento.nombre}`, margin, yPosition);
        yPosition += 6;
        if (payment.evento.lugar) {
            doc.text(`Lugar: ${payment.evento.lugar}`, margin, yPosition);
            yPosition += 6;
        }
        if (payment.evento.inicio) {
            doc.text(`Fecha del Evento: ${format(new Date(payment.evento.inicio), "dd/MM/yyyy h:mm a", { locale: es })}`, margin, yPosition);
            yPosition += 6;
        }
        yPosition += 8;
    }
    
    // --- Payment Details ---
    doc.setLineWidth(0.2);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text('Resumen del Pago', margin, yPosition);
    yPosition += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    if (payment.metodoPago) {
        doc.text(`Método de Pago: ${payment.metodoPago.marca.toUpperCase()} terminada en ${payment.metodoPago.ultimos4}`, margin, yPosition);
        yPosition += 6;
    }
    doc.text(`ID de Reserva: ${payment.idReserva}`, margin, yPosition);
    yPosition += 10;

    // --- Total Amount ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text('Total Pagado:', margin, yPosition);
    doc.text(`$${payment.monto.toFixed(2)}`, pageWidth - margin - 40, yPosition);
    yPosition += 15;


    // --- Footer ---
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text('Gracias por su compra.', margin, yPosition);
    yPosition += 5;
    doc.text('Este es un comprobante de su transacción. Para ver los detalles de su reserva, visite la sección "Mis Reservas".', margin, yPosition);
    
    // --- Save ---
    doc.save(`recibo-vivopass-${payment.idPago.substring(0, 8)}.pdf`);
};
