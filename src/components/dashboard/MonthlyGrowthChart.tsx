import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Paper, Typography, Box } from '@mui/material';
import type { MonthlyData } from '../../hooks/useMonthlyGrowthStats';

interface MonthlyGrowthChartProps {
  data: MonthlyData[];
}

export default function MonthlyGrowthChart({ data }: MonthlyGrowthChartProps) {
  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography>No hay suficientes datos para mostrar el crecimiento mensual.</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Crecimiento Mensual (Últimos 6 Meses)</Typography>
      </Box>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <defs>
            <linearGradient id="colorEmployees" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorHotels" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
            </linearGradient>
                        <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ffc658" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF5722" stopOpacity={0.8}/> {/* Accent color */}
                          <stop offset="95%" stopColor="#FF5722" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(30, 30, 30, 0.8)',
                          borderColor: '#FF5722'
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="activeEmployees" name="Empleados Activos" stroke="#8884d8" fillOpacity={1} fill="url(#colorEmployees)" />
                      <Area type="monotone" dataKey="activeHotels" name="Hoteles Activos" stroke="#82ca9d" fillOpacity={1} fill="url(#colorHotels)" />
                      <Area type="monotone" dataKey="visits" name="Visitas" stroke="#ffc658" fillOpacity={1} fill="url(#colorVisits)" />
                      <Area type="monotone" dataKey="newApplications" name="Nuevas Aplicaciones" stroke="#FF5722" fillOpacity={1} fill="url(#colorApplications)" />
                    </AreaChart>
                  </ResponsiveContainer>    </Paper>
  );
}
