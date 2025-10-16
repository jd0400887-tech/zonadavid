

import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Toolbar, TableSortLabel } from '@mui/material';
import { ArrowUpward, ArrowDownward, Remove, CloudDownload as CloudDownloadIcon } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useReportData } from '../hooks/useReportData';
import { useSortableData } from '../hooks/useSortableData';
import { exportToExcel } from '../utils/exportToExcel';

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

  const cityComparisonData = useMemo(() => {
    if (!data || !data.currentPeriod) return [];
    const allCities = [...new Set([
      ...data.currentPeriod.visitsByCity.map((c: any) => c.name),
      ...(data.previousPeriod?.visitsByCity.map((c: any) => c.name) || [])
    ])];
    return allCities.map(cityName => {
      const current = data.currentPeriod.visitsByCity.find((c: any) => c.name === cityName);
      const previous = data.previousPeriod?.visitsByCity.find((c: any) => c.name === cityName);
      return {
        name: cityName,
        currentVisits: current?.value || 0,
        previousVisits: previous?.value || 0,
      };
    });
  }, [data]);

  // Sorting hooks for each table
  const { items: sortedRoles, requestSort: requestSortRoles, sortConfig: sortConfigRoles } = useSortableData(data?.activeEmployeesByRole || [], { key: 'value', direction: 'desc' });
  const { items: sortedCities, requestSort: requestSortCities, sortConfig: sortConfigCities } = useSortableData(cityComparisonData, { key: 'currentVisits', direction: 'desc' });
  const { items: sortedHotels, requestSort: requestSortHotels, sortConfig: sortConfigHotels } = useSortableData(data?.employeesByHotel || [], { key: 'count', direction: 'desc' });
  const { items: sortedAttendance, requestSort: requestSortAttendance, sortConfig: sortConfigAttendance } = useSortableData(data?.currentPeriod?.attendanceByEmployee || [], { key: 'value', direction: 'desc' });
  const { items: sortedNewEmployees, requestSort: requestSortNewEmployees, sortConfig: sortConfigNewEmployees } = useSortableData(data?.currentPeriod?.newEmployeesList || [], { key: 'name', direction: 'asc' });
  const { items: sortedBlacklisted, requestSort: requestSortBlacklisted, sortConfig: sortConfigBlacklisted } = useSortableData(data?.blacklistedEmployeesList || [], { key: 'name', direction: 'asc' });

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

  const { currentPeriod, previousPeriod, blacklistedEmployees, payrollsToReview } = data;

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

  const handleExport = () => {
    const excelData = {
      hotelData: hotelChartData.map(h => ({ 'Hotel': h.name, 'Visitas': h.Visitas, 'Visitas (Anterior)': h['Visitas (Anterior)'] })).sort((a,b) => b.Visitas - a.Visitas),
      roleData: sortedRoles.map((r: any) => ({ 'Cargo': r.name, 'Cantidad': r.value })),
      cityData: sortedCities.map(c => ({ 'Ciudad': c.name, 'Visitas (Actual)': c.currentVisits, 'Visitas (Anterior)': c.previousVisits, 'Cambio': c.currentVisits - c.previousVisits })),
      employeesByHotelData: sortedHotels.map((h: any) => ({ 'Hotel': h.name, 'Empleados': h.count })),
      attendanceByEmployeeData: sortedAttendance.map((att: any) => ({ 'Empleado': att.name, 'Visitas': att.value })),
      newEmployeesData: sortedNewEmployees.map((emp: any) => ({ 'Nombre': emp.name })),
      blacklistedEmployeesData: sortedBlacklisted.map((emp: any) => ({ 'Nombre': emp.name })),
      summaryData: [
        { 'Métrica': 'Visitas Registradas', 'Valor': currentPeriod.visits },
        { 'Métrica': 'Nuevos Empleados', 'Valor': currentPeriod.newEmployees },
        { 'Métrica': 'Nóminas Revisadas', 'Valor': currentPeriod.payrollsReviewed },
        { 'Métrica': 'Total Horas Overtime', 'Valor': currentPeriod.totalOvertime },
        { 'Métrica': 'Nóminas por Revisar', 'Valor': payrollsToReview },
        { 'Métrica': 'En Lista Negra', 'Valor': blacklistedEmployees },
      ],
      reportTitle: title || 'Informe_Personalizado',
    };
    exportToExcel(excelData);
  };

  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      <Toolbar />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" gutterBottom component="h1">
          {title || 'Informe Personalizado'}
        </Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<CloudDownloadIcon />}
          onClick={handleExport}
        >
          Exportar a Excel
        </Button>
      </Box>
      <Paper sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" component="h2" sx={{ color: 'text.primary' }}>
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
          <StatComparison title="Nóminas Revisadas" currentValue={currentPeriod.payrollsReviewed} previousValue={previousPeriod?.payrollsReviewed || 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatComparison title="Total Horas Overtime" currentValue={currentPeriod.totalOvertime} previousValue={previousPeriod?.totalOvertime || 0} />
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
              <TableHead>
                <TableRow sx={{ '& th': { backgroundColor: 'secondary.main', color: 'common.white' } }}>
                  <TableCell>
                    <TableSortLabel active={sortConfigRoles?.key === 'name'} direction={sortConfigRoles?.direction} onClick={() => requestSortRoles('name')}>Cargo</TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel active={sortConfigRoles?.key === 'value'} direction={sortConfigRoles?.direction} onClick={() => requestSortRoles('value')}>Cantidad</TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedRoles.map((role: any) => (
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
              <TableHead>
                <TableRow sx={{ '& th': { backgroundColor: 'secondary.main', color: 'common.white' } }}>
                  <TableCell><TableSortLabel active={sortConfigCities?.key === 'name'} direction={sortConfigCities?.direction} onClick={() => requestSortCities('name')}>Ciudad</TableSortLabel></TableCell>
                  <TableCell align="right"><TableSortLabel active={sortConfigCities?.key === 'currentVisits'} direction={sortConfigCities?.direction} onClick={() => requestSortCities('currentVisits')}>Visitas (Actual)</TableSortLabel></TableCell>
                  <TableCell align="right"><TableSortLabel active={sortConfigCities?.key === 'previousVisits'} direction={sortConfigCities?.direction} onClick={() => requestSortCities('previousVisits')}>Visitas (Anterior)</TableSortLabel></TableCell>
                  <TableCell align="right"><TableSortLabel active={sortConfigCities?.key === 'change'} direction={sortConfigCities?.direction} onClick={() => requestSortCities('change')}>Cambio</TableSortLabel></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedCities.map((city: any) => {
                  const change = city.currentVisits - city.previousVisits;
                  const ChangeIcon = change > 0 ? ArrowUpward : change < 0 ? ArrowDownward : Remove;
                  const changeColor = change > 0 ? 'success.main' : change < 0 ? 'error.main' : 'text.secondary';
                  return (
                    <TableRow key={city.name}>
                      <TableCell>{city.name}</TableCell>
                      <TableCell align="right">{city.currentVisits}</TableCell>
                      <TableCell align="right">{city.previousVisits}</TableCell>
                      <TableCell align="right" sx={{ color: changeColor, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <ChangeIcon sx={{ fontSize: '1rem', mr: 0.5 }} /> {change}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Section 4: New Tables */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>Empleados por Hotel</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { backgroundColor: 'secondary.main', color: 'common.white' } }}>
                  <TableCell><TableSortLabel active={sortConfigHotels?.key === 'name'} direction={sortConfigHotels?.direction} onClick={() => requestSortHotels('name')}>Hotel</TableSortLabel></TableCell>
                  <TableCell align="right"><TableSortLabel active={sortConfigHotels?.key === 'count'} direction={sortConfigHotels?.direction} onClick={() => requestSortHotels('count')}>Cantidad</TableSortLabel></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedHotels.map((hotel: any) => (
                  <TableRow key={hotel.name}><TableCell>{hotel.name}</TableCell><TableCell align="right">{hotel.count}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>Asistencia por Empleado</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { backgroundColor: 'secondary.main', color: 'common.white' } }}>
                  <TableCell><TableSortLabel active={sortConfigAttendance?.key === 'name'} direction={sortConfigAttendance?.direction} onClick={() => requestSortAttendance('name')}>Empleado</TableSortLabel></TableCell>
                  <TableCell align="right"><TableSortLabel active={sortConfigAttendance?.key === 'value'} direction={sortConfigAttendance?.direction} onClick={() => requestSortAttendance('value')}>Visitas</TableSortLabel></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedAttendance.map((att: any) => (
                  <TableRow key={att.name}><TableCell>{att.name}</TableCell><TableCell align="right">{att.value}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>Nuevos Empleados</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { backgroundColor: 'secondary.main', color: 'common.white' } }}>
                  <TableCell><TableSortLabel active={sortConfigNewEmployees?.key === 'name'} direction={sortConfigNewEmployees?.direction} onClick={() => requestSortNewEmployees('name')}>Nombre</TableSortLabel></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedNewEmployees.map((emp: any) => (
                  <TableRow key={emp.id}><TableCell>{emp.name}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>Empleados en Lista Negra</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { backgroundColor: 'secondary.main', color: 'common.white' } }}>
                  <TableCell><TableSortLabel active={sortConfigBlacklisted?.key === 'name'} direction={sortConfigBlacklisted?.direction} onClick={() => requestSortBlacklisted('name')}>Nombre</TableSortLabel></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedBlacklisted.map((emp: any) => (
                  <TableRow key={emp.id}><TableCell>{emp.name}</TableCell></TableRow>
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
