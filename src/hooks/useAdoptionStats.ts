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
  compliancePercentage: number | null; // Permitir null para empleados sin datos de cumplimiento
  firstTrackingWeekOfYear: number | null;
}

export interface HotelRankingInfo {
    hotelId: string;
    hotelName: string;
    nonComplianceCount: number;
}

const WEEKS_TO_SHOW = 7;

// Puntuación para calcular el porcentaje de cumplimiento
const COMPLIANCE_SCORES: { [key: string]: number } = {
  'cumplio': 100,
  'modificacion_menor': 85,
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
    const lastWeek = subWeeks(today, 1); // Empezar desde la semana anterior
    
    const labels: string[] = [];
    for (let i = WEEKS_TO_SHOW - 1; i >= 0; i--) { // WEEKS_TO_SHOW sigue siendo 7
        const date = addWeeks(lastWeek, -i); // <- Ahora se añade a 'lastWeek'
        const weekNum = getWeek(date, { weekStartsOn: 1 });
        labels.push(`Sem ${weekNum}`);
    }
    labels.reverse(); // Para que las etiquetas vayan de la más antigua a la más reciente (semana anterior)
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
        .sort((a, b) => a.compliance_year - b.compliance_year || a.week_of_year - b.week_of_year); // Ordenar de más antiguo a más nuevo

      const oldestRecord = historyForEmployee.length > 0 ? historyForEmployee[0] : null;
      const firstTrackingWeekOfYear = oldestRecord ? oldestRecord.week_of_year : null;

      let compliancePercentage: number | null = null;
      let fullComplianceHistory: ComplianceRecord[] = [];

      const today = new Date();
      // Generar un historial completo para el empleado para las WEEKS_TO_SHOW semanas
      for (let i = WEEKS_TO_SHOW - 1; i >= 0; i--) {
        const date = addWeeks(today, -i);
        const weekNum = getWeek(date, { weekStartsOn: 1 });
        const complianceYear = date.getFullYear(); // Ojo: getWeek no incluye el año

        const existingRecord = historyForEmployee.find(
          h => h.week_of_year === weekNum && h.compliance_year === complianceYear
        );

        fullComplianceHistory.push(existingRecord || {
          week_of_year: weekNum,
          compliance_year: complianceYear,
          compliance_status: 'no_data', // Nuevo estado para indicar que no hay datos
          reason: null,
        });
      }

      // Filtrar semanas no puntuables y calcular el porcentaje
      if (firstTrackingWeekOfYear !== null) {
        const scorableHistory = fullComplianceHistory.filter(r =>
          r.week_of_year >= firstTrackingWeekOfYear && r.compliance_status !== 'no_aplica' && r.compliance_status !== 'no_data'
        );
        const totalScore = scorableHistory.reduce((sum, record) => sum + (COMPLIANCE_SCORES[record.compliance_status] || 0), 0);
        compliancePercentage = scorableHistory.length > 0 ? Math.round(totalScore / scorableHistory.length) : null;
      }
      
      return {
        employee,
        complianceHistory: fullComplianceHistory,
        compliancePercentage,
        firstTrackingWeekOfYear,
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
