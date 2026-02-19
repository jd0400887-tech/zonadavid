import { useState, useEffect, useMemo } from 'react';
import { useHotels } from './useHotels';
import { useStaffingRequestsContext } from '../contexts/StaffingRequestsContext';
import { useApplications } from './useApplications';
import { useAttendance } from './useAttendance';
import { eachMonthOfInterval, format, getUnixTime, fromUnixTime, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../utils/supabase';
import type { Employee } from '../types';

export interface HistoricalMetric {
  date: string; // YYYY-MM
  value: number;
}

export interface ChartSeries {
  label: string;
  data: HistoricalMetric[];
}

export interface HistoricalChart {
  title: string;
  series: ChartSeries[];
}

export interface HistoricalPillarData {
  title: string;
  metrics: { label: string; value: string | number; }[];
  charts: HistoricalChart[];
  insights: { text: string; type: 'positive' | 'negative' | 'warning' | 'neutral' }[];
}

export interface HistoricalReportData {
  globalKpis: { label: string; value: string | number; }[]; // Top 3-4 KPIs always visible
  talent: HistoricalPillarData;
  demand: HistoricalPillarData;
  supply: HistoricalPillarData;
  visits: HistoricalPillarData;
  workrecord: HistoricalPillarData;
  loading: boolean;
  error: string | null;
}

export function useHistoricalAnalysis(startDate: Date, endDate: Date): HistoricalReportData {
  // Remove dependency on useEmployees
  const { hotels, loading: loadingHotels, error: errorHotels } = useHotels();
  const { allRequests, loading: loadingRequests, error: errorRequests } = useStaffingRequestsContext();
  
  const [reportData, setReportData] = useState<HistoricalReportData>({
    globalKpis: [],
    talent: {} as HistoricalPillarData,
    demand: {} as HistoricalPillarData,
    supply: {} as HistoricalPillarData,
    visits: {} as HistoricalPillarData,
    workrecord: {} as HistoricalPillarData,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const calculateAnalysis = async () => {
      setReportData(prev => ({ ...prev, loading: true }));

      try {
        // --- Direct Data Fetching within the Hook ---
        const { data: allEmployees, error: employeesError } = await supabase
          .from('employees')
          .select('*');
        if (employeesError) throw new Error(`Failed to load employees: ${employeesError.message}`);

        const { data: statusHistory, error: historyError } = await supabase
          .from('employee_status_history')
          .select('employee_id, change_date, new_is_active')
          .eq('new_is_active', false);
        if (historyError) throw new Error(`Failed to load employee status history: ${historyError.message}`);

        const safeEmployees: Employee[] = allEmployees || [];
        const safeRequests = allRequests || [];
        
        const deactivationDateMap = new Map<string, Date>();
        statusHistory.forEach(h => {
          deactivationDateMap.set(h.employee_id, new Date(h.change_date));
        });

        const monthIntervals = eachMonthOfInterval({ start: startDate, end: endDate });

        // --- Talent Pillar Analysis ---
        const hiresMonthly_perm: HistoricalMetric[] = [];
        const hiresMonthly_temp: HistoricalMetric[] = [];
        const attritionMonthly_perm: HistoricalMetric[] = [];
        const attritionMonthly_temp: HistoricalMetric[] = [];
        const netPositive_perm: HistoricalMetric[] = [];
        const netNegative_perm: HistoricalMetric[] = [];
        const netPositive_temp: HistoricalMetric[] = [];
        const netNegative_temp: HistoricalMetric[] = [];

        monthIntervals.forEach(monthStart => {
          const monthEnd = addMonths(monthStart, 1);
          const monthKey = format(monthStart, 'MMM-yy', { locale: es });

          const hiresInMonth_perm = safeEmployees.filter(emp => emp.employeeType !== 'temporal' && new Date(getUnixTime(new Date(parseInt(emp.id.split('-')[1])) * 1000)) >= monthStart && new Date(getUnixTime(new Date(parseInt(emp.id.split('-')[1])) * 1000)) < monthEnd).length;
          const hiresInMonth_temp = safeEmployees.filter(emp => emp.employeeType === 'temporal' && new Date(getUnixTime(new Date(parseInt(emp.id.split('-')[1])) * 1000)) >= monthStart && new Date(getUnixTime(new Date(parseInt(emp.id.split('-')[1])) * 1000)) < monthEnd).length;
          hiresMonthly_perm.push({ date: monthKey, value: hiresInMonth_perm });
          hiresMonthly_temp.push({ date: monthKey, value: hiresInMonth_temp });

          const attritionInMonth_perm = safeEmployees.filter(emp => emp.employeeType !== 'temporal' && deactivationDateMap.has(emp.id) && deactivationDateMap.get(emp.id)! >= monthStart && deactivationDateMap.get(emp.id)! < monthEnd).length;
          const attritionInMonth_temp = safeEmployees.filter(emp => emp.employeeType === 'temporal' && deactivationDateMap.has(emp.id) && deactivationDateMap.get(emp.id)! >= monthStart && deactivationDateMap.get(emp.id)! < monthEnd).length;
          attritionMonthly_perm.push({ date: monthKey, value: attritionInMonth_perm });
          attritionMonthly_temp.push({ date: monthKey, value: attritionInMonth_temp });

          const netChange_perm = hiresInMonth_perm - attritionInMonth_perm;
          netPositive_perm.push({ date: monthKey, value: netChange_perm >= 0 ? netChange_perm : 0 });
          netNegative_perm.push({ date: monthKey, value: netChange_perm < 0 ? netChange_perm : 0 });
          
          const netChange_temp = hiresInMonth_temp - attritionInMonth_temp;
          netPositive_temp.push({ date: monthKey, value: netChange_temp >= 0 ? netChange_temp : 0 });
          netNegative_temp.push({ date: monthKey, value: netChange_temp < 0 ? netChange_temp : 0 });
        });
        
        // --- Aggregate Calculations ---
        const totalHires_perm = hiresMonthly_perm.reduce((sum, m) => sum + m.value, 0);
        const totalHires_temp = hiresMonthly_temp.reduce((sum, m) => sum + m.value, 0);
        const totalAttrition_perm = attritionMonthly_perm.reduce((sum, m) => sum + m.value, 0);
        const totalAttrition_temp = attritionMonthly_temp.reduce((sum, m) => sum + m.value, 0);
        
        const avgPermEmployees = safeEmployees.filter(e => e.employeeType !== 'temporal' && e.isActive).length; 
        const churnRate_perm = avgPermEmployees > 0 ? (totalAttrition_perm / avgPermEmployees) * 100 : 0;

        // --- Construct UI Data ---
        const globalKpis = [
          { label: "Total Ingresos (Perm.)", value: totalHires_perm },
          { label: "Total Ingresos (Temp.)", value: totalHires_temp },
          { label: "Total Salidas (Perm.)", value: totalAttrition_perm },
          { label: "Total Salidas (Temp.)", value: totalAttrition_temp },
        ];

        const talentInsights = [];
        const netChange_perm_total = totalHires_perm - totalAttrition_perm;
        
        talentInsights.push({ text: `Balance (Permanente): El equipo permanente tuvo un crecimiento neto de ${netChange_perm_total} empleados en el período.`, type: netChange_perm_total >= 0 ? 'positive' : 'negative' });
        
        let churnType: 'positive' | 'warning' | 'negative' = 'positive';
        if (churnRate_perm > 10) churnType = 'negative';
        else if (churnRate_perm > 5) churnType = 'warning';
        talentInsights.push({ text: `Tasa de Rotación (Permanente): Se registró una rotación del ${churnRate_perm.toFixed(1)}% en el personal clave.`, type: churnType });
        
        const peakAttrition_perm = attritionMonthly_perm.reduce((max, month) => month.value > max.value ? month : max, { value: 0, date: '' });
        if (peakAttrition_perm.value > 0) {
            talentInsights.push({ text: `Pico de Salidas (Permanente): El mes con mayor fuga de personal fijo fue ${peakAttrition_perm.date} con ${peakAttrition_perm.value} salidas.`, type: 'warning' });
        } else {
             talentInsights.push({ text: `Pico de Salidas (Permanente): No hubo salidas de personal permanente en el período analizado.`, type: 'positive' });
        }

        talentInsights.push({ text: `Volumen de Flexibilidad (Temporal): Se gestionó un volumen de ${totalHires_temp} ingresos y ${totalAttrition_temp} salidas de personal temporal.`, type: 'neutral' });
        
        const totalHires = totalHires_perm + totalHires_temp;
        if (totalHires > 0) {
            const tempHiringRatio = (totalHires_temp / totalHires) * 100;
            talentInsights.push({ text: `Estrategia de Contratación: El ${tempHiringRatio.toFixed(0)}% de los nuevos ingresos fueron para puestos temporales.`, type: 'neutral' });
        }
        
        const talentData: HistoricalPillarData = {
            title: "Talento y Estabilidad",
            metrics: [
                { label: "Rotación (Permanente)", value: `${churnRate_perm.toFixed(1)}%` },
                { label: "Balance Neto (Perm.)", value: netChange_perm_total },
                { label: "Ingresos (Temporal)", value: totalHires_temp },
                { label: "Salidas (Temporal)", value: totalAttrition_temp },
            ],
            charts: [
                { title: "Análisis de Personal Permanente", series: [{ label: "Balance Positivo", data: netPositive_perm }, { label: "Balance Negativo", data: netNegative_perm }, { label: "Ingresos", data: hiresMonthly_perm }, { label: "Salidas", data: attritionMonthly_perm }] },
                { title: "Análisis de Personal Temporal", series: [{ label: "Balance Positivo", data: netPositive_temp }, { label: "Balance Negativo", data: netNegative_temp }, { label: "Ingresos", data: hiresMonthly_temp }, { label: "Salidas", data: attritionMonthly_temp }] }
            ],
            insights: talentInsights,
        };

        setReportData({
          globalKpis,
          talent: talentData,
          demand: {} as HistoricalPillarData,
          supply: {} as HistoricalPillarData,
          visits: {} as HistoricalPillarData,
          workrecord: {} as HistoricalPillarData,
          loading: false,
          error: null,
        });

      } catch (err: any) {
        console.error("Error calculating historical analysis:", err);
        setReportData(prev => ({ ...prev, loading: false, error: err.message }));
      }
    };

    calculateAnalysis();
  }, [startDate, endDate, allRequests, loadingHotels, loadingRequests]);

  return reportData;
}