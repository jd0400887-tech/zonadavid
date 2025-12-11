import { useMemo } from 'react';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { useHotels } from './useHotels';
import { useAttendance } from './useAttendance';
import { useApplications } from './useApplications'; // Import useApplications

export interface MonthlyData {
  month: string;
  activeEmployees: number;
  activeHotels: number;
  visits: number;
  newApplications: number; // Add newApplications
}

export const useMonthlyGrowthStats = (months: number = 6) => {
  const { employees, hotels } = useHotels();
  const { allRecords: allAttendanceRecords } = useAttendance({ start: null, end: null });
  const { applications: allApplications } = useApplications(); // Get allApplications

  return useMemo(() => {
    const data: MonthlyData[] = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(today, i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const monthLabel = format(start, 'MMM yyyy');

      // 1. Active Employees at the end of the month
      const activeEmployees = employees.filter(e => {
        const isActiveThisMonth = 
          e.isActive || 
          (e.lastReviewedTimestamp && new Date(e.lastReviewedTimestamp) > start);
        return isActiveThisMonth;
      }).length;

      // 2. Active Hotels at the end of the month
      const activeHotels = hotels.filter(h => {
        // A simple heuristic: if a hotel has any employee, it's considered active.
        // A more robust logic might use a `created_at` field for hotels.
        const hasEmployees = employees.some(e => e.hotelId === h.id);
        return hasEmployees;
      }).length;

      // 3. Visits during the month
      const visits = allAttendanceRecords.filter(r => {
        const recordDate = new Date(r.timestamp);
        return recordDate >= start && recordDate <= end;
      }).length;

      // 4. New Applications during the month
      const newApplications = allApplications.filter(app => {
        const appDate = new Date(app.created_at);
        return appDate >= start && appDate <= end;
      }).length;

      data.push({
        month: monthLabel,
        activeEmployees,
        activeHotels,
        visits,
        newApplications, // Add newApplications
      });
    }

    return data;
  }, [employees, hotels, allAttendanceRecords, allApplications, months]);
};
