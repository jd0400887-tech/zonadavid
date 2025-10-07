// import { jsPDF } from 'jspdf';
// import autoTable from 'jspdf-autotable'; // Import as default
import { format } from 'date-fns';

// Updated DashboardStats interface to match getPeriodStats output
interface DashboardStats {
  totalHotels: number;
  activeEmployees: number;
  visitsInPeriod: number;
  newEmployeesInPeriod: number;
  payrollsReviewedInPeriod: number; // Changed from payrollsToReviewInPeriod
  hotelsByCity: { city: string; count: number }[];
  activeEmployeesByCity: { name: string; value: number }[];
  activeEmployeesByRole: { name: string; value: number }[];
  visitsByCity: { name: string; value: number }[];
  hotelRankingByVisits: { id: string; name: string; visits: number }[];
  visitsOverTime: { date: string; visits: number }[];
}

// Helper to calculate percentage change
const getPercentageChange = (current: number, previous: number): string => {
  if (previous === 0) return current > 0 ? '+∞%' : '0%';
  const change = ((current - previous) / previous) * 100;
  return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
};

// export const generateReportPDF = async (
//   stats: DashboardStats,
//   reportType: 'weekly' | 'monthly' | 'semestral', // Added 'semestral'
//   startDate: Date,
//   endDate: Date,
//   prevStats: DashboardStats | null = null // Added previous period stats for comparison
// ) => {
//   const doc = new jsPDF();

//   // Set default font for a more professional look
//   doc.setFont('Helvetica'); // Using a standard professional font

//   // Set up header
//   doc.setFontSize(18);
//   doc.text('Reporte de Indicadores', 14, 22);
//   doc.setFontSize(10);
//   let reportTypeDisplay = '';
//   switch (reportType) {
//     case 'weekly': reportTypeDisplay = 'Semanal'; break;
//     case 'monthly': reportTypeDisplay = 'Mensual'; break;
//     case 'semestral': reportTypeDisplay = 'Semestral'; break;
//   }
//   doc.text(`Tipo de Reporte: ${reportTypeDisplay}`, 14, 30);
//   doc.text(`Período: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`, 14, 36);

//   let yPos = 46;

//   // Define common table styles
//   const tableStyles = {
//     headStyles: { fillColor: [255, 140, 0] as [number, number, number] }, // DarkOrange in RGB
//     styles: { font: 'Times-Roman', fontSize: 9 },
//     margin: { left: 14, right: 14 },
//   };

//   // Summary Statistics
//   doc.setFontSize(14);
//   doc.text('Estadísticas Resumen', 14, yPos);
//   yPos += 8;
//   doc.setFontSize(10);

//   const summaryData = [
//     { label: 'Total Hoteles', current: stats.totalHotels, previous: prevStats?.totalHotels },
//     { label: 'Empleados Activos', current: stats.activeEmployees, previous: prevStats?.activeEmployees },
//     { label: 'Nuevos Empleados en el Período', current: stats.newEmployeesInPeriod, previous: prevStats?.newEmployeesInPeriod },
//     { label: 'Nóminas Revisadas en el Período', current: stats.payrollsReviewedInPeriod, previous: prevStats?.payrollsReviewedInPeriod },
//     { label: 'Visitas en el Período', current: stats.visitsInPeriod, previous: prevStats?.visitsInPeriod },
//   ];

//   summaryData.forEach(item => {
//     let text = `${item.label}: ${item.current}`;
//     if (prevStats && item.previous !== undefined && item.previous !== null) {
//       text += ` (vs. ${item.previous}, ${getPercentageChange(item.current, item.previous)})`;
//     }
//     doc.text(text, 14, yPos);
//     yPos += 6;
//   });
//   yPos += 4; // Small extra space after summary

//   // Helper to add a new page if content overflows
//   const checkPageBreak = () => {
//     if (yPos > 280) { // A bit less than 297 (A4 height) to leave margin
//       doc.addPage();
//       yPos = 20; // Reset y position for new page
//     }
//   };

//   // Hotels by City
//   checkPageBreak();
//   doc.setFontSize(14);
//   doc.text('Hoteles por Ciudad', 14, yPos);
//   yPos += 8;
//   autoTable(doc, {
//     ...tableStyles, // Apply common styles
//     startY: yPos,
//     head: [['Ciudad', 'Cantidad', prevStats ? 'vs. Anterior' : '']],
//     body: stats.hotelsByCity.map(item => {
//       const prevItem = prevStats?.hotelsByCity.find(p => p.city === item.city);
//       const prevCount = prevItem ? prevItem.count : 0;
//       return [item.city, item.count, prevStats ? `${prevCount} (${getPercentageChange(item.count, prevCount)})` : ''];
//     }),
//     didDrawPage: (data: any) => { yPos = data.cursor.y; },
//   });
//   yPos += 10;

