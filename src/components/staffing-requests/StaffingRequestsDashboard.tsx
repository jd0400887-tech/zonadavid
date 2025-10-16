

import { useMemo } from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '../dashboard/StatCard';
import { differenceInDays } from 'date-fns';
import type { StaffingRequest } from '../../types';

// Icons for the stat cards
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SpeedIcon from '@mui/icons-material/Speed';

interface StaffingRequestsDashboardProps {
  requests: StaffingRequest[];
  onFilterChange: (filterType: 'status', value: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#DD4444', '#808080'];

export default function StaffingRequestsDashboard({ requests, onFilterChange }: StaffingRequestsDashboardProps) {
  const stats = useMemo(() => {
    const totalRequests = requests.length;
    if (totalRequests === 0) {
      return {
        fulfillmentRate: 0,
        avgTimeToFill: 0,
        overdueRequests: 0,
        noShowRate: 0,
        statusDistribution: [],
        requestsByHotel: [],
      };
    }

    const completedRequests = requests.filter(r => r.status === 'Completada');
    const fulfillmentRate = (completedRequests.length / totalRequests) * 100;

    const timeToFillSum = completedRequests.reduce((acc, r) => {
      if (r.completed_at) {
        return acc + differenceInDays(new Date(r.completed_at), new Date(r.created_at));
      }
      return acc;
    }, 0);
    const avgTimeToFill = completedRequests.length > 0 ? timeToFillSum / completedRequests.length : 0;

    const overdueRequests = requests.filter(r => 
      !['Completada', 'Cancelada por Hotel', 'Candidato No Presentado'].includes(r.status) && 
      new Date(r.start_date) < new Date()
    ).length;

    const noShowRequests = requests.filter(r => r.status === 'Candidato No Presentado').length;
    const noShowRate = (noShowRequests / totalRequests) * 100;

    const statusDistribution = requests.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const requestsByHotel = requests.reduce((acc, r) => {
      const hotelName = r.hotelName || 'N/A';
      acc[hotelName] = (acc[hotelName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      fulfillmentRate,
      avgTimeToFill,
      overdueRequests,
      noShowRate,
      statusDistribution: Object.entries(statusDistribution).map(([name, value]) => ({ name, value })),
      requestsByHotel: Object.entries(requestsByHotel).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    };
  }, [requests]);

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={3}>
        {/* KPI Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tasa de Cumplimiento"
            value={`${stats.fulfillmentRate.toFixed(1)}%`}
            icon={<CheckCircleOutlineIcon />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tiempo Promedio de Cobertura"
            value={`${stats.avgTimeToFill.toFixed(1)} días`}
            icon={<SpeedIcon />}
            color="#0288d1"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Solicitudes Vencidas"
            value={stats.overdueRequests}
            icon={<ErrorOutlineIcon />}
            color="#d32f2f"
            onClick={() => onFilterChange('status', 'Vencida')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tasa de No Presentación"
            value={`${stats.noShowRate.toFixed(1)}%`}
            icon={<HourglassEmptyIcon />}
            color="#ed6c02"
          />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>Distribución por Estado</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie data={stats.statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                  {stats.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>Solicitudes por Hotel</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.requestsByHotel} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" name="Solicitudes" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}