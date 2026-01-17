
import jsPDF from "jspdf";
import 'jspdf-autotable';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ReportData } from "./types";

const addHeader = (doc: jsPDF, title: string, eventName: string, organizerName: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header background
    doc.setFillColor(41, 51, 61); // Dark gray
    doc.rect(0, 0, pageWidth, 25, 'F');

    // Logo/App Name
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("VIVOPASS", 14, 17);

    // Report Title
    doc.setFontSize(12);
    doc.setTextColor(200, 200, 200);
    doc.text(title, pageWidth - 14, 17, { align: 'right' });

    // Event Details
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(41, 51, 61);
    doc.text(eventName, 14, 40);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Organizador: ${organizerName}`, 14, 46);
    doc.text(`Fecha del Reporte: ${format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}`, pageWidth - 14, 46, { align: 'right' });
    
    return 55; // Starting Y position for content
};

const addFooter = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(8);
    doc.setTextColor(150);

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, 287, { align: 'center' });
    }
};

const applyZebraStriping = (doc: any, startY: number) => {
    let isOdd = false;
    doc.autoTable.previous.body.forEach((row: any) => {
        if (isOdd) {
            doc.setFillColor(245, 245, 245); // Light gray
            doc.rect(row.x, row.y, row.width, row.height, 'F');
        }
        isOdd = !isOdd;
    });
};

export const generateSalesReportPDF = (data: ReportData) => {
    const doc = new jsPDF();
    let y = addHeader(doc, "Reporte de Ventas y Recaudación", data.event.nombre, data.organizerName);

    // --- Ticket Sales ---
    (doc as any).autoTable({
        startY: y,
        head: [['Zona', 'Entradas Vendidas', 'Ingresos por Zona (USD)']],
        body: data.sales.ticketSales.map(sale => [sale.name, sale.count, `$${sale.revenue.toFixed(2)}`]),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }, // Blue
        didDrawPage: (hookData) => {
            applyZebraStriping(doc, hookData.cursor.y);
        }
    });
    y = (doc as any).autoTable.previous.finalY + 10;
    
    // --- Service Sales ---
    if (data.sales.serviceSales.length > 0) {
        (doc as any).autoTable({
            startY: y,
            head: [['Servicio/Producto', 'Cantidad Vendida', 'Ingresos (USD)']],
            body: data.sales.serviceSales.map(sale => [sale.name, sale.count, `$${sale.revenue.toFixed(2)}`]),
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] }, // Green
            didDrawPage: (hookData) => {
                applyZebraStriping(doc, hookData.cursor.y);
            }
        });
        y = (doc as any).autoTable.previous.finalY + 10;
    } else {
        doc.setFontSize(10);
        doc.text("No se registraron ventas de servicios complementarios.", 14, y);
        y += 10;
    }
    
    // --- Summary Section ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen Financiero y de Satisfacción', 14, y);
    y += 8;

    const summaryBody = [
        ['Ingresos Totales por Entradas', `$${data.sales.totalTicketRevenue.toFixed(2)}`],
        ['Ingresos Totales por Servicios', `$${data.sales.totalServiceRevenue.toFixed(2)}`],
        ['Calificación Promedio (sobre 5)', `${data.satisfaction.averageRating.toFixed(2)} (${data.satisfaction.totalSurveys} valoraciones)`],
        [{ content: 'Recaudación Total General', styles: { fontStyle: 'bold', fontSize: 12 } }, { content: `$${data.sales.grandTotal.toFixed(2)}`, styles: { fontStyle: 'bold', fontSize: 12 } }]
    ];
    
    (doc as any).autoTable({
        startY: y,
        body: summaryBody,
        theme: 'striped',
        styles: { cellPadding: 3 },
    });

    addFooter(doc);
    doc.save(`Reporte_Ventas_${data.event.nombre.replace(/ /g, "_")}.pdf`);
};

export const generateConversionReportPDF = (data: ReportData) => {
    const doc = new jsPDF();
    let y = addHeader(doc, "Reporte de Análisis de Conversión", data.event.nombre, data.organizerName);

    // --- Conversion Analysis ---
    (doc as any).autoTable({
        startY: y,
        head: [['Métrica', 'Cantidad', 'Porcentaje']],
        body: [
            ['Total de Interacciones (Reservas Creadas)', data.conversion.totalReservations, '100.0%'],
            ['Reservas Confirmadas (Pagadas)', data.conversion.confirmed, `${data.conversion.confirmationRate.toFixed(1)}%`],
            ['Reservas Expiradas o Canceladas', data.conversion.cancelled, `${(100 - data.conversion.confirmationRate).toFixed(1)}%`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [192, 57, 43] }, // Red
        didDrawPage: (hookData) => {
            applyZebraStriping(doc, hookData.cursor.y);
        }
    });
    
    addFooter(doc);
    doc.save(`Reporte_Conversion_${data.event.nombre.replace(/ /g, "_")}.pdf`);
};

    