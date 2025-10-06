import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Paper, Typography, Box } from '@mui/material';
import type { Hotel } from '../../types';

interface VisitData {
  hotel: Hotel | undefined;
  count: number;
}

interface AttendanceChartProps {
  data: VisitData[];
}

export default function AttendanceChart({ data }: AttendanceChartProps) {
  const chartData = data.map(item => ({
    name: item.hotel?.name || 'Desconocido',
    Visitas: item.count,
  }));

  return (
    <Paper sx={{ p: 2, mb: 2, height: 300 }}>
      <Typography variant="h6" gutterBottom>Visitas por Hotel</Typography>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Visitas" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}