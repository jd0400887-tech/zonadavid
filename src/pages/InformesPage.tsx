import { useLocation } from 'react-router-dom';
import { Box, Typography, Paper, Grid, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { ArrowUpward, ArrowDownward, Remove } from '@mui/icons-material';
import { useReportData } from '../hooks/useReportData';

// A small component to display a stat with its change from the previous period
const StatComparison = ({ title, currentValue, previousValue }: { title: string, currentValue: number, previousValue: number }) => {
  const change = currentValue - previousValue;
  const ChangeIcon = change > 0 ? ArrowUpward : change < 0 ? ArrowDownward : Remove;
  const changeColor = change > 0 ? 'success.main' : change < 0 ? 'error.main' : 'text.secondary';

  return (
    <Paper sx={{ p: 2, textAlign: 'center' }}>
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

  const { currentPeriod, previousPeriod, activeEmployees, blacklistedEmployees, totalHotels } = data;

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
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}><Typography variant="h6" color="text.secondary">Empleados Activos</Typography><Typography variant="h4">{activeEmployees}</Typography></Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}><Typography variant="h6" color="text.secondary">Total Hoteles</Typography><Typography variant="h4">{totalHotels}</Typography></Paper>
        </Grid>
      </Grid>

      {/* Section 2: Hotel Ranking */}
      <Typography variant="h5" gutterBottom>Ranking de Hoteles por Visitas</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { backgroundColor: 'primary.main', color: 'common.white' } }}>
              <TableCell>#</TableCell>
              <TableCell>Hotel</TableCell>
              <TableCell align="right">Visitas (Período Actual)</TableCell>
              <TableCell align="right">Visitas (Período Anterior)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentPeriod.hotelRanking.map((hotel: any, index: number) => {
              const prevRank = previousPeriod?.hotelRanking.find((h: any) => h.id === hotel.id);
              return (
                <TableRow key={hotel.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{hotel.name}</TableCell>
                  <TableCell align="right">{hotel.visits}</TableCell>
                  <TableCell align="right">{prevRank?.visits || 0}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

    </Box>
  );
}

export default InformesPage;
