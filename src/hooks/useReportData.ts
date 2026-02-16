import { useMemo, useState, useEffect } from 'react';
import { useEmployees } from './useEmployees';
import { useHotels } from './useHotels';
import { useAttendance } from './useAttendance';
import { useStaffingRequestsContext } from '../contexts/StaffingRequestsContext';
import { useApplications } from './useApplications'; // Import useApplications
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
  allEmployees: any[], 
  allHotels: any[], 
  allRequests: any[],
  allApplications: any[], // Add this
  periodPayrollHistory: PayrollReview[],
  periodEmployeeStatusHistory: EmployeeStatusChange[], // New parameter
  start: Date, 
  end: Date
) => {
  const startTime = start.getTime();
  const endTime = end.getTime();

  const permanentEmployees = allEmployees.filter(e => e.employeeType === 'permanente');
  const temporaryEmployees = allEmployees.filter(e => e.employeeType === 'temporal');

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

  const newTemporaryEmployeesList = temporaryEmployees.filter(e => {
    const idTimestamp = parseInt(e.id.split('-')[1]);
    return !isNaN(idTimestamp) && idTimestamp >= startTime && idTimestamp <= endTime;
  });
  const newTemporaryEmployees = newTemporaryEmployeesList.length;

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

  const temporalRequests = newRequestsList.filter(r => r.request_type === 'temporal').length;
  const permanentRequests = newRequestsList.filter(r => r.request_type === 'permanente').length;

  const completedInPeriod = newRequestsList.filter(r => 
    r.status === 'Completada' && 
    r.completed_at && 
    new Date(r.completed_at) >= start && 
    new Date(r.completed_at) <= end
  );
  const fulfillmentRate = newRequests > 0 ? (completedInPeriod.length / newRequests) * 100 : 0;

  const partiallyCompletedInPeriod = newRequestsList.filter(r =>
    r.status === 'Completada Parcialmente' &&
    r.completed_at &&
    new Date(r.completed_at) >= start &&
    new Date(r.completed_at) <= end
  );
  const partialFulfillmentRate = newRequests > 0 ? (partiallyCompletedInPeriod.length / newRequests) * 100 : 0;

  const timeToFillSum = [...completedInPeriod, ...partiallyCompletedInPeriod].reduce((acc, r) => {
    const completedDate = new Date(r.completed_at);
    const createdDate = new Date(r.created_at);
    if (!isNaN(completedDate.getTime()) && !isNaN(createdDate.getTime())) {
      // Create dates at the start of the day in UTC to avoid timezone issues
      const completedStartOfDay = new Date(Date.UTC(completedDate.getUTCFullYear(), completedDate.getUTCMonth(), completedDate.getUTCDate()));
      const createdStartOfDay = new Date(Date.UTC(createdDate.getUTCFullYear(), createdDate.getUTCMonth(), createdDate.getUTCDate()));
      
      return acc + differenceInDays(completedStartOfDay, createdStartOfDay);
    }
    return acc;
  }, 0);
  const avgTimeToFill = completedInPeriod.length > 0 ? timeToFillSum / completedInPeriod.length : 0;

  // --- No-Show Rate Logic ---
  const noShowInPeriodList = newRequestsList.filter(r => r.status === 'Candidato No Presentado');
  const noShowInPeriod = noShowInPeriodList.length;
  const noShowRate = newRequests > 0 ? (noShowInPeriod / newRequests) * 100 : 0;

  const overdueRequestsList = newRequestsList.filter(r => r.status === 'Vencida');
  const overdueRequests = overdueRequestsList.length;
  const overdueRequestsRate = newRequests > 0 ? (overdueRequests / newRequests) * 100 : 0;

  const canceledByHotelList = newRequestsList.filter(r => r.status === 'Cancelada por Hotel');
  const canceledByHotel = canceledByHotelList.length;
  const canceledByHotelRate = newRequests > 0 ? (canceledByHotel / newRequests) * 100 : 0;

  const inProgressRequestsList = newRequestsList.filter(r => 
    ['Pendiente', 'Enviada a Reclutamiento', 'En Proceso'].includes(r.status)
  );
  const inProgressRequests = inProgressRequestsList.length;
  const inProgressRate = newRequests > 0 ? (inProgressRequests / newRequests) * 100 : 0;

  // Split activeToInactive into permanent and temporary
  const activeToInactiveList = periodEmployeeStatusHistory.filter(change =>
    change.old_is_active === true && change.new_is_active === false
  );
  
  const permanentInactiveList = activeToInactiveList.filter(change => {
    const employee = allEmployees.find(e => e.id === change.employee_id);
    return employee?.employeeType === 'permanente';
  });
  const permanentInactive = new Set(permanentInactiveList.map(item => item.employee_id)).size;

  const temporaryInactiveList = activeToInactiveList.filter(change => {
    const employee = allEmployees.find(e => e.id === change.employee_id);
    return employee?.employeeType === 'temporal';
  });
  const temporaryInactive = new Set(temporaryInactiveList.map(item => item.employee_id)).size;


  const newApplicationsList = allApplications.filter(app => {
    const appDate = new Date(app.created_at);
    return appDate >= start && appDate <= end;
  });
  const newApplications = newApplicationsList.length;

  const candidateNoShowList = allRequests.filter(r => {
    const reqStartDate = new Date(r.start_date);
    return r.status === 'Candidato No Presentado' && reqStartDate >= start && reqStartDate <= end;
  });
  const candidateNoShow = candidateNoShowList.length;

  return {
    visits: periodRecords.length,
    visitsList: periodRecords,
    newEmployees: newEmployeesList.length,
    newEmployeesList,
    newTemporaryEmployees,
    newTemporaryEmployeesList,
    hotelRanking,
    visitsByCity: Object.entries(visitsByCity).map(([name, value]) => ({ name, value })),
    payrollsReviewed,
    payrollsReviewedList,
    attendanceByEmployee: Object.entries(attendanceByEmployee).map(([name, value]) => ({ name, value })),
    totalOvertime,
    newRequests,
    newRequestsList,
    fulfillmentRate,
    partialFulfillmentRate,
    avgTimeToFill,
    noShowRate,
    overdueRequests,
    overdueRequestsList,
    overdueRequestsRate, // Add new rate
    activeToInactive: permanentInactive + temporaryInactive, // Keep total for backward compatibility if needed
    activeToInactiveList,
    permanentInactive,
    permanentInactiveList,
    temporaryInactive,
    temporaryInactiveList,
    overtimeDetails: periodPayrollHistory, // Add this line
    temporalRequests,
    permanentRequests,
    newApplications,
    newApplicationsList,
    canceledByHotel,
    canceledByHotelList,
    canceledByHotelRate, // Add new rate
    candidateNoShow: noShowInPeriod, // Use the new calculation
    candidateNoShowList: noShowInPeriodList, // Use the new calculation
    inProgressRequests, // Add new value
    inProgressRequestsList, // Add new list
    inProgressRate, // Add new rate
  };
};


