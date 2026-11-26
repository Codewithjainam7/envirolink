import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Report, DashboardStats, WASTE_CATEGORIES, STATUS_CONFIG, SEVERITY_CONFIG } from '@/types';

const PAGE_MARGIN_X = 14;
const HEADER_HEIGHT = 28;

function drawPdfChrome(
    doc: jsPDF,
    title: string,
    subtitle: string,
    summaryCards: { label: string; value: string; accent?: [number, number, number] }[]
): number {
    const pageWidth = doc.internal.pageSize.getWidth(); // 297mm on A4 landscape
    const contentWidth = pageWidth - PAGE_MARGIN_X * 2; // 269mm

    // Full-bleed Emerald Header Banner
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F');

    // Left brand + title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('ENVIROLINK', PAGE_MARGIN_X, 12.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(209, 250, 229);
    doc.text(`${title}  ·  ${subtitle}`, PAGE_MARGIN_X, 20.5);

    // Right-aligned compact timestamp (never collides with left copy)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy · h:mm a')}`, pageWidth - PAGE_MARGIN_X, 13, {
        align: 'right',
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(209, 250, 229);
    doc.text('Mumbai Municipal Corporation', pageWidth - PAGE_MARGIN_X, 20.5, { align: 'right' });

    // Balanced 4-card KPI strip matching exact contentWidth (269mm)
    const gap = 4;
    const cardW = (contentWidth - gap * (summaryCards.length - 1)) / summaryCards.length;
    const cardY = HEADER_HEIGHT + 6;
    const cardH = 18;

    summaryCards.forEach((card, idx) => {
        const x = PAGE_MARGIN_X + idx * (cardW + gap);
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(167, 243, 208);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, cardY, cardW, cardH, 2.5, 2.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(75, 85, 99);
        doc.text(card.label.toUpperCase(), x + 4, cardY + 6.5);

        const color = card.accent || [5, 150, 105];
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(card.value, x + 4, cardY + 14.5);
    });

    return cardY + cardH + 6; // Clean breathing room before table
}

function drawPdfFooters(doc: jsPDF, footerTitle: string) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageCount = (doc as any).internal.getNumberOfPages();
    const dateStamp = format(new Date(), 'yyyy-MM-dd');

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.25);
        doc.line(PAGE_MARGIN_X, pageHeight - 14, pageWidth - PAGE_MARGIN_X, pageHeight - 14);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(`${footerTitle}  |  ${dateStamp}`, PAGE_MARGIN_X, pageHeight - 8);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - PAGE_MARGIN_X, pageHeight - 8, { align: 'right' });
    }
}

