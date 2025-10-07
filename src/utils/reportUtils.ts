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