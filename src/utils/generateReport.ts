import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// We will expand this with more detailed types later
export interface ReportData {
  [key: string]: any;
}

export const generatePdfReport = (data: ReportData, title: string, period: string) => {
  const doc = new jsPDF();

  // Document Title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.text(`Período: ${period}`, 14, 30);
  doc.setFontSize(12);

  // --- Summary Section ---
  doc.text('Resumen General', 14, 45);
  autoTable(doc, {
    startY: 50,
    head: [['Indicador', 'Valor']],
    body: [
      ['Hoteles Totales', data.totalHotels],
      ['Empleados Activos', data.activeEmployees],
      ['Visitas esta Semana', data.visitsThisWeek],
      ['Visitas este Mes', data.visitsThisMonth],
      ['Nuevos Empleados (Últ. Mes)', data.newEmployeesLastMonth],
      ['En Lista Negra', data.blacklistedEmployees],
    ],
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] }, // Blue header
  });

  let finalY = (doc as any).lastAutoTable.finalY || 80;

  // --- Hotel Ranking Table ---
  doc.text('Ranking de Hoteles por Visitas', 14, finalY + 10);
  autoTable(doc, {
    startY: finalY + 15,
    head: [['#', 'Hotel', 'Visitas']],
    body: data.hotelRankingByVisits.map((hotel: any, index: number) => [
      index + 1,
      hotel.name,
      hotel.visits,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
  });

  finalY = (doc as any).lastAutoTable.finalY;

  // --- Active Personnel by Role ---
  doc.text('Distribución de Personal por Cargo', 14, finalY + 10);
  autoTable(doc, {
    startY: finalY + 15,
    head: [['Cargo', 'Cantidad']],
    body: data.activeEmployeesByRole.map((role: any) => [role.name, role.value]),
    theme: 'striped',
    headStyles: { fillColor: [22, 160, 133] }, // Green header
  });

  // --- Visits by City ---
  // This table goes side-by-side if there's space
  doc.text('Visitas por Ciudad', 110, finalY + 10);
  autoTable(doc, {
    startY: finalY + 15,
    head: [['Ciudad', 'Visitas']],
    body: data.visitsByCity.map((city: any) => [city.name, city.value]),
    theme: 'striped',
    headStyles: { fillColor: [22, 160, 133] },
    margin: { left: 108 },
  });


  // Save the PDF
  const fileName = `${title.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