export const useReportData = (startDate: string | null, endDate: string | null) => {
  const { employees, loading: employeesLoading } = useEmployees();
  const { hotels, loading: hotelsLoading } = useHotels();
  const { allRecords, loading: attendanceLoading } = useAttendance({ start: null, end: null });
      const { allRequests, loading: requestsLoading } = useStaffingRequestsContext();  const { applications: allApplications, loading: applicationsLoading } = useApplications(); // Use the hook

  const [currentPeriodPayrollHistory, setCurrentPeriodPayrollHistory] = useState<PayrollReview[]>([]);
  const [previousPeriodPayrollHistory, setPreviousPeriodPayrollHistory] = useState<PayrollReview[]>([]);
  const [currentPeriodEmployeeStatusHistory, setCurrentPeriodEmployeeStatusHistory] = useState<EmployeeStatusChange[]>([]); // New state
  const [previousPeriodEmployeeStatusHistory, setPreviousPeriodEmployeeStatusHistory] = useState<EmployeeStatusChange[]>([]); // New state
  const [payrollHistoryLoading, setPayrollHistoryLoading] = useState(true);
  const [employeeStatusHistoryLoading, setEmployeeStatusHistoryLoading] = useState(true); // New loading state


  const loading = employeesLoading || hotelsLoading || attendanceLoading || requestsLoading || applicationsLoading || payrollHistoryLoading || employeeStatusHistoryLoading; // Update loading

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


      // Fetch ALL employee status history up to currentEnd for accurate historical status
      const { data: allStatusHistoryData, error: allStatusHistoryError } = await supabase
        .from('employee_status_history')
        .select('*')
        .gte('change_date', '2000-01-01T00:00:00Z') // Fetch from a very early date
        .lte('change_date', currentEnd.toISOString());

      if (allStatusHistoryError) {
        console.error('Error fetching all employee status history:', allStatusHistoryError);
        setCurrentPeriodEmployeeStatusHistory([]); 
        setPreviousPeriodEmployeeStatusHistory([]); // Asegurarse que esté vacío si hay error
      } else {
        setCurrentPeriodEmployeeStatusHistory(allStatusHistoryData as EmployeeStatusChange[]);
        // Para el período previo, también usaremos el mismo historial amplio y filtramos dentro del useMemo
        setPreviousPeriodEmployeeStatusHistory(allStatusHistoryData as EmployeeStatusChange[]); 
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

    const currentPeriodEmployeeStatusHistoryFiltered = currentPeriodEmployeeStatusHistory.filter(change => {
      const changeDate = new Date(change.change_date);
      return changeDate >= currentStart && changeDate <= currentEnd;
    });

    const previousPeriodEmployeeStatusHistoryFiltered = previousPeriodEmployeeStatusHistory.filter(change => {
      const changeDate = new Date(change.change_date);
      return changeDate >= previousStart && changeDate <= previousEnd;
    });

    const currentPeriodStats = calculatePeriodStats(
        allRecords, employees, hotels, allRequests, allApplications,
        currentPeriodPayrollHistory, currentPeriodEmployeeStatusHistoryFiltered,
        currentStart, currentEnd
    );
    const previousPeriodStats = calculatePeriodStats(
        allRecords, employees, hotels, allRequests, allApplications,
        previousPeriodPayrollHistory, previousPeriodEmployeeStatusHistoryFiltered,
        previousStart, previousEnd
    );

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
            const allPermanentHotelEmployees = employees.filter(e => e.hotelId === hotel.id && e.employeeType === 'permanente');
            const allPermanentHotelEmployeeIds = allPermanentHotelEmployees.map(e => e.id);
      
            // Function to determine if an employee was active at a given date
            const wasEmployeeActiveAtDate = (employeeId: string, targetDate: Date, history: EmployeeStatusChange[]) => {
              const relevantHistory = history
                .filter(change => change.employee_id === employeeId && new Date(change.change_date) <= targetDate)
                .sort((a, b) => new Date(b.change_date).getTime() - new Date(a.change_date).getTime()); // Latest change first
      
              if (relevantHistory.length > 0) {
                // The most recent status change before or at targetDate determines activity
                return relevantHistory[0].new_is_active;
              } else {
                // If no history up to targetDate, assume active if their idTimestamp (hiring date) is before or at targetDate
                const employee = allPermanentHotelEmployees.find(e => e.id === employeeId);
                if (employee) {
                  const idTimestamp = parseInt(employee.id.split('-')[1]);
                  return !isNaN(idTimestamp) && new Date(idTimestamp) <= targetDate;
                }
                return false;
              }
            };
      
            const employeesAtStart = allPermanentHotelEmployees.filter(emp => 
              wasEmployeeActiveAtDate(emp.id, currentStart, currentPeriodEmployeeStatusHistory)
            ).length;
      
            const employeesAtEnd = allPermanentHotelEmployees.filter(emp =>
              wasEmployeeActiveAtDate(emp.id, currentEnd, currentPeriodEmployeeStatusHistory)
            ).length;
            
            const avgEmployees = (employeesAtStart + employeesAtEnd) / 2;
      
            const separationEvents = currentPeriodEmployeeStatusHistory.filter(change =>
              allPermanentHotelEmployeeIds.includes(change.employee_id) &&
              new Date(change.change_date) >= currentStart &&
              new Date(change.change_date) <= currentEnd &&
              change.old_is_active === true &&
              change.new_is_active === false
            );
            const uniqueSeparatedEmployeeIds = new Set(separationEvents.map(event => event.employee_id));
            const separations = uniqueSeparatedEmployeeIds.size;
      
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

  }, [loading, startDate, endDate, employees, hotels, allRecords, allRequests, allApplications, currentPeriodPayrollHistory, previousPeriodPayrollHistory, currentPeriodEmployeeStatusHistory, previousPeriodEmployeeStatusHistory]); // Add new dependencies

  return {
    data: reportData,
    loading,
    employees,
    hotels,
  };
};
