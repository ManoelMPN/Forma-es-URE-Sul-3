import * as xlsx from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TeacherRecord } from '../types';

/**
 * Exports current teacher list to a native Microsoft Excel (.xlsx) file
 * formatted with the exact single-sheet structure requested by the user:
 * - Escola
 * - Docente
 * - Área
 * - Componente
 * - Formações Previstas
 * - Formações Concluídas (1 when completed, empty/blank when pending)
 * and triggers immediate download to the user's PC.
 */
export function exportToExcel(
  teachers: TeacherRecord[],
  filename: string = 'Relacao_Docentes_URE_Sul_3.xlsx',
  lastUpdated?: string
): void {
  // Flatten records into component rows matching the requested single-sheet schema
  const rows: Record<string, any>[] = [];

  teachers.forEach((t) => {
    t.components.forEach((c) => {
      rows.push({
        'Escola': t.escola,
        'Docente': t.nome,
        'Área': c.area || '',
        'Componente': c.componentName,
        'Formações Previstas': c.previstas || 1,
        'Formações Concluídas': c.concluido ? 1 : '',
      });
    });
  });

  const worksheet = xlsx.utils.json_to_sheet(rows);

  // Set column widths for clean viewing in Excel
  worksheet['!cols'] = [
    { wch: 45 }, // Escola
    { wch: 38 }, // Docente
    { wch: 25 }, // Área
    { wch: 28 }, // Componente
    { wch: 20 }, // Formações Previstas
    { wch: 22 }, // Formações Concluídas
  ];

  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Formações');

  // Add metadata sheet with extraction timestamp
  const metaRows = [
    { 'Propriedade': 'Sistema', 'Valor': 'FORMAÇÕES - URE SUL 3 (2º Semestre)' },
    { 'Propriedade': 'Última Atualização da Base', 'Valor': lastUpdated || '--/--/----' },
    { 'Propriedade': 'Data de Exportação', 'Valor': new Date().toLocaleString('pt-BR') },
    { 'Propriedade': 'Total de Docentes Filtrados', 'Valor': teachers.length },
  ];
  const metaSheet = xlsx.utils.json_to_sheet(metaRows);
  metaSheet['!cols'] = [{ wch: 30 }, { wch: 45 }];
  xlsx.utils.book_append_sheet(workbook, metaSheet, 'Informações da Base');

  // Directly downloads the .xlsx file to the user's computer
  xlsx.writeFile(workbook, filename);
}

/**
 * Exports current teacher list to a CSV file with UTF-8 BOM encoding
 * matching the exact single-sheet schema: Escola;Docente;Área;Componente;Formações Previstas;Formações Concluídas
 * Triggers direct download to PC.
 */
export function exportToCSV(
  teachers: TeacherRecord[],
  filename: string = 'Relacao_Docentes_URE_Sul_3.csv',
  lastUpdated?: string
): void {
  const headers = ['Escola', 'Docente', 'Área', 'Componente', 'Formações Previstas', 'Formações Concluídas'];

  const rows: string[] = [];
  teachers.forEach((t) => {
    t.components.forEach((c) => {
      const concluidasStr = c.concluido ? '1' : '';
      rows.push(
        [
          `"${(t.escola || '').replace(/"/g, '""')}"`,
          `"${(t.nome || '').replace(/"/g, '""')}"`,
          `"${(c.area || '').replace(/"/g, '""')}"`,
          `"${(c.componentName || '').replace(/"/g, '""')}"`,
          `${c.previstas || 1}`,
          `"${concluidasStr}"`
        ].join(';')
      );
    });
  });

  const headerNotice = lastUpdated && lastUpdated !== '--/--/----'
    ? `# Base de Dados Atualizada em: ${lastUpdated}\r\n`
    : '';

  const csvContent = '\uFEFF' + headerNotice + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a formatted PDF document directly to the PC.
 */
export function exportToPDF(
  teachers: TeacherRecord[],
  filterInfo?: string,
  filename: string = 'Relatorio_Docentes_URE_Sul_3.pdf',
  lastUpdated?: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Top header banner (Navy URE Sul 3)
  doc.setFillColor(19, 35, 71); // #132347
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('FORMAÇÕES - URE SUL 3', 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('2º SEMESTRE - ANOS FINAIS / ENSINO MÉDIO | RELAÇÃO DE DOCENTES', 14, 17);

  const issueDate = new Date().toLocaleDateString('pt-BR');
  const issueTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const updatedText = lastUpdated && lastUpdated !== '--/--/----' ? ` | Base atualizada em: ${lastUpdated}` : '';
  doc.setFontSize(7.5);
  doc.setTextColor(200, 215, 240);
  doc.text(`Emitido em ${issueDate} às ${issueTime}${updatedText} | Total: ${teachers.length} docentes`, 14, 22);

  // Subtitle / Filters info bar if active
  let startY = 30;
  if (filterInfo) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 28, 182, 7, 1.5, 1.5, 'F');
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`Filtros aplicados: ${filterInfo}`, 17, 32.5);
    startY = 38;
  }

  // Table Body Rows
  const tableData = teachers.map((t) => {
    const compText = t.components
      .map((c) => `${c.componentName}: ${c.concluido ? '[OK] Concluído' : '[--] Pendente'}`)
      .join('\n');

    return [
      t.escola,
      t.nome,
      compText,
    ];
  });

  autoTable(doc, {
    startY: startY,
    head: [['ESCOLA', 'PROFESSOR', 'COMPONENTES E SITUAÇÃO']],
    body: tableData,
    margin: { left: 14, right: 14, top: 30, bottom: 18 },
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [19, 35, 71],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold', textColor: [18, 40, 90] },
      1: { cellWidth: 55, fontStyle: 'bold', textColor: [15, 23, 42] },
      2: { cellWidth: 57 },
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Página ${data.pageNumber} de ${pageCount} — URE Sul 3 - Sistema de Gestão de Formações`,
        14,
        290
      );
    },
  });

  doc.save(filename);
}

/**
 * Backward compatibility alias: exports PDF directly.
 */
export function exportToReportFile(
  teachers: TeacherRecord[],
  filterInfo?: string,
  filename: string = 'Relatorio_Docentes_URE_Sul_3.pdf'
): void {
  const pdfFilename = filename.endsWith('.pdf') ? filename : filename.replace(/\.[^/.]+$/, '') + '.pdf';
  exportToPDF(teachers, filterInfo, pdfFilename);
}

