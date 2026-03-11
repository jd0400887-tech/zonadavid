import { useMemo } from 'react';
import { format } from 'date-fns';
import { startOfWeek, startOfMonth, subMonths } from 'date-fns';

import { useHotels } from './useHotels';
import { useAttendance } from './useAttendance';
import { useStaffingRequestsContext } from '../contexts/StaffingRequestsContext';
import { useApplications } from './useApplications';

export function useDashboardStats(hotelIds?: string[]) {
  const { hotels, employees } = useHotels();
  const { allRecords: allAttendanceRecords } = useAttendance({ start: null, end: null });
  const { allRequests: staffingRequests } = useStaffingRequestsContext();
  const { applications } = useApplications();

  return useMemo(() => {
    // 1. FILTRAR DATOS BASE SI SE PROPORCIONAN HOTEL_IDS
    const filteredHotels = hotelIds && hotelIds.length > 0 
      ? hotels.filter(h => hotelIds.includes(h.id))
      : hotels;
    
    const filteredHotelIdsSet = new Set(filteredHotels.map(h => h.id));

    const filteredEmployees = hotelIds && hotelIds.length > 0
      ? employees.filter(e => filteredHotelIdsSet.has(e.hotelId))
      : employees;

    const filteredAttendance = hotelIds && hotelIds.length > 0
      ? allAttendanceRecords.filter(r => filteredHotelIdsSet.has(r.hotelId))
      : allAttendanceRecords;

    const filteredRequests = hotelIds && hotelIds.length > 0
      ? staffingRequests.filter(req => filteredHotelIdsSet.has(req.hotel_id))
      : staffingRequests;

    const today = new Date();
    const startOfWeekTime = startOfWeek(today, { weekStartsOn: 0 }).getTime();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const activeEmployeesList = filteredEmployees.filter(e => e.isActive);

    const hotelCityMap = new Map(filteredHotels.map(h => [h.id, h.city]));

    const activeEmployeesByRole = activeEmployeesList.reduce((acc, employee) => {
      const role = employee.role || 'Sin Cargo';
      if (role.toLowerCase() === 'admin') { // Exclude admin role
        return acc;
      }
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const visitsByCity = filteredAttendance.reduce((acc, record) => {
      const city = hotelCityMap.get(record.hotelId) || 'Sin Ciudad';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const visitsByHotel = filteredAttendance.reduce((acc, record) => {
      acc[record.hotelId] = (acc[record.hotelId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const hotelRankingByVisits = filteredHotels.map(hotel => ({
      id: hotel.id,
      name: hotel.name,
      visits: visitsByHotel[hotel.id] || 0,
    })).sort((a, b) => b.visits - a.visits);

    const visitsOverTime = filteredAttendance
      .filter(r => new Date(r.timestamp).getTime() >= thirtyDaysAgo.getTime())
      .reduce((acc, record) => {
        const date = format(new Date(record.timestamp), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const oneMonthAgo = subMonths(today, 1);
    const newEmployeesLastMonth = filteredEmployees.filter(e => {
      const idTimestamp = parseInt(e.id.split('-')[1]);
      return !isNaN(idTimestamp) && idTimestamp >= oneMonthAgo.getTime();
    }).length;

    const blacklistedEmployees = filteredEmployees.filter(e => e.isBlacklisted).length;

    const employeesByHotel = activeEmployeesList.reduce((acc, employee) => {
      const hotelName = filteredHotels.find(h => h.id === employee.hotelId)?.name || 'Sin Hotel';
      acc[hotelName] = (acc[hotelName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedEmployeesByHotel = Object.entries(employeesByHotel)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // --- RECRUITMENT SPECIFIC STATS ---
    const activeStaffingRequests = filteredRequests.filter(req => !req.is_archived);
    
    // NEW: Calculate unfulfilled requests (needed by MainLayout and others)
    const unfulfilledRequests = activeStaffingRequests.filter(req =>
      ['Pendiente', 'Enviada a Reclutamiento', 'En Proceso'].includes(req.status)
    );
    const unfulfilledRequestsCount = unfulfilledRequests.length;

    // 1. Cumplimiento de 72h
    const now = new Date();
    const compliance72h = activeStaffingRequests.reduce((acc, req) => {
      const created = new Date(req.created_at);
      const hours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      if (hours > 72) acc.overdue++;
      else if (hours > 48) acc.critical++;
      else acc.onTime++;
      return acc;
    }, { onTime: 0, critical: 0, overdue: 0 });

    // 2. Urgencia por Fecha de Inicio (Hoy/Mañana y no cubiertas)
    const todayNoTime = new Date(today);
    todayNoTime.setHours(0,0,0,0);
    const tomorrow = new Date(todayNoTime);
    tomorrow.setDate(todayNoTime.getDate() + 1);

    const urgentStarts = activeStaffingRequests.filter(req => {
      const start = new Date(req.start_date);
      start.setHours(0,0,0,0);
      const isSoon = start <= tomorrow;
      const isNotFull = req.candidate_count < req.num_of_people;
      return isSoon && isNotFull && req.status !== 'Completada';
    }).length;

    // 3. Eficiencia de Candidatos (Cobertura de Vacantes)
    const validRequestsForCoverage = activeStaffingRequests.filter(r => 
      r.status !== 'Cancelada por Hotel'
    );
    
    const totalRequired = validRequestsForCoverage.reduce((sum, r) => sum + (r.num_of_people || 0), 0);
    const totalAssigned = validRequestsForCoverage.reduce((sum, r) => sum + (r.candidate_count || 0), 0);

    const coverageRate = totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 0;

    // 4. Distribución por Zonas
    const requestsByZone = activeStaffingRequests.reduce((acc, req) => {
      const hotel = hotels.find(h => h.id === req.hotel_id);
      const zone = hotel?.zone || 'Sin Zona';
      acc[zone] = (acc[zone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const incompleteDocsCount = filteredEmployees.filter(e => !e.documentacion_completa).length;

    const pendingApplications = applications.filter(app => app.status === 'pendiente').length;

    return {
      totalHotels: filteredHotels.filter(h => h.activeEmployees && h.activeEmployees > 0).length,
      activeEmployees: activeEmployeesList.length,
      visitsThisWeek: filteredAttendance.filter(r => new Date(r.timestamp).getTime() >= startOfWeek(today, { weekStartsOn: 0 }).getTime()).length,
      
      // Recruitment Metrics
      activeRequestsCount: activeStaffingRequests.length,
      pendingRequests: activeStaffingRequests.filter(r => r.status === 'Pendiente' || r.status === 'Enviada a Reclutamiento').length,
      urgentStarts,
      compliance72h,
      requestsByZone: Object.entries(requestsByZone).map(([name, value]) => ({ name, value })),
      coverageRate: totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 0,
      pendingApplications,

      activeEmployeesByRole: Object.entries(activeEmployeesByRole).map(([name, value]) => ({ name, value })),
      visitsByCity: Object.entries(visitsByCity).map(([name, value]) => ({ name, value })),
      hotelRankingByVisits,
      visitsOverTime: Object.entries(visitsOverTime).map(([date, visits]) => ({ date, visits })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      newEmployeesLastMonth,
      payrollsToReview: filteredEmployees.filter(emp => emp.payrollType === 'Workrecord' && emp.isActive && (!emp.lastReviewedTimestamp || new Date(emp.lastReviewedTimestamp).getTime() < startOfWeekTime)).length,
      payrollsReviewedInPeriod: filteredEmployees.filter(emp => emp.payrollType === 'Workrecord' && emp.lastReviewedTimestamp && new Date(emp.lastReviewedTimestamp).getTime() >= startOfWeekTime).length,
      blacklistedEmployees,
      employeesByHotel: sortedEmployeesByHotel,

      unfulfilledRequestsCount,
      unfulfilledRequests,
      incompleteDocsCount,
    };
  }, [employees, hotels, allAttendanceRecords, staffingRequests, applications, hotelIds]);
}
