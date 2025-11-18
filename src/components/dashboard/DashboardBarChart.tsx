import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

interface DashboardBarChartProps {
  data: { name: string; value: number }[];
  title: string;
}

const CustomYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const { value } = payload;
  const MAX_LENGTH = 25; // Max characters to show
  const truncatedValue = value.length > MAX_LENGTH ? `${value.substring(0, MAX_LENGTH)}...` : value;

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={4} textAnchor="end" fill="#666">
        {truncatedValue}
      </text>
    </g>
  );
};

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
      height: '420px', // Set a fixed height for the paper
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto', 
        overflowX: 'hidden',
        height: '100%',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(0,0,0,0.1)',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#FF5722',
          borderRadius: '4px',
          boxShadow: '0 0 6px #FF5722',
        },
      }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={200} interval={0} tick={<CustomYAxisTick />} />
            <Tooltip wrapperStyle={{ zIndex: 1000 }} />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" name="Cantidad" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}