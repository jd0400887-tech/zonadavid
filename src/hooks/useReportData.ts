import { useMemo, useState, useEffect } from 'react';
import { useEmployees } from './useEmployees';
import { useHotels } from './useHotels';
import { useAttendance } from './useAttendance';
import { useStaffingRequests } from './useStaffingRequests';
import { differenceInDays, subDays, startOfWeek } from 'date-fns';
import { supabase } from '../utils/supabase';
import { PayrollReview } from './usePayrollHistory';

// New interface for employee status history
export interface EmployeeStatusChange {
  id: string;
  employee_id: string;
  change_date: string;
  old_is_active: boolean;
  new_is_active: boolean;
  reason: string | null;
}

// A function to calculate stats for a given period
const calculatePeriodStats = (
  allRecords: any[], 
  permanentEmployees: any[], 
  allHotels: any[], 
  allRequests: any[],
  periodPayrollHistory: PayrollReview[],
  periodEmployeeStatusHistory: EmployeeStatusChange[], // New parameter
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

  const payrollsReviewedList = permanentEmployees.filter(e => 
    e.payrollType === 'Workrecord' && 
    e.lastReviewedTimestamp && 
    new Date(e.lastReviewedTimestamp).getTime() >= startTime && 
    new Date(e.lastReviewedTimestamp).getTime() <= endTime
  );
  const payrollsReviewed = payrollsReviewedList.length;

  const attendanceByEmployee = periodRecords.reduce((acc, record) => {
    const employee = permanentEmployees.find(e => e.id === record.employeeId);
    if (employee) {
      acc[employee.name] = (acc[employee.name] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const newEmployeesList = permanentEmployees.filter(e => {
    const idTimestamp = parseInt(e.id.split('-')[1]);
    return !isNaN(idTimestamp) && idTimestamp >= startTime && idTimestamp <= endTime;
  });

  const totalOvertime = periodPayrollHistory.reduce((acc, review) => acc + (review.overtime_hours || 0), 0);

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
  const newRequestsList = allRequests.filter(r => {
    const reqDate = new Date(r.created_at);
    return reqDate >= start && reqDate <= end;
  });
  const newRequests = newRequestsList.length;

  const completedInPeriod = newRequestsList.filter(r => r.status === 'Completada' && r.completed_at && new Date(r.completed_at) >= start && new Date(r.completed_at) <= end);
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

  const noShowInPeriod = newRequestsList.filter(r => r.status === 'Candidato No Presentado').length;
  const noShowRate = newRequests > 0 ? (noShowInPeriod / newRequests) * 100 : 0;

  const overdueRequestsList = newRequestsList.filter(r => 
    !['Completada', 'Cancelada por Hotel', 'Candidato No Presentado'].includes(r.status) && 
    new Date(r.start_date) < end
  );
  const overdueRequests = overdueRequestsList.length;

  // New calculation: employees moved from active to inactive
  const activeToInactiveList = periodEmployeeStatusHistory.filter(change =>
    change.old_is_active === true && change.new_is_active === false
  );
  const uniqueActiveToInactiveIds = new Set(activeToInactiveList.map(item => item.employee_id));
  const activeToInactive = uniqueActiveToInactiveIds.size;

  return {
    visits: periodRecords.length,
    visitsList: periodRecords,
    newEmployees: newEmployeesList.length,
    newEmployeesList,
    hotelRanking,
    visitsByCity: Object.entries(visitsByCity).map(([name, value]) => ({ name, value })),
    payrollsReviewed,
    payrollsReviewedList,
    attendanceByEmployee: Object.entries(attendanceByEmployee).map(([name, value]) => ({ name, value })),
    totalOvertime,
    newRequests,
    newRequestsList,
    fulfillmentRate,
    avgTimeToFill,
    noShowRate,
    overdueRequests,
    overdueRequestsList,
    activeToInactive, // New stat
    activeToInactiveList,
    overtimeDetails: periodPayrollHistory, // Add this line
  };
};


export const useReportData = (startDate: string | null, endDate: string | null) => {
  const { employees, loading: employeesLoading } = useEmployees();
  const { hotels, loading: hotelsLoading } = useHotels();
  const { allRecords, loading: attendanceLoading } = useAttendance({ start: null, end: null });
  const { requests, loading: requestsLoading } = useStaffingRequests();

  const [currentPeriodPayrollHistory, setCurrentPeriodPayrollHistory] = useState<PayrollReview[]>([]);
  const [previousPeriodPayrollHistory, setPreviousPeriodPayrollHistory] = useState<PayrollReview[]>([]);
  const [currentPeriodEmployeeStatusHistory, setCurrentPeriodEmployeeStatusHistory] = useState<EmployeeStatusChange[]>([]); // New state
  const [previousPeriodEmployeeStatusHistory, setPreviousPeriodEmployeeStatusHistory] = useState<EmployeeStatusChange[]>([]); // New state
  const [payrollHistoryLoading, setPayrollHistoryLoading] = useState(true);
  const [employeeStatusHistoryLoading, setEmployeeStatusHistoryLoading] = useState(true); // New loading state


  const loading = employeesLoading || hotelsLoading || attendanceLoading || requestsLoading || payrollHistoryLoading || employeeStatusHistoryLoading; // Update loading

  useEffect(() => {
    const fetchHistoryData = async () => { // Renamed function
      setPayrollHistoryLoading(true);
      setEmployeeStatusHistoryLoading(true); // Set new loading state

      if (!startDate || !endDate) {
        setCurrentPeriodPayrollHistory([]);
        setPreviousPeriodPayrollHistory([]);
        setCurrentPeriodEmployeeStatusHistory([]); // Clear new state
        setPreviousPeriodEmployeeStatusHistory([]); // Clear new state
        setPayrollHistoryLoading(false);
        setEmployeeStatusHistoryLoading(false); // Clear new loading state
        return;
      }

      const currentStart = new Date(startDate);
      const currentEnd = new Date(endDate);

      const periodDuration = differenceInDays(currentEnd, currentStart);
      const previousStart = subDays(currentStart, periodDuration + 1);
      const previousEnd = subDays(currentEnd, periodDuration + 1);

      // Fetch payroll history for current period (existing code)
      const { data: currentPayrollHistoryData, error: currentPayrollHistoryError } = await supabase
        .from('payroll_review_history')
        .select('*')
        .gte('review_date', currentStart.toISOString())
        .lte('review_date', currentEnd.toISOString());

      if (currentPayrollHistoryError) {
        console.error('Error fetching current payroll history:', currentPayrollHistoryError);
        setCurrentPeriodPayrollHistory([]);
      } else {
        setCurrentPeriodPayrollHistory(currentPayrollHistoryData as PayrollReview[]);
      }

      // Fetch payroll history for previous period (existing code)
      const { data: previousPayrollHistoryData, error: previousPayrollHistoryError } = await supabase
        .from('payroll_review_history')
        .select('*')
        .gte('review_date', previousStart.toISOString())
        .lte('review_date', previousEnd.toISOString());

      if (previousPayrollHistoryError) {
        console.error('Error fetching previous payroll history:', previousPayrollHistoryError);
        setPreviousPeriodPayrollHistory([]);
      } else {
        setPreviousPeriodPayrollHistory(previousPayrollHistoryData as PayrollReview[]);
      }
      setPayrollHistoryLoading(false);


      // NEW: Fetch employee status history for current period
      const { data: currentStatusHistoryData, error: currentStatusHistoryError } = await supabase
        .from('employee_status_history')
        .select('*')
        .gte('change_date', currentStart.toISOString())
        .lte('change_date', currentEnd.toISOString());

      if (currentStatusHistoryError) {
        console.error('Error fetching current employee status history:', currentStatusHistoryError);
        setCurrentPeriodEmployeeStatusHistory([]);
      } else {
        setCurrentPeriodEmployeeStatusHistory(currentStatusHistoryData as EmployeeStatusChange[]);
      }

      // NEW: Fetch employee status history for previous period
      const { data: previousStatusHistoryData, error: previousStatusHistoryError } = await supabase
        .from('employee_status_history')
        .select('*')
        .gte('change_date', previousStart.toISOString())
        .lte('change_date', previousEnd.toISOString());

      if (previousStatusHistoryError) {
        console.error('Error fetching previous employee status history:', previousStatusHistoryError);
        setPreviousPeriodEmployeeStatusHistory([]);
      } else {
        setPreviousPeriodEmployeeStatusHistory(previousStatusHistoryData as EmployeeStatusChange[]);
      }
      setEmployeeStatusHistoryLoading(false);
    };

    fetchHistoryData();
  }, [startDate, endDate]); // Dependencies for useEffect


  const reportData = useMemo(() => {
    if (loading || !startDate || !endDate) {
      return { currentPeriod: null, previousPeriod: null, activeEmployees: 0, blacklistedEmployees: 0, blacklistedEmployeesList: [], totalHotels: 0, employeesByHotel: [], activeEmployeesByRole: [], payrollsToReview: 0 };
    }

    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);

    const periodDuration = differenceInDays(currentEnd, currentStart);
    const previousStart = subDays(currentStart, periodDuration + 1);
    const previousEnd = subDays(currentEnd, periodDuration + 1);

    const permanentEmployees = employees.filter(e => e.employeeType === 'permanente');

    const currentPeriodStats = calculatePeriodStats(allRecords, permanentEmployees, hotels, requests, currentPeriodPayrollHistory, currentPeriodEmployeeStatusHistory, currentStart, currentEnd);
    const previousPeriodStats = calculatePeriodStats(allRecords, permanentEmployees, hotels, requests, previousPeriodPayrollHistory, previousPeriodEmployeeStatusHistory, previousStart, previousEnd);

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

    const payrollsToReviewList = employees.filter(emp => 
      emp.payrollType === 'Workrecord' && 
      emp.isActive && 
      (!emp.lastReviewedTimestamp || new Date(emp.lastReviewedTimestamp).getTime() < startOfWeek(new Date(), { weekStartsOn: 1 }).getTime())
    );
    const payrollsToReview = payrollsToReviewList.length;

    const hotelTurnover = hotels.map(hotel => {
      const hotelEmployees = permanentEmployees.filter(e => e.hotelId === hotel.id);
      const hotelEmployeeIds = hotelEmployees.map(e => e.id);

      const separationEvents = currentPeriodEmployeeStatusHistory.filter(change =>
        hotelEmployeeIds.includes(change.employee_id) &&
        change.old_is_active === true &&
        change.new_is_active === false
      );
      const uniqueSeparatedEmployeeIds = new Set(separationEvents.map(event => event.employee_id));
      const separations = uniqueSeparatedEmployeeIds.size;

      const employeesAtStart = hotelEmployees.filter(e => {
        const idTimestamp = parseInt(e.id.split('-')[1]);
        return !isNaN(idTimestamp) && idTimestamp <= currentStart.getTime();
      }).length;
      const employeesAtEnd = hotelEmployees.length;
      const avgEmployees = (employeesAtStart + employeesAtEnd) / 2;

      const rate = avgEmployees > 0 ? (separations / avgEmployees) * 100 : 0;

      return {
        hotelId: hotel.id,
        hotelName: hotel.name,
        turnoverRate: rate,
        separations,
        avgEmployees,
      };
    }).sort((a, b) => b.turnoverRate - a.turnoverRate);

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
      payrollsToReviewList,
      hotelTurnover,
    };

  }, [loading, startDate, endDate, employees, hotels, allRecords, requests, currentPeriodPayrollHistory, previousPeriodPayrollHistory, currentPeriodEmployeeStatusHistory, previousPeriodEmployeeStatusHistory]); // Add new dependencies

  return {
    data: reportData,
    loading,
    employees,
    hotels,
  };
};
