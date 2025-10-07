import { useLocation } from 'react-router-dom';
import { Box, Typography, Paper, Grid, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { ArrowUpward, ArrowDownward, Remove } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useReportData } from '../hooks/useReportData';

// A small component to display a stat with its change from the previous period
const StatComparison = ({ title, currentValue, previousValue }: { title: string, currentValue: number, previousValue: number }) => {
  const change = currentValue - previousValue;
  const ChangeIcon = change > 0 ? ArrowUpward : change < 0 ? ArrowDownward : Remove;
  const changeColor = change > 0 ? 'success.main' : change < 0 ? 'error.main' : 'text.secondary';

  return (
    <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
      <Typography variant="h6" color="text.secondary">{title}</Typography>
      <Typography variant="h4" component="p">{currentValue}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: changeColor }}>
        <ChangeIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
        <Typography variant="body2">
          {change} vs. período anterior ({previousValue})
        </Typography>
      </Box>
    </Paper>
  );
};

function InformesPage() {
  const location = useLocation();
  const { title, startDate, endDate } = location.state || {};
  const { data, loading } = useReportData(startDate, endDate);

  const formattedStartDate = startDate ? new Date(startDate).toLocaleDateString() : 'N/A';
  const formattedEndDate = endDate ? new Date(endDate).toLocaleDateString() : 'N/A';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Generando informe...</Typography>
      </Box>
    );
  }

  if (!data || !data.currentPeriod) {
    return <Typography sx={{ p: 3 }}>No se pudieron cargar los datos para el informe.</Typography>;
  }

  const { currentPeriod, previousPeriod, activeEmployees, blacklistedEmployees, totalHotels, payrollsToReview, activeEmployeesByRole } = data;

  const hotelChartData = [...currentPeriod.hotelRanking]
    .map(hotel => {
      const prevHotel = previousPeriod?.hotelRanking.find((h: any) => h.id === hotel.id);
      return {
        name: hotel.name,
        Visitas: hotel.visits,
        'Visitas (Anterior)': prevHotel?.visits || 0,
      };
    })
    .sort((a, b) => a.Visitas - b.Visitas);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {title || 'Informe Personalizado'}
      </Typography>
      <Paper sx={{ p: 2, mb: 3, background: '#f5f5f5' }}>
        <Typography variant="h6">
          Período del Informe: {formattedStartDate} - {formattedEndDate}
        </Typography>
      </Paper>

      {/* Section 1: Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatComparison title="Visitas Registradas" currentValue={currentPeriod.visits} previousValue={previousPeriod?.visits || 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatComparison title="Nuevos Empleados" currentValue={currentPeriod.newEmployees} previousValue={previousPeriod?.newEmployees || 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}><Typography variant="h6" color="text.secondary">Nóminas por Revisar</Typography><Typography variant="h4">{payrollsToReview}</Typography></Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}><Typography variant="h6" color="text.secondary">En Lista Negra</Typography><Typography variant="h4">{blacklistedEmployees}</Typography></Paper>
        </Grid>
      </Grid>

      {/* Section 2: Hotel Ranking Chart */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>Ranking de Hoteles por Visitas</Typography>
        <Paper sx={{ height: 400, p: 2, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={hotelChartData} margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip wrapperStyle={{ zIndex: 1000 }} />
              <Legend />
              <Bar dataKey="Visitas" fill="#8884d8" />
              <Bar dataKey="Visitas (Anterior)" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Box>

      {/* Section 3: Personnel and City Analysis */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>Personal Activo por Cargo</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead><TableRow sx={{ '& th': { backgroundColor: 'secondary.main', color: 'common.white' } }}><TableCell>Cargo</TableCell><TableCell align="right">Cantidad</TableCell></TableRow></TableHead>
              <TableBody>
                {activeEmployeesByRole.map((role: any) => (
                  <TableRow key={role.name}><TableCell>{role.name}</TableCell><TableCell align="right">{role.value}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>Visitas por Ciudad</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead><TableRow sx={{ '& th': { backgroundColor: 'secondary.main', color: 'common.white' } }}><TableCell>Ciudad</TableCell><TableCell align="right">Visitas</TableCell></TableRow></TableHead>
              <TableBody>
                {currentPeriod.visitsByCity.map((city: any) => (
                  <TableRow key={city.name}><TableCell>{city.name}</TableCell><TableCell align="right">{city.value}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

    </Box>
  );
}

export default InformesPage;
