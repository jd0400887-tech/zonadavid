import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import type { Employee } from '../types';
import { getWeek, startOfWeek, addWeeks, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useHotels } from './useHotels'; // Import useHotels

export interface ComplianceRecord {
  week_of_year: number;
  compliance_year: number;
  compliance_status: string; // New field
  reason: string | null; // New field
}

interface AdoptionStat {
  employee: Employee;
  complianceHistory: ComplianceRecord[];
  compliancePercentage: number;
}

export interface HotelRankingInfo {
    hotelId: string;
    hotelName: string;
    nonComplianceCount: number;
}

const WEEKS_TO_SHOW = 6;

// Puntuación para calcular el porcentaje de cumplimiento
const COMPLIANCE_SCORES: { [key: string]: number } = {
  'cumplio': 100,
  'modificacion_menor': 75,
  'incumplimiento_parcial': 25,
  'incumplimiento_total': 0,
};

export function useAdoptionStats() {
  const [stats, setStats] = useState<AdoptionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekLabels, setWeekLabels] = useState<string[]>([]);
  const [hotelRanking, setHotelRanking] = useState<HotelRankingInfo[]>([]);
  const { hotels: allHotels } = useHotels(); // Get all hotels

  const fetchStats = useCallback(async () => {
    setLoading(true);

    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .eq('payrollType', 'Workrecord')
      .eq('isActive', true)
      .eq('employeeType', 'permanente');

    if (employeesError) {
      console.error('Error fetching employees:', employeesError);
      setLoading(false);
      return;
    }

    const today = new Date();
    
    const labels: string[] = [];
    for (let i = WEEKS_TO_SHOW - 1; i >= 0; i--) {
        const date = addWeeks(today, -i);
        const weekNum = getWeek(date, { weekStartsOn: 1 });
        labels.push(`Sem ${weekNum}`);
    }
    setWeekLabels(labels);

    const { data: complianceData, error: complianceError } = await supabase
      .from('adoption_compliance_history')
      .select('*')
      .in('employee_id', employees.map(e => e.id));

    if (complianceError) {
      console.error('Error fetching compliance history:', complianceError);
      setLoading(false);
      return;
    }

    // Calculate hotel ranking
    const nonComplianceByHotel: Record<string, number> = {};
    for (const record of complianceData) {
        if (record.compliance_status !== 'cumplio') { // Check non-compliance using new status
            const employee = employees.find(e => e.id === record.employee_id);
            if (employee && employee.hotelId) {
                nonComplianceByHotel[employee.hotelId] = (nonComplianceByHotel[employee.hotelId] || 0) + 1;
            }
        }
    }

    const rankedHotels = Object.entries(nonComplianceByHotel)
      .map(([hotelId, count]) => ({
        hotelId,
        hotelName: allHotels.find(h => h.id === hotelId)?.name || 'Desconocido',
        nonComplianceCount: count,
      }))
      .sort((a, b) => b.nonComplianceCount - a.nonComplianceCount);
    
    setHotelRanking(rankedHotels);


    const adoptionStats = employees.map(employee => {
      const historyForEmployee = complianceData
        .filter(r => r.employee_id === employee.id)
        .sort((a, b) => b.compliance_year - a.compliance_year || b.week_of_year - a.week_of_year);
        
      const complianceHistory = historyForEmployee.slice(0, WEEKS_TO_SHOW);
      
      const scorableHistory = historyForEmployee.filter(r => r.compliance_status !== 'no_aplica');
      const totalScore = scorableHistory.reduce((sum, record) => sum + (COMPLIANCE_SCORES[record.compliance_status] || 0), 0);
      const compliancePercentage = scorableHistory.length > 0 ? Math.round(totalScore / scorableHistory.length) : 0;

      return {
        employee,
        complianceHistory,
        compliancePercentage,
      };
    });

    setStats(adoptionStats);
    setLoading(false);
  }, [allHotels]);

  useEffect(() => {
    if (allHotels.length > 0) {
        fetchStats();
    }
  }, [fetchStats, allHotels]);

  return {
    stats,
    loading,
    weekLabels,
    hotelRanking, // Export ranking
    refreshStats: fetchStats,
  };
}