//   // Active Employees by City
//   checkPageBreak();
//   doc.setFontSize(14);
//   doc.text('Personal Activo por Ciudad', 14, yPos);
//   yPos += 8;
//   autoTable(doc, {
//     ...tableStyles, // Apply common styles
//     startY: yPos,
//     head: [['Ciudad', 'Cantidad', prevStats ? 'vs. Anterior' : '']],
//     body: stats.activeEmployeesByCity.map(item => {
//       const prevItem = prevStats?.activeEmployeesByCity.find(p => p.name === item.name);
//       const prevValue = prevItem ? prevItem.value : 0;
//       return [item.name, item.value, prevStats ? `${prevValue} (${getPercentageChange(item.value, prevValue)})` : ''];
//     }),
//     didDrawPage: (data: any) => { yPos = data.cursor.y; },
//   });
//   yPos += 10;

//   // Active Employees by Role
//   checkPageBreak();
//   doc.setFontSize(14);
//   doc.text('Personal Activo por Posición', 14, yPos);
//   yPos += 8;
//   autoTable(doc, {
//     ...tableStyles, // Apply common styles
//     startY: yPos,
//     head: [['Posición', 'Cantidad', prevStats ? 'vs. Anterior' : '']],
//     body: stats.activeEmployeesByRole.map(item => {
//       const prevItem = prevStats?.activeEmployeesByRole.find(p => p.name === item.name);
//       const prevValue = prevItem ? prevItem.value : 0;
//       return [item.name, item.value, prevStats ? `${prevValue} (${getPercentageChange(item.value, prevValue)})` : ''];
//     }),
//     didDrawPage: (data: any) => { yPos = data.cursor.y; },
//   });
//   yPos += 10;

//   // Visits by City
//   checkPageBreak();
//   doc.setFontSize(14);
//   doc.text('Visitas por Ciudad', 14, yPos);
//   yPos += 8;
//   autoTable(doc, {
//     ...tableStyles, // Apply common styles
//     startY: yPos,
//     head: [['Ciudad', 'Cantidad', prevStats ? 'vs. Anterior' : '']],
//     body: stats.visitsByCity.map(item => {
//       const prevItem = prevStats?.visitsByCity.find(p => p.name === item.name);
//       const prevValue = prevItem ? prevItem.value : 0;
//       return [item.name, item.value, prevStats ? `${prevValue} (${getPercentageChange(item.value, prevValue)})` : ''];
//     }),
//     didDrawPage: (data: any) => { yPos = data.cursor.y; },
//   });
//   yPos += 10;

//   // Hotel Ranking by Visits
//   checkPageBreak();
//   doc.setFontSize(14);
//   doc.text('Ranking de Hoteles por Visitas', 14, yPos);
//   yPos += 8;
//   autoTable(doc, {
//     ...tableStyles, // Apply common styles
//     startY: yPos,
//     head: [['Hotel', 'Visitas', prevStats ? 'vs. Anterior' : '']],
//     body: stats.hotelRankingByVisits.map(item => {
//       const prevItem = prevStats?.hotelRankingByVisits.find(p => p.id === item.id);
//       const prevVisits = prevItem ? prevItem.visits : 0;
//       return [item.name, item.visits, prevStats ? `${prevVisits} (${getPercentageChange(item.visits, prevVisits)})` : ''];
//     }),
//     didDrawPage: (data: any) => { yPos = data.cursor.y; },
//   });
//   yPos += 10;

//   // Visits Over Time
//   checkPageBreak();
//   doc.setFontSize(14);
//   doc.text('Visitas a lo largo del tiempo (Período Actual)', 14, yPos);
//   yPos += 8;
//   autoTable(doc, {
//     ...tableStyles, // Apply common styles
//     startY: yPos,
//     head: [['Fecha', 'Visitas']],
//     body: stats.visitsOverTime.map(item => [item.date, item.visits]),
//     didDrawPage: (data: any) => { yPos = data.cursor.y; },
//   });
//   yPos += 10;

//   // Footer
//   const pageCount = doc.internal.pages.length;
//   for (let i = 1; i <= pageCount; i++) {
//     doc.setPage(i);
//     doc.setFontSize(8);
//     doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
//   }

//   doc.save(`reporte_${reportType}_${format(startDate, 'yyyyMMdd')}.pdf`);
// };

// Función dummy para reemplazar generateReportPDF temporalmente
export const generateReportPDF = async (
  stats: DashboardStats,
  reportType: 'weekly' | 'monthly' | 'semestral',
  startDate: Date,
  endDate: Date,
  prevStats: DashboardStats | null = null
) => {
  console.log('PDF generation is temporarily disabled.');
  console.log('Stats:', stats);
  console.log('Report Type:', reportType);
  console.log('Start Date:', startDate);
  console.log('End Date:', endDate);
  console.log('Previous Stats:', prevStats);
  // No-op
};