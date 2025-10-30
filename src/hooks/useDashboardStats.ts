import { useMemo } from 'react';
import { format } from 'date-fns';
import { startOfWeek, startOfMonth, subMonths } from 'date-fns';

import { useHotels } from './useHotels';
import { useEmployees } from './useEmployees';
import { useAttendance } from './useAttendance';
import { useStaffingRequests } from './useStaffingRequests';

export function useDashboardStats() {
  const { employees } = useEmployees();
  const { hotels } = useHotels();
  const { allRecords: allAttendanceRecords } = useAttendance({ start: null, end: null });
  const { requests: staffingRequests } = useStaffingRequests();

  return useMemo(() => {
    const today = new Date();
    const startOfWeekTime = startOfWeek(today, { weekStartsOn: 1 }).getTime();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const activeEmployeesList = employees.filter(e => e.isActive);

    const hotelCityMap = new Map(hotels.map(h => [h.id, h.city]));

    const activeEmployeesByRole = activeEmployeesList.reduce((acc, employee) => {
      const role = employee.role || 'Sin Cargo';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const visitsByCity = allAttendanceRecords.reduce((acc, record) => {
      const city = hotelCityMap.get(record.hotelId) || 'Sin Ciudad';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const visitsByHotel = allAttendanceRecords.reduce((acc, record) => {
      acc[record.hotelId] = (acc[record.hotelId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const hotelRankingByVisits = hotels.map(hotel => ({
      id: hotel.id,
      name: hotel.name,
      visits: visitsByHotel[hotel.id] || 0,
    })).sort((a, b) => b.visits - a.visits);

    const visitsOverTime = allAttendanceRecords
      .filter(r => new Date(r.timestamp).getTime() >= thirtyDaysAgo.getTime())
      .reduce((acc, record) => {
        const date = format(new Date(record.timestamp), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const oneMonthAgo = subMonths(today, 1);
    const newEmployeesLastMonth = employees.filter(e => {
      const idTimestamp = parseInt(e.id.split('-')[1]);
      return !isNaN(idTimestamp) && idTimestamp >= oneMonthAgo.getTime();
    }).length;

    const blacklistedEmployees = employees.filter(e => e.isBlacklisted).length;

    const employeesByHotel = activeEmployeesList.reduce((acc, employee) => {
      const hotelName = hotels.find(h => h.id === employee.hotelId)?.name || 'Sin Hotel';
      acc[hotelName] = (acc[hotelName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // NEW: Calculate unfulfilled requests
    const unfulfilledRequests = staffingRequests.filter(req =>
      ['Pendiente', 'Enviada a Reclutamiento', 'En Proceso'].includes(req.status) &&
      new Date(req.start_date) <= today // Start date is today or in the past
    );
    const unfulfilledRequestsCount = unfulfilledRequests.length;

    return {
      totalHotels: hotels.length,
      activeEmployees: activeEmployeesList.length,
      visitsThisWeek: allAttendanceRecords.filter(r => new Date(r.timestamp).getTime() >= startOfWeek(today, { weekStartsOn: 0 }).getTime()).length,
      visitsThisMonth: allAttendanceRecords.filter(r => new Date(r.timestamp).getTime() >= startOfMonth(today).getTime()).length,
      activeEmployeesByRole: Object.entries(activeEmployeesByRole).map(([name, value]) => ({ name, value })),
      visitsByCity: Object.entries(visitsByCity).map(([name, value]) => ({ name, value })),
      hotelRankingByVisits,
      visitsOverTime: Object.entries(visitsOverTime).map(([date, visits]) => ({ date, visits })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      newEmployeesLastMonth,
      payrollsToReview: employees.filter(emp => emp.payrollType === 'Workrecord' && (!emp.lastReviewedTimestamp || new Date(emp.lastReviewedTimestamp).getTime() < startOfWeekTime)).length,
      payrollsReviewedInPeriod: employees.filter(emp => emp.payrollType === 'Workrecord' && emp.lastReviewedTimestamp && new Date(emp.lastReviewedTimestamp).getTime() >= startOfWeekTime).length,
      blacklistedEmployees,
      employeesByHotel: Object.entries(employeesByHotel).map(([name, value]) => ({ name, value })),

      unfulfilledRequestsCount, // NEW stat
      unfulfilledRequests, // NEW stat
    };
  }, [employees, hotels, allAttendanceRecords, staffingRequests]);
}
