import { Paper, Typography, Box, CircularProgress, Tooltip } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import StatCard from '../dashboard/StatCard';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

interface TurnoverAnalysisProps {
  hotelId: string;
}

export default function TurnoverAnalysis({ hotelId }: TurnoverAnalysisProps) {
  const [turnoverData, setTurnoverData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Fetch all employees for the hotel
      const { data: allEmployees, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .eq('hotelId', hotelId);

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        setLoading(false);
        return;
      }

      const employees = allEmployees.filter(e => e.employeeType === 'permanente');

      // 2. Fetch status history for the hotel's employees
      const employeeIds = employees.map(e => e.id);
      const { data: history, error: historyError } = await supabase
        .from('employee_status_history')
        .select('employee_id, change_date, new_is_active')
        .in('employee_id', employeeIds)
        .eq('new_is_active', false); // Only need separations

      if (historyError) {
        console.error('Error fetching status history:', historyError);
        setLoading(false);
        return;
      }

      // 3. Calculate turnover rates
      const calculateRate = (days: number, returnComponents = false) => {
        const periodEnd = new Date();
        const periodStart = new Date();
        periodStart.setDate(periodEnd.getDate() - days);

        const separations = history.filter(h => {
          const changeDate = new Date(h.change_date);
          return changeDate >= periodStart && changeDate <= periodEnd;
        }).length;

        // Simplified average employee count for the period
        const employeesAtStart = employees.filter(e => {
            const idTimestamp = parseInt(e.id.split('-')[1]);
            return !isNaN(idTimestamp) && idTimestamp <= periodStart.getTime();
        }).length;
        const employeesAtEnd = employees.length;
        const avgEmployees = (employeesAtStart + employeesAtEnd) / 2;

        if (returnComponents) {
            return {
                rate: avgEmployees === 0 ? 0 : (separations / avgEmployees) * 100,
                separations,
                avgEmployees,
            };
        }

        if (avgEmployees === 0) return 0;
        return (separations / avgEmployees) * 100;
      };
      
      const { rate: turnover30, separations: separations30, avgEmployees: avgEmployees30 } = calculateRate(30, true) as { rate: number, separations: number, avgEmployees: number };
      const { rate: turnover365, separations: separations365, avgEmployees: avgEmployees365 } = calculateRate(365, true) as { rate: number, separations: number, avgEmployees: number };

      // 4. Calculate monthly trend for the last 12 months
      const monthlyTrend = Array.from({ length: 12 }).map((_, i) => {
        const monthEnd = new Date();
        monthEnd.setMonth(monthEnd.getMonth() - i);
        const monthStart = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), 1);

        const separations = history.filter(h => {
          const changeDate = new Date(h.change_date);
          return changeDate >= monthStart && changeDate <= monthEnd;
        }).length;
        
        const employeesAtStart = employees.filter(e => {
            const idTimestamp = parseInt(e.id.split('-')[1]);
            return !isNaN(idTimestamp) && idTimestamp <= monthStart.getTime();
        }).length;
        const employeesAtEnd = employees.filter(e => {
            const idTimestamp = parseInt(e.id.split('-')[1]);
            return !isNaN(idTimestamp) && idTimestamp <= monthEnd.getTime();
        }).length;
        const avgEmployees = (employeesAtStart + employeesAtEnd) / 2;

        const rate = avgEmployees > 0 ? (separations / avgEmployees) * 100 : 0;
        
        return {
          name: monthStart.toLocaleString('default', { month: 'short' }),
          rate: rate.toFixed(1),
        };
      }).reverse();


      setTurnoverData({
        turnover30,
        separations30,
        avgEmployees30,
        turnover365,
        separations365,
        avgEmployees365,
        monthlyTrend,
      });

      setLoading(false);
    };

    fetchData();
  }, [hotelId]);

  if (loading) {
    return <CircularProgress />;
  }

  const tooltipText = `Tasa de rotación calculada con la fórmula: (Separaciones / Promedio de empleados) * 100.\n- Tasa (30 días): ${turnoverData.turnover30.toFixed(1)}% (Separaciones: ${turnoverData.separations30}, Promedio Empleados: ${turnoverData.avgEmployees30.toFixed(1)})\n- Tasa (365 días): ${turnoverData.turnover365.toFixed(1)}% (Separaciones: ${turnoverData.separations365}, Promedio Empleados: ${turnoverData.avgEmployees365.toFixed(1)})`;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Análisis de Rotación de Personal</Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Tooltip title={tooltipText}>
            <div>
              <StatCard
                title="Rotación (Últimos 365 días)"
                value={`${turnoverData.turnover365.toFixed(1)}%`}
                icon={<TrendingDownIcon />}
              />
            </div>
          </Tooltip>
        </Box>
        <Box sx={{ flex: 2, height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={turnoverData.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="rate" name="Tasa de Rotación (%)" stroke="#8884d8" />
                </LineChart>
            </ResponsiveContainer>
        </Box>
      </Box>
    </Paper>
  );
}
// refresh
