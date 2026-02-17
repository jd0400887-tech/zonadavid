import { useState, useEffect, useMemo } from 'react';
import { useEmployees } from './useEmployees';
import { useHotels } from './useHotels';
import { useStaffingRequestsContext } from '../contexts/StaffingRequestsContext';
import { useApplications } from './useApplications';
import { useAttendance } from './useAttendance';
import { eachMonthOfInterval, format, getUnixTime, fromUnixTime, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../utils/supabase';

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
  const { employees, loading: loadingEmployees, error: errorEmployees } = useEmployees();
  const { hotels, loading: loadingHotels, error: errorHotels } = useHotels();
  const { allRequests, loading: loadingRequests, error: errorRequests } = useStaffingRequestsContext();
  const { applications, loading: loadingApplications, error: errorApplications } = useApplications();
  const { allRecords: allAttendanceRecords, loading: loadingAttendance, error: errorAttendance } = useAttendance({ start: null, end: null }); // Get all records for historical analysis

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
      if (loadingEmployees || loadingHotels || loadingRequests || loadingApplications || loadingAttendance) {
        setReportData(prev => ({ ...prev, loading: true }));
        return;
      }

      if (errorEmployees || errorHotels || errorRequests || errorApplications || errorAttendance) {
        setReportData(prev => ({ ...prev, loading: false, error: "Error loading initial data." }));
        return;
      }

      const safeEmployees = employees || [];
      const safeHotels = hotels || [];
      const safeRequests = allRequests || [];

      try {
        // 1. Fetch the necessary history data
        const { data: statusHistory, error: historyError } = await supabase
          .from('employee_status_history')
          .select('employee_id, change_date, new_is_active')
          .eq('new_is_active', false);

        if (historyError) {
          throw new Error(`Failed to load employee status history: ${historyError.message}`);
        }

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

        monthIntervals.forEach(monthStart => {
          const monthEnd = addMonths(monthStart, 1);
          const monthKey = format(monthStart, 'MMM-yy', { locale: es });

          // --- Calculations for each month ---
          const hiresInMonth_perm = safeEmployees.filter(emp => emp.employeeType !== 'temporal' && new Date(getUnixTime(new Date(parseInt(emp.id.split('-')[1])) * 1000)) >= monthStart && new Date(getUnixTime(new Date(parseInt(emp.id.split('-')[1])) * 1000)) < monthEnd).length;
          const hiresInMonth_temp = safeEmployees.filter(emp => emp.employeeType === 'temporal' && new Date(getUnixTime(new Date(parseInt(emp.id.split('-')[1])) * 1000)) >= monthStart && new Date(getUnixTime(new Date(parseInt(emp.id.split('-')[1])) * 1000)) < monthEnd).length;
          hiresMonthly_perm.push({ date: monthKey, value: hiresInMonth_perm });
          hiresMonthly_temp.push({ date: monthKey, value: hiresInMonth_temp });

          const attritionInMonth_perm = safeEmployees.filter(emp => emp.employeeType !== 'temporal' && deactivationDateMap.has(emp.id) && deactivationDateMap.get(emp.id)! >= monthStart && deactivationDateMap.get(emp.id)! < monthEnd).length;
          const attritionInMonth_temp = safeEmployees.filter(emp => emp.employeeType === 'temporal' && deactivationDateMap.has(emp.id) && deactivationDateMap.get(emp.id)! >= monthStart && deactivationDateMap.get(emp.id)! < monthEnd).length;
          attritionMonthly_perm.push({ date: monthKey, value: attritionInMonth_perm });
          attritionMonthly_temp.push({ date: monthKey, value: attritionInMonth_temp });
        });
        
        // --- Aggregate Calculations ---
        const totalHires_perm = hiresMonthly_perm.reduce((sum, m) => sum + m.value, 0);
        const totalHires_temp = hiresMonthly_temp.reduce((sum, m) => sum + m.value, 0);
        const totalAttrition_perm = attritionMonthly_perm.reduce((sum, m) => sum + m.value, 0);
        const totalAttrition_temp = attritionMonthly_temp.reduce((sum, m) => sum + m.value, 0);

        const totalRequestsCreated = safeRequests.filter(req => new Date(req.created_at) >= startDate && new Date(req.created_at) <= endDate).length;
        
        const avgPermEmployees = safeEmployees.filter(e => e.employeeType !== 'temporal' && e.isActive).length; 
        const avgTempEmployees = safeEmployees.filter(e => e.employeeType === 'temporal' && e.isActive).length; 

        const churnRate_perm = avgPermEmployees > 0 ? (totalAttrition_perm / avgPermEmployees) * 100 : 0;

        // --- Construct UI Data ---
        const globalKpis = [
          { label: "Total Ingresos (Perm.)", value: totalHires_perm },
          { label: "Total Ingresos (Temp.)", value: totalHires_temp },
          { label: "Total Salidas (Perm.)", value: totalAttrition_perm },
          { label: "Total Salidas (Temp.)", value: totalAttrition_temp },
        ];

        const talentInsights = [];
        const netChange_perm = totalHires_perm - totalAttrition_perm;
        
        talentInsights.push({
            text: `Balance (Permanente): El equipo permanente tuvo un crecimiento neto de ${netChange_perm} empleados en el período.`,
            type: netChange_perm >= 0 ? 'positive' : 'negative'
        });

        let churnType: 'positive' | 'warning' | 'negative' = 'positive';
        if (churnRate_perm > 10) churnType = 'negative';
        else if (churnRate_perm > 5) churnType = 'warning';
        talentInsights.push({
            text: `Tasa de Rotación (Permanente): Se registró una rotación del ${churnRate_perm.toFixed(1)}% en el personal clave.`,
            type: churnType
        });
        
        const peakAttrition_perm = attritionMonthly_perm.reduce((max, month) => max.value > max.value ? month : max, { value: 0, date: '' });
        if (peakAttrition_perm.value > 0) {
            talentInsights.push({
                text: `Pico de Salidas (Permanente): El mes con mayor fuga de personal fijo fue ${peakAttrition_perm.date} con ${peakAttrition_perm.value} salidas.`,
                type: 'warning'
            });
        } else {
             talentInsights.push({
                text: `Pico de Salidas (Permanente): No hubo salidas de personal permanente en el período analizado.`,
                type: 'positive'
            });
        }

        talentInsights.push({
            text: `Volumen de Flexibilidad (Temporal): Se gestionó un volumen de ${totalHires_temp} ingresos y ${totalAttrition_temp} salidas de personal temporal.`,
            type: 'neutral'
        });

        const totalHires = totalHires_perm + totalHires_temp;
        if (totalHires > 0) {
            const tempHiringRatio = (totalHires_temp / totalHires) * 100;
            talentInsights.push({
                text: `Estrategia de Contratación: El ${tempHiringRatio.toFixed(0)}% de los nuevos ingresos fueron para puestos temporales.`,
                type: 'neutral'
            });
        }
        
        const talentData: HistoricalPillarData = {
            title: "Talento y Estabilidad",
            metrics: [
                { label: "Rotación (Permanente)", value: `${churnRate_perm.toFixed(1)}%` },
                { label: "Balance Neto (Perm.)", value: netChange_perm },
                { label: "Ingresos (Temporal)", value: totalHires_temp },
                { label: "Salidas (Temporal)", value: totalAttrition_temp },
            ],
            charts: [
                {
                    title: "Ingresos vs Salidas (Personal Permanente)",
                    series: [
                        { label: "Ingresos (Perm.)", data: hiresMonthly_perm },
                        { label: "Salidas (Perm.)", data: attritionMonthly_perm },
                    ],
                },
                {
                    title: "Ingresos vs Salidas (Personal Temporal)",
                    series: [
                        { label: "Ingresos (Temp.)", data: hiresMonthly_temp },
                        { label: "Salidas (Temp.)", data: attritionMonthly_temp },
                    ],
                },
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

      } catch (err) {
        console.error("Error calculating historical analysis:", err);
        setReportData(prev => ({ ...prev, loading: false, error: (err as Error).message }));
      }
    };

    calculateAnalysis();
  }, [
      startDate, endDate,
      employees, loadingEmployees, errorEmployees,
      hotels, loadingHotels, errorHotels,
      allRequests, loadingRequests, errorRequests,
  ]);

  return reportData;
}