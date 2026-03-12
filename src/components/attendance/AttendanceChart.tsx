import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import type { Hotel } from '../../types';

interface VisitData {
  hotel: Hotel | undefined;
  count: number;
}

interface AttendanceChartProps {
  data: VisitData[];
}

export default function AttendanceChart({ data }: AttendanceChartProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  const chartData = data.map(item => ({
    name: item.hotel?.name || 'Desconocido',
    Visitas: item.count,
  }));

  return (
    <Paper sx={{ 
      p: 3, 
      mb: 3, 
      height: 350, 
      borderRadius: 4,
      border: '1px solid rgba(255,255,255,0.05)',
      backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.02)',
      boxShadow: isLight ? '0 4px 6px rgba(0,0,0,0.05)' : 'none'
    }}>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Visitas por Hotel</Typography>
      <Box sx={{ width: '100%', height: 'calc(100% - 40px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fontWeight: 600, fill: theme.palette.text.secondary }}
            />
            <YAxis 
              allowDecimals={false} 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fontWeight: 600, fill: theme.palette.text.secondary }}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary
              }}
              cursor={{ fill: 'rgba(255, 87, 34, 0.05)' }}
            />
            <Bar 
              dataKey="Visitas" 
              fill={theme.palette.primary.main} 
              radius={[6, 6, 0, 0]}
              barSize={40}
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? theme.palette.primary.main : theme.palette.primary.light} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}