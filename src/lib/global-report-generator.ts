
"use client";

import jsPDF from "jspdf";
import 'jspdf-autotable';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { OrganizerStat, CustomerStat, ServiceStat, Currency } from "./types";
import { formatCurrency } from "./utils";

type GlobalReportData = {
    organizerStats: OrganizerStat[];
    customerStats: CustomerStat[];
    serviceStats: ServiceStat[];
    currency: Currency;
    language: string;
};

const addHeader = (doc: jsPDF, title: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(108, 48, 233); // Primary Purple
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("VIVOPASS", 14, 17);
    doc.setFontSize(12);
    doc.text("Reporte Global de la Plataforma", pageWidth - 14, 17, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Fecha del Reporte: ${format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}`, 14, 35);
    return 45;
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

const addSectionTitle = (doc: jsPDF, title: string, y: number) => {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(41, 51, 61);
    doc.text(title, 14, y);
    return y + 8;
};

export const generateGlobalReportPDF = (data: GlobalReportData) => {
    const doc = new jsPDF();
    let y = addHeader(doc, "Reporte Global");

    // --- Organizer Ranking ---
    y = addSectionTitle(doc, "Ranking de Organizadores", y);
    (doc as any).autoTable({
        startY: y,
        head: [['#', 'Organizador', 'Eventos', 'Ingresos Totales']],
        body: data.organizerStats.map((org, index) => [
            index + 1,
            `${org.nombre} ${org.apellido}`,
            org.eventCount,
            formatCurrency(org.totalRevenue, data.currency, data.language),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [108, 48, 233] },
        alternateRowStyles: { fillColor: [247, 245, 254] },
    });
    y = (doc as any).autoTable.previous.finalY + 15;

    // --- Customer Loyalty ---
    y = addSectionTitle(doc, "Fidelización de Clientes (Top)", y);
    (doc as any).autoTable({
        startY: y,
        head: [['#', 'Cliente', 'Reservas', 'Gasto Total']],
        body: data.customerStats.slice(0, 20).map((cust, index) => [ // Show top 20
            index + 1,
            `${cust.user.nombre} ${cust.user.apellido}`,
            cust.bookingCount,
            formatCurrency(cust.totalSpent, data.currency, data.language),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [244, 98, 64] },
        alternateRowStyles: { fillColor: [255, 245, 242] },
    });
    y = (doc as any).autoTable.previous.finalY + 15;

    // --- Service Performance ---
    y = addSectionTitle(doc, "Rendimiento de Servicios", y);
    (doc as any).autoTable({
        startY: y,
        head: [['Servicio', 'Tipo', 'Ingresos Totales']],
        body: data.serviceStats.map(service => [
            service.nombre,
            service.tipo,
            formatCurrency(service.totalRevenue, data.currency, data.language),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74] }, // Green
        alternateRowStyles: { fillColor: [240, 253, 244] }, // Light Green
    });

    addFooter(doc);
    doc.save(`Reporte_Global_VivoPass_${format(new Date(), "yyyy-MM-dd")}.pdf`);
};
