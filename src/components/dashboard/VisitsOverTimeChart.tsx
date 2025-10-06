import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

interface VisitsOverTimeChartProps {
  data: { date: string; visits: number }[];
}

export default function VisitsOverTimeChart({ data }: VisitsOverTimeChartProps) {
  return (
        <Paper sx={{
      p: 2,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      border: '1px solid',
      borderColor: 'primary.main',
      boxShadow: `0 0 5px #FF5722, 0 0 10px #FF5722`
    }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Visitas en los Últimos 30 Días
      </Typography>
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="visits" stroke="#8884d8" name="Visitas" />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