export function exportReportsManagementPDF(reports: Report[]) {
    const doc = new jsPDF('l', 'mm', 'a4');
    const newCount = reports.filter((r) => r.status === 'submitted').length;
    const activeCount = reports.filter((r) => ['under_review', 'assigned', 'in_progress'].includes(r.status)).length;
    const resolvedCount = reports.filter((r) => ['resolved', 'closed'].includes(r.status)).length;
    const breachCount = reports.filter((r) => r.isSlaBreach).length;

    const startY = drawPdfChrome(doc, 'Reports Management Register', 'Filtered Citizen Waste Issues', [
        { label: 'Total Reports', value: String(reports.length) },
        { label: 'Open / In Progress', value: `${newCount} new · ${activeCount} active`, accent: [217, 119, 6] },
        { label: 'Resolved Reports', value: String(resolvedCount), accent: [5, 150, 105] },
        { label: 'SLA Breaches', value: String(breachCount), accent: breachCount > 0 ? [220, 38, 38] : [5, 150, 105] },
    ]);

    const tableData = reports.map((report) => {
        const category = WASTE_CATEGORIES[report.category] || { label: String(report.category || 'Other').replace(/_/g, ' ') };
        const status = STATUS_CONFIG[report.status] || { label: String(report.status || 'Submitted') };
        const severity = SEVERITY_CONFIG[report.severity] || { label: String(report.severity || 'Medium') };
        const hoursLeft = Math.max(0, Math.round((new Date(report.slaDueAt).getTime() - Date.now()) / (1000 * 60 * 60)));

        return [
            report.reportId || 'N/A',
            `${report.location.locality || report.location.address || 'Unknown'}, ${report.location.city || 'Mumbai'}`,
            category.label,
            severity.label.toUpperCase(),
            status.label,
            report.assignedTo?.workerName || 'Unassigned',
            report.isSlaBreach ? 'BREACHED' : `${hoursLeft}h left`,
            format(new Date(report.createdAt), 'MMM d, yyyy · h:mm a'),
        ];
    });

    // Columns sum cleanly to exact contentWidth (269mm on A4 landscape with 14mm L/R margin)
    autoTable(doc, {
        head: [['Report ID', 'Location', 'Category', 'Severity', 'Status', 'Assigned Crew', 'SLA', 'Reported']],
        body: tableData,
        startY,
        margin: { top: 20, right: PAGE_MARGIN_X, bottom: 20, left: PAGE_MARGIN_X },
        theme: 'grid',
        showHead: 'everyPage',
        styles: {
            fontSize: 8.2,
            cellPadding: { top: 4, right: 3.5, bottom: 4, left: 3.5 },
            lineColor: [229, 231, 235],
            lineWidth: 0.2,
            valign: 'middle',
            textColor: [31, 41, 55],
            overflow: 'linebreak',
        },
        headStyles: {
            fillColor: [5, 150, 105],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8.5,
            cellPadding: { top: 4.5, right: 3.5, bottom: 4.5, left: 3.5 },
            halign: 'left',
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252],
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 24 },
            1: { cellWidth: 54 },
            2: { cellWidth: 32 },
            3: { halign: 'center', cellWidth: 22 },
            4: { halign: 'center', cellWidth: 26 },
            5: { cellWidth: 52 },
            6: { halign: 'center', cellWidth: 24 },
            7: { cellWidth: 35 },
        },
        didParseCell: (data) => {
            if (data.section === 'head' && [3, 4, 6].includes(data.column.index)) {
                data.cell.styles.halign = 'center';
            }
            if (data.column.index === 3 && data.section === 'body') {
                const val = data.cell.raw?.toString().toLowerCase();
                if (val === 'critical') {
                    data.cell.styles.textColor = [220, 38, 38];
                    data.cell.styles.fontStyle = 'bold';
                } else if (val === 'high') {
                    data.cell.styles.textColor = [234, 88, 12];
                    data.cell.styles.fontStyle = 'bold';
                } else if (val === 'medium') {
                    data.cell.styles.textColor = [180, 83, 9];
                } else {
                    data.cell.styles.textColor = [5, 150, 105];
                }
            }
            if (data.column.index === 6 && data.section === 'body') {
                if (data.cell.raw?.toString().includes('BREACH')) {
                    data.cell.styles.textColor = [220, 38, 38];
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [254, 226, 226];
                }
            }
        },
    });

    drawPdfFooters(doc, 'EnviroLink Operations — Reports Management');
    doc.save(`EnviroLink-Reports-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
}

export function exportExecutiveDashboardPDF(reports: Report[], stats: DashboardStats, workerCount: number) {
    const doc = new jsPDF('l', 'mm', 'a4');
    const startY = drawPdfChrome(doc, 'Executive Operations Summary', 'Real-Time City Cleanliness Snapshot', [
        { label: 'Total Filed', value: String(stats.totalReports) },
        { label: 'Pending / Active', value: `${stats.newReports} new · ${stats.inProgress} active`, accent: [217, 119, 6] },
        { label: 'Resolved & Rate', value: `${stats.resolved} (${stats.resolutionRate}%)`, accent: [5, 150, 105] },
        { label: 'Crew & SLA Breaches', value: `${workerCount} crew · ${stats.slaBreach} SLA`, accent: stats.slaBreach > 0 ? [220, 38, 38] : [5, 150, 105] },
    ]);

    const tableData = reports.slice(0, 30).map((report) => {
        const category = WASTE_CATEGORIES[report.category] || { label: String(report.category || 'Other').replace(/_/g, ' ') };
        const status = STATUS_CONFIG[report.status] || { label: String(report.status || 'Submitted') };
        const severity = SEVERITY_CONFIG[report.severity] || { label: String(report.severity || 'Medium') };

        return [
            report.reportId || 'N/A',
            `${report.location.locality || report.location.address || 'Unknown'}, ${report.location.city || 'Mumbai'}`,
            category.label,
            severity.label.toUpperCase(),
            status.label,
            report.assignedTo?.workerName || 'Unassigned',
            format(new Date(report.createdAt), 'MMM d, yyyy · h:mm a'),
        ];
    });

    // Columns sum cleanly to 269mm matching 14mm L/R margins
    autoTable(doc, {
        head: [['Report ID', 'Location', 'Category', 'Severity', 'Status', 'Assigned Crew', 'Reported']],
        body: tableData,
        startY,
        margin: { top: 20, right: PAGE_MARGIN_X, bottom: 20, left: PAGE_MARGIN_X },
        theme: 'grid',
        showHead: 'everyPage',
        styles: {
            fontSize: 8.5,
            cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
            lineColor: [229, 231, 235],
            lineWidth: 0.2,
            valign: 'middle',
            textColor: [31, 41, 55],
            overflow: 'linebreak',
        },
        headStyles: {
            fillColor: [5, 150, 105],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8.8,
            cellPadding: { top: 4.5, right: 4, bottom: 4.5, left: 4 },
            halign: 'left',
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252],
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 26 },
            1: { cellWidth: 60 },
            2: { cellWidth: 34 },
            3: { halign: 'center', cellWidth: 23 },
            4: { halign: 'center', cellWidth: 28 },
            5: { cellWidth: 58 },
            6: { cellWidth: 40 },
        },
        didParseCell: (data) => {
            if (data.section === 'head' && [3, 4].includes(data.column.index)) {
                data.cell.styles.halign = 'center';
            }
            if (data.column.index === 3 && data.section === 'body') {
                const val = data.cell.raw?.toString().toLowerCase();
                if (val === 'critical') {
                    data.cell.styles.textColor = [220, 38, 38];
                    data.cell.styles.fontStyle = 'bold';
                } else if (val === 'high') {
                    data.cell.styles.textColor = [234, 88, 12];
                    data.cell.styles.fontStyle = 'bold';
                } else if (val === 'medium') {
                    data.cell.styles.textColor = [180, 83, 9];
                } else {
                    data.cell.styles.textColor = [5, 150, 105];
                }
            }
        },
    });

    drawPdfFooters(doc, 'EnviroLink Operations — Dashboard Summary');
    doc.save(`EnviroLink-Dashboard-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
}
