import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

interface DashboardPieChartProps {
  data: { name: string; value: number }[];
  title: string;
}

// Pre-defined colors for consistency
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF4560', '#775DD0'];

export default function DashboardPieChart({ data, title }: DashboardPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <Paper sx={{
        p: 2,
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        border: '1px solid',
        borderColor: 'primary.main',
        boxShadow: `0 0 5px #FF5722, 0 0 10px #FF5722`
      }}>
        <Typography variant="h6">{title}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography color="text.secondary">No hay datos disponibles</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{
      p: 2,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      border: '1px solid',
      borderColor: 'primary.main',
      boxShadow: `0 0 5px #FF5722, 0 0 10px #FF5722`
    }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
