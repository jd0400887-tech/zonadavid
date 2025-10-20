import { useMemo } from 'react';
import { useEmployees } from './useEmployees';
import { useHotels } from './useHotels';
import { useAttendance } from './useAttendance';
import { useStaffingRequests } from './useStaffingRequests';
import { differenceInDays, subDays, startOfWeek } from 'date-fns';

// A function to calculate stats for a given period
const calculatePeriodStats = (
  allRecords: any[], 
  allEmployees: any[], 
  allHotels: any[], 
  allRequests: any[],
  start: Date, 
  end: Date
) => {
  const startTime = start.getTime();
  const endTime = end.getTime();

  // Filter records for the given period
  const periodRecords = allRecords.filter(r => {
    const recordTime = new Date(r.timestamp).getTime();
    return recordTime >= startTime && recordTime <= endTime;
  });

  const payrollsReviewed = allEmployees.filter(e => 
    e.payrollType === 'Workrecord' && 
    e.lastReviewedTimestamp && 
    new Date(e.lastReviewedTimestamp).getTime() >= startTime && 
    new Date(e.lastReviewedTimestamp).getTime() <= endTime
  ).length;

  const attendanceByEmployee = periodRecords.reduce((acc, record) => {
    const employee = allEmployees.find(e => e.id === record.employeeId);
    if (employee) {
      acc[employee.name] = (acc[employee.name] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const newEmployeesList = allEmployees.filter(e => {
    const idTimestamp = parseInt(e.id.split('-')[1]);
    return !isNaN(idTimestamp) && idTimestamp >= startTime && idTimestamp <= endTime;
  });

  const totalOvertime = allEmployees.reduce((acc, emp) => acc + (parseFloat(emp.overtime) || 0), 0);

  const hotelCityMap = new Map(allHotels.map(h => [h.id, h.city]));

  const visitsByHotel = periodRecords.reduce((acc, record) => {
    acc[record.hotelId] = (acc[record.hotelId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const hotelRanking = allHotels.map(hotel => ({
    id: hotel.id,
    name: hotel.name,
    visits: visitsByHotel[hotel.id] || 0,
  })).sort((a, b) => b.visits - a.visits);

  const visitsByCity = periodRecords.reduce((acc, record) => {
    const city = hotelCityMap.get(record.hotelId) || 'Sin Ciudad';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // New calculations for staffing requests
  const periodRequests = allRequests.filter(r => {
    const reqDate = new Date(r.created_at);
    return reqDate >= start && reqDate <= end;
  });

  const newRequests = periodRequests.length;

  const completedInPeriod = periodRequests.filter(r => r.status === 'Completada' && r.completed_at && new Date(r.completed_at) >= start && new Date(r.completed_at) <= end);
  const fulfillmentRate = newRequests > 0 ? (completedInPeriod.length / newRequests) * 100 : 0;

  const timeToFillSum = completedInPeriod.reduce((acc, r) => {
    const completedDate = new Date(r.completed_at);
    const createdDate = new Date(r.created_at);
    if (!isNaN(completedDate.getTime()) && !isNaN(createdDate.getTime())) {
      return acc + differenceInDays(completedDate, createdDate);
    }
    return acc;
  }, 0);
  const avgTimeToFill = completedInPeriod.length > 0 ? timeToFillSum / completedInPeriod.length : 0;

  const noShowInPeriod = periodRequests.filter(r => r.status === 'Candidato No Presentado').length;
  const noShowRate = newRequests > 0 ? (noShowInPeriod.length / newRequests) * 100 : 0;

  const overdueRequests = periodRequests.filter(r => 
    !['Completada', 'Cancelada por Hotel', 'Candidato No Presentado'].includes(r.status) && 
    new Date(r.start_date) < end
  ).length;

  return {
    visits: periodRecords.length,
    newEmployees: newEmployeesList.length,
    newEmployeesList,
    hotelRanking,
    visitsByCity: Object.entries(visitsByCity).map(([name, value]) => ({ name, value })),
    payrollsReviewed,
    attendanceByEmployee: Object.entries(attendanceByEmployee).map(([name, value]) => ({ name, value })),
    totalOvertime,
    newRequests,
    fulfillmentRate,
    avgTimeToFill,
    noShowRate,
    overdueRequests,
  };
};


export const useReportData = (startDate: string | null, endDate: string | null) => {
  const { employees, loading: employeesLoading } = useEmployees();
  const { hotels, loading: hotelsLoading } = useHotels();
  const { allRecords, loading: attendanceLoading } = useAttendance({ start: null, end: null });
  const { requests, loading: requestsLoading } = useStaffingRequests();

  const loading = employeesLoading || hotelsLoading || attendanceLoading || requestsLoading;

  const reportData = useMemo(() => {
    if (loading || !startDate || !endDate) {
      return { currentPeriod: null, previousPeriod: null, activeEmployees: 0, blacklistedEmployees: 0, blacklistedEmployeesList: [], totalHotels: 0, employeesByHotel: [], activeEmployeesByRole: [], payrollsToReview: 0 };
    }

    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);
    
    const periodDuration = differenceInDays(currentEnd, currentStart);
    const previousStart = subDays(currentStart, periodDuration + 1);
    const previousEnd = subDays(currentEnd, periodDuration + 1);

    const currentPeriodStats = calculatePeriodStats(allRecords, employees, hotels, requests, currentStart, currentEnd);
    const previousPeriodStats = calculatePeriodStats(allRecords, employees, hotels, requests, previousStart, previousEnd);

    const activeEmployeesList = employees.filter(e => e.isActive);
    const activeEmployees = activeEmployeesList.length;
    const blacklistedEmployeesList = employees.filter(e => e.isBlacklisted);
    const blacklistedEmployees = blacklistedEmployeesList.length;
    const totalHotels = hotels.length;

    const employeesByHotel = hotels.map(hotel => ({
      name: hotel.name,
      count: employees.filter(e => e.hotelId === hotel.id).length,
    }));

    const activeEmployeesByRole = activeEmployeesList.reduce((acc, employee) => {
      const role = employee.role || 'Sin Cargo';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const payrollsToReview = employees.filter(emp => 
      emp.payrollType === 'Workrecord' && 
      (!emp.lastReviewedTimestamp || new Date(emp.lastReviewedTimestamp).getTime() < startOfWeek(new Date(), { weekStartsOn: 1 }).getTime())
    ).length;

    return {
      currentPeriod: currentPeriodStats,
      previousPeriod: previousPeriodStats,
      activeEmployees,
      blacklistedEmployees,
      blacklistedEmployeesList,
      totalHotels,
      employeesByHotel,
      activeEmployeesByRole: Object.entries(activeEmployeesByRole).map(([name, value]) => ({ name, value })),
      payrollsToReview,
    };

  }, [loading, startDate, endDate, employees, hotels, allRecords, requests]);

  return {
    data: reportData,
    loading,
  };
};
