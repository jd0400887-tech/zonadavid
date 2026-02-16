import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import type { Employee } from '../types';
import { getWeek, startOfWeek, addWeeks, format, subWeeks } from 'date-fns';
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
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Inicio de la semana actual
    const weekBeforeCurrentWeekStart = subWeeks(currentWeekStart, 1); // Inicio de la semana ANTERIOR a la actual

    const labels: string[] = [];
    // Generar semanas desde la más reciente (anterior a la actual) hasta la más antigua (7 semanas atrás de esa)
    for (let i = 0; i < WEEKS_TO_SHOW; i++) { // Iterar de 0 a WEEKS_TO_SHOW-1 (0 a 6 para 7 semanas)
        const date = subWeeks(weekBeforeCurrentWeekStart, i); // Restar 'i' semanas desde la semana anterior a la actual
        const weekNum = getWeek(date, { weekStartsOn: 1 });
        labels.push(`Sem ${weekNum}`);
    }
    // El orden en 'labels' ahora es: [Sem(X-1), Sem(X-2), ..., Sem(X-7)]
    labels.reverse(); // Invertir para que sea: [Sem(X-7), Sem(X-6), ..., Sem(X-1)]
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

      const currentWeekStartForHistory = startOfWeek(new Date(), { weekStartsOn: 1 }); // Inicio de la semana actual
      const weekBeforeCurrentWeekStartForHistory = subWeeks(currentWeekStartForHistory, 1); // Inicio de la semana ANTERIOR a la actual

      // Generar un historial completo para el empleado para las WEEKS_TO_SHOW semanas
      for (let i = 0; i < WEEKS_TO_SHOW; i++) { // Iterar de 0 a WEEKS_TO_SHOW-1
        const date = subWeeks(weekBeforeCurrentWeekStartForHistory, i); // Restar 'i' semanas desde la semana anterior a la actual
        const weekNum = getWeek(date, { weekStartsOn: 1 });
        const complianceYear = date.getFullYear(); 

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
      fullComplianceHistory.reverse(); // Invertir para que coincida con el orden final de weekLabels (más antigua a más reciente)
      // El fullComplianceHistory ahora contiene las semanas en el orden de más reciente a más antigua,
      // al igual que las weekLabels.


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
