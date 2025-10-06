import { isWithinInterval } from 'date-fns';

import type { Employee, Hotel, AttendanceRecord } from '../types';

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

export function getPeriodStats(
  employees: Employee[],
  hotels: Hotel[],
  allRecords: AttendanceRecord[],
  startDate: Date,
  endDate: Date
): DashboardStats {



  // Filter attendance records within the period
  const visitsInPeriodRecords = allRecords.filter(r =>
    isWithinInterval(new Date(r.timestamp), { start: startDate, end: endDate })
  );

  // Get unique hotel IDs and employee IDs from visits within the period
  const hotelIdsWithVisitsInPeriod = new Set(visitsInPeriodRecords.map(r => r.hotelId));
  const employeeIdsWithVisitsInPeriod = new Set(visitsInPeriodRecords.map(r => r.employeeId));

  // Filter employees created within the period
  const employeesCreatedInPeriod = employees.filter(e => {
    const idTimestamp = parseInt(e.id.split('-')[1]);
    return !isNaN(idTimestamp) && isWithinInterval(new Date(idTimestamp), { start: startDate, end: endDate });
  });

  // Active employees in period: those who had visits OR were created in the period
  const activeEmployeesInPeriodList = employees.filter(e =>
    e.isActive && (employeeIdsWithVisitsInPeriod.has(e.id) || employeesCreatedInPeriod.some(emp => emp.id === e.id))
  );

  // Hotels active in period: those with visits in the period
  const hotelsActiveInPeriod = hotels.filter(h => hotelIdsWithVisitsInPeriod.has(h.id));

  // Helper map for hotelId -> city for active hotels in period
  const hotelCityMapForPeriod = new Map(hotelsActiveInPeriod.map(h => [h.id, h.city]));

  // 1. Total Hotels in Period
  const totalHotelsInPeriod = hotelsActiveInPeriod.length;

  // 2. Active Employees in Period
  const activeEmployeesCountInPeriod = activeEmployeesInPeriodList.length;

  // 3. Visits in Period
  const visitsInPeriodCount = visitsInPeriodRecords.length;

  // 4. New Employees in Period
  const newEmployeesInPeriodCount = employeesCreatedInPeriod.length;

  // 5. Payrolls to Review in Period
  const payrollsReviewedInPeriodCount = employees.filter(emp =>
    emp.payrollType === 'Workrecord' &&
    emp.lastReviewedTimestamp &&
    isWithinInterval(new Date(emp.lastReviewedTimestamp), { start: startDate, end: endDate })
  ).length;

  // 6. Hotels by City (filtered for period)
  const hotelsByCityInPeriodMap = hotelsActiveInPeriod.reduce((acc, hotel) => {
    acc[hotel.city] = (acc[hotel.city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const hotelsByCityInPeriod = Object.entries(hotelsByCityInPeriodMap).map(([city, count]) => ({ city, count }));


  // 7. Active Personnel by City (filtered for period)
  const activeEmployeesByCity = activeEmployeesInPeriodList.reduce((acc, employee) => {
    const city = hotelCityMapForPeriod.get(employee.hotelId) || 'Sin Ciudad';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 8. Active Personnel by Role (filtered for period)
  const activeEmployeesByRole = activeEmployeesInPeriodList.reduce((acc, employee) => {
    const role = employee.role || 'Sin Cargo';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 9. Visits by City (filtered for period)
  const visitsByCity = visitsInPeriodRecords.reduce((acc, record) => {
    const city = hotelCityMapForPeriod.get(record.hotelId) || 'Sin Ciudad';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 10. Hotel Ranking by Visits (filtered for period)
  const visitsByHotel = visitsInPeriodRecords.reduce((acc, record) => {
    acc[record.hotelId] = (acc[record.hotelId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const hotelRankingByVisits = hotelsActiveInPeriod.map(hotel => ({
    id: hotel.id,
    name: hotel.name,
    visits: visitsByHotel[hotel.id] || 0,
  })).sort((a, b) => b.visits - a.visits);

  // 11. Visits Over Time (filtered for period)
  const visitsOverTime = visitsInPeriodRecords
    .reduce((acc, record) => {
      const date = new Date(record.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  const visitsOverTimeChartData = Object.entries(visitsOverTime)
    .map(([date, visits]) => ({ date, visits }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    totalHotels: totalHotelsInPeriod,
    activeEmployees: activeEmployeesCountInPeriod,
    visitsInPeriod: visitsInPeriodCount,
    newEmployeesInPeriod: newEmployeesInPeriodCount,
    payrollsReviewedInPeriod: payrollsReviewedInPeriodCount,
    hotelsByCity: hotelsByCityInPeriod,
    activeEmployeesByCity: Object.entries(activeEmployeesByCity).map(([name, value]) => ({ name, value })),
    activeEmployeesByRole: Object.entries(activeEmployeesByRole).map(([name, value]) => ({ name, value })),
    visitsByCity: Object.entries(visitsByCity).map(([name, value]) => ({ name, value })),
    hotelRankingByVisits,
    visitsOverTime: visitsOverTimeChartData,
  };
}
