import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

interface DashboardBarChartProps {
  data: { name: string; value: number }[];
  title: string;
}

export function DashboardBarChart({ data, title }: DashboardBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <Paper sx={{
        p: 2, 
        height: '300px', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        border: '1px solid',
        borderColor: 'primary.main',
        boxShadow: `0 0 5px #FF5722, 0 0 10px #FF5722`
      }}>
        <Typography variant="h6">{title}</Typography>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">No hay datos disponibles</Typography>
        </Box>
      </Paper>
    );
  }

  const barHeight = 35;
  const chartHeight = data.length * barHeight + 80; // 80px for top/bottom margins and legend

  return (
    <Paper sx={{
      p: 2,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      border: '1px solid',
      borderColor: 'primary.main',
      boxShadow: `0 0 5px #FF5722, 0 0 10px #FF5722`,
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '400px', // Aumentamos el minimo para que el grafico sea mas grande
      maxHeight: '800px', // Aumentamos el maximo para permitir mas items
      height: 'auto', // Permitimos que el grafico crezca
    }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto', 
        overflowX: 'hidden',
        minHeight: '350px' // Aumentamos el minimo para que el grafico sea mas grande
      }}>
        <ResponsiveContainer width="100%" height={Math.max(chartHeight, 400)}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 20, // Increased bottom margin for legend
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={200} interval={0} />
            <Tooltip wrapperStyle={{ zIndex: 1000 }} />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" name="Cantidad" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
