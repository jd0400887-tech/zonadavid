import { format } from 'date-fns';

// Updated DashboardStats interface to match getPeriodStats output
export interface DashboardStats {
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