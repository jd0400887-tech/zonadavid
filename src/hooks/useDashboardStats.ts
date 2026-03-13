import { useMemo } from 'react';
import { format, startOfWeek, subMonths } from 'date-fns';

import { useHotels } from './useHotels';
import { useAttendance } from './useAttendance';
import { useStaffingRequestsContext } from '../contexts/StaffingRequestsContext';
import { useApplications } from './useApplications';

export function useDashboardStats(filter?: { hotelIds?: string[], zone?: string }) {
  const { hotels, employees, loading: hotelsLoading } = useHotels();
  const { allRecords: allAttendanceRecords } = useAttendance({ start: null, end: null });
  const { allRequests: staffingRequests } = useStaffingRequestsContext();
  const { applications } = useApplications();

  // Extraer valores del filtro para dependencias estables
  const filterZone = filter?.zone;
  const filterHotelIds = filter?.hotelIds ? JSON.stringify(filter.hotelIds) : undefined;

  const stats = useMemo(() => {
    // 1. DETERMINAR HOTELES FILTRADOS
    let filteredHotels = hotels;
    if (filter?.hotelIds && filter.hotelIds.length > 0) {
      filteredHotels = hotels.filter(h => filter.hotelIds!.includes(h.id));
    } else if (filterZone && filterZone !== 'Todas') {
      filteredHotels = hotels.filter(h => h.zone === filterZone);
    }

    const hasActiveFilter = (filter?.hotelIds && filter.hotelIds.length > 0) || (filterZone && filterZone !== 'Todas');
    const filteredHotelIdsSet = new Set(filteredHotels.map(h => h.id));

    // 2. FILTRAR EMPLEADOS
    const filteredEmployees = hasActiveFilter
      ? employees.filter(e => filteredHotelIdsSet.has(e.hotelId))
      : employees;

    const activeEmployeesList = filteredEmployees.filter(e => e.isActive);

    // 3. FILTRAR SOLICITUDES
    const filteredRequests = hasActiveFilter
      ? staffingRequests.filter(req => filteredHotelIdsSet.has(req.hotel_id))
      : staffingRequests;

    const activeStaffingRequests = filteredRequests.filter(req => !req.is_archived);
    const unfulfilledRequests = activeStaffingRequests.filter(req =>
      ['Pendiente', 'Enviada a Reclutamiento', 'En Proceso'].includes(req.status)
    );

    // 4. FILTRAR APLICACIONES
    const pendingApplications = applications.filter(app => {
      if (app.status !== 'pendiente') return false;
      if (!hasActiveFilter) return true;
      return filteredHotelIdsSet.has(app.hotel_id);
    }).length;

    // 5. ASISTENCIA
    const startOfWeekTime = startOfWeek(new Date(), { weekStartsOn: 0 }).getTime();
    const filteredAttendance = hasActiveFilter
      ? allAttendanceRecords.filter(r => filteredHotelIdsSet.has(r.hotelId))
      : allAttendanceRecords;

    const visitsThisWeek = filteredAttendance.filter(r => new Date(r.timestamp).getTime() >= startOfWeekTime).length;

    return {
      totalHotels: filteredHotels.length,
      activeEmployees: activeEmployeesList.length,
      pendingApplications,
      unfulfilledRequestsCount: unfulfilledRequests.length,
      unfulfilledRequests,
      visitsThisWeek,
      compliance72h: { onTime: 0, critical: 0, overdue: 0 },
      incompleteDocsCount: filteredEmployees.filter(e => !e.documentacion_completa).length,
    };
  }, [employees, hotels, allAttendanceRecords, staffingRequests, applications, filterZone, filterHotelIds]);

  return { stats, loading: hotelsLoading };
}
