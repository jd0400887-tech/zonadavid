import { useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Toolbar, TableSortLabel, ListItemText, Accordion, AccordionSummary, AccordionDetails, List } from '@mui/material';
import { ArrowUpward, ArrowDownward, Remove, CloudDownload as CloudDownloadIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useReportData } from '../hooks/useReportData';
import { useSortableData } from '../hooks/useSortableData';
import { exportToExcel } from '../utils/exportToExcel';
import DetailsModal from '../components/informes/DetailsModal';
import OvertimeDetailsTable from '../components/informes/OvertimeDetailsTable';
import { differenceInDays } from 'date-fns';

// A small component to display a stat with its change from the previous period
const StatComparison = ({ title, currentValue, previousValue, onClick }: { title: string, currentValue: number, previousValue: number, onClick?: () => void }) => {
  const change = currentValue - previousValue;
  const ChangeIcon = change > 0 ? ArrowUpward : change < 0 ? ArrowDownward : Remove;
  const changeColor = change > 0 ? 'success.main' : change < 0 ? 'error.main' : 'text.secondary';

  // Format value based on title
  const formatDisplayValue = (value: number) => {
    if (title.includes('Tasa')) {
      return `${value.toFixed(1)}%`;
    }
    if (title.includes('Tiempo Promedio')) {
      return `${value.toFixed(1)} días`;
    }
    return value.toFixed(0);
  };

  const formatChangeValue = (value: number) => {
    if (title.includes('Tasa')) {
      return value.toFixed(1);
    }
    return value.toFixed(0);
  }

  return (
    <Paper sx={{ p: 2, textAlign: 'center', height: '100%', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <Typography variant="h6" color="text.secondary">{title}</Typography>
      <Typography variant="h4" component="p">{formatDisplayValue(currentValue)}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: changeColor }}>
        <ChangeIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
        <Typography variant="body2">
          {formatChangeValue(change)} vs. período anterior ({formatDisplayValue(previousValue)})
        </Typography>
      </Box>
    </Paper>
  );
};

function InformesPage() {
  const location = useLocation();
  const { title, startDate, endDate } = location.state || {};
  const { data, loading, employees, hotels } = useReportData(startDate, endDate);
  const [modalData, setModalData] = useState<{ open: boolean; title: string; content: React.ReactNode }>({ open: false, title: '', content: null });

  const handleOpenModal = (title: string, content: React.ReactNode) => {
    setModalData({ open: true, title, content });
  };

  const handleCloseModal = () => {
    setModalData({ open: false, title: '', content: null });
  };

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

  const { items: sortedNewEmployees, requestSort: requestSortNewEmployees, sortConfig: sortConfigNewEmployees } = useSortableData(data?.currentPeriod?.newEmployeesList || [], { key: 'name', direction: 'asc' });
  const { items: sortedBlacklisted, requestSort: requestSortBlacklisted, sortConfig: sortConfigBlacklisted } = useSortableData(data?.blacklistedEmployeesList || [], { key: 'name', direction: 'asc' });
  const { items: sortedHotelTurnover, requestSort: requestSortHotelTurnover, sortConfig: sortConfigHotelTurnover } = useSortableData(data?.hotelTurnover || [], { key: 'turnoverRate', direction: 'desc' });
  const { items: sortedRequests, requestSort: requestSortRequests, sortConfig: sortConfigRequests } = useSortableData(data?.currentPeriod?.newRequestsList || [], { key: 'created_at', direction: 'desc' });

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
        { 'Métrica': 'Empleados Inactivos', 'Valor': currentPeriod.activeToInactive }, // New export data
        { 'Métrica': 'Nóminas Revisadas', 'Valor': currentPeriod.payrollsReviewed },
        { 'Métrica': 'Total Horas Overtime', 'Valor': currentPeriod.totalOvertime },
        { 'Métrica': 'Nuevas Solicitudes', 'Valor': currentPeriod.newRequests },
        { 'Métrica': 'Tasa de Cumplimiento (%)', 'Valor': currentPeriod.fulfillmentRate.toFixed(1) },
        { 'Métrica': 'Tiempo Promedio de Cobertura (días)', 'Valor': currentPeriod.avgTimeToFill.toFixed(1) },
        { 'Métrica': 'Tasa de No Presentación (%)', 'Valor': currentPeriod.noShowRate.toFixed(1) },
        { 'Métrica': 'Solicitudes Vencidas', 'Valor': currentPeriod.overdueRequests },
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
        {/* General Activity / Visits */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>Actividad General</Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatComparison 
            title="Visitas Registradas" 
            currentValue={currentPeriod.visits} 
            previousValue={previousPeriod?.visits || 0} 
            onClick={() => handleOpenModal(
              "Visitas Registradas", 
              <List>{currentPeriod.visitsList.map((item: any) => {
                const employee = employees.find(e => e.id === item.employeeId);
                const hotel = hotels.find(h => h.id === item.hotelId);
                return <ListItemText key={item.id} primary={`${employee?.name || 'Empleado desconocido'} en ${hotel?.name || 'Hotel desconocido'}`} secondary={new Date(item.timestamp).toLocaleString()} />
              })}</List>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatComparison 
            title="Nuevas Aplicaciones" 
            currentValue={currentPeriod.newApplications} 
            previousValue={previousPeriod?.newApplications || 0} 
            onClick={() => handleOpenModal(
              "Nuevas Aplicaciones", 
              <List>{currentPeriod.newApplicationsList.map((item: any) => {
                const hotel = hotels.find(h => h.id === item.hotel_id);
                return <ListItemText key={item.id} primary={`${item.candidate_name} para ${item.role}`} secondary={`Hotel: ${hotel?.name || 'N/A'} - Fecha: ${new Date(item.created_at).toLocaleDateString()}`} />
              })}</List>
            )}
          />
        </Grid>

        {/* Employee Movement / Status */}
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="h5" gutterBottom>Movimiento de Empleados</Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatComparison 
            title="Nuevos Empleados" 
            currentValue={currentPeriod.newEmployees} 
            previousValue={previousPeriod?.newEmployees || 0} 
            onClick={() => handleOpenModal(
              "Nuevos Empleados", 
              <List>{currentPeriod.newEmployeesList.map((item: any) => {
                const hotel = hotels.find(h => h.id === item.hotelId);
                return <ListItemText key={item.id} primary={`${item.name} - ${hotel?.name || 'Hotel desconocido'}`} />
              })}</List>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatComparison 
            title="Empleados Inactivos" 
            currentValue={currentPeriod.activeToInactive} 
            previousValue={previousPeriod?.activeToInactive || 0} 
            onClick={() => handleOpenModal(
              "Empleados Inactivos", 
              <List>{currentPeriod.activeToInactiveList.map((item: any) => {
                const employee = employees.find(e => e.id === item.employee_id);
                const hotel = hotels.find(h => h.id === employee?.hotelId);
                return <ListItemText key={item.id} primary={`${employee?.name || 'Empleado desconocido'} - ${hotel?.name || 'Hotel desconocido'}`} secondary={`Fecha: ${new Date(item.change_date).toLocaleDateString()}`} />
              })}</List>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%', cursor: 'pointer' }} onClick={() => handleOpenModal(
            "Empleados en Lista Negra", 
            <List>{data.blacklistedEmployeesList.map((item: any) => <ListItemText key={item.id} primary={item.name} />)}</List>
          )}><Typography variant="h6" color="text.secondary">En Lista Negra</Typography><Typography variant="h4">{blacklistedEmployees}</Typography></Paper>
        </Grid>

        {/* Payroll Review */}
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="h5" gutterBottom>Revisión de Nómina</Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatComparison 
            title="Nóminas Revisadas" 
            currentValue={currentPeriod.payrollsReviewed} 
            previousValue={previousPeriod?.payrollsReviewed || 0} 
            onClick={() => handleOpenModal(
              "Nóminas Revisadas", 
              <List>{currentPeriod.payrollsReviewedList.map((item: any) => {
                return <ListItemText key={item.id} primary={item.name} secondary={`Fecha: ${new Date(item.lastReviewedTimestamp).toLocaleDateString()}`} />
              })}</List>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatComparison 
            title="Total Horas Overtime" 
            currentValue={currentPeriod.totalOvertime} 
            previousValue={previousPeriod?.totalOvertime || 0} 
            onClick={() => {
              const details = currentPeriod.overtimeDetails
                .filter((item: any) => item.overtime_hours > 0)
                .sort((a: any, b: any) => b.overtime_hours - a.overtime_hours);
              handleOpenModal(
                "Detalle de Horas Overtime", 
                <OvertimeDetailsTable details={details} employees={employees} hotels={hotels} />
              );
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%', cursor: 'pointer' }} onClick={() => handleOpenModal(
            "Nóminas por Revisar", 
            <List>{data.payrollsToReviewList.map((item: any) => <ListItemText key={item.id} primary={item.name} />)}</List>
          )}><Typography variant="h6" color="text.secondary">Nóminas por Revisar</Typography><Typography variant="h4">{payrollsToReview}</Typography></Paper>
        </Grid>

        {/* Staffing Requests */}
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="h5" gutterBottom>Solicitudes de Personal</Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatComparison 
            title="Nuevas Solicitudes" 
            currentValue={currentPeriod.newRequests} 
            previousValue={previousPeriod?.newRequests || 0} 
            onClick={() => handleOpenModal(
              "Nuevas Solicitudes", 
              <List>{currentPeriod.newRequestsList.map((item: any) => {
                const hotel = hotels.find(h => h.id === item.hotel_id);
                return <ListItemText key={item.id} primary={`${item.role} en ${hotel?.name || 'Hotel desconocido'}`} secondary={`Fecha: ${new Date(item.created_at).toLocaleDateString()}`} />
              })}</List>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>Desglose por Tipo</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', mt: 2 }}>
              <Box>
                <Typography variant="h4">{currentPeriod.temporalRequests}</Typography>
                <Typography variant="body2">Temporales</Typography>
              </Box>
              <Box>
                <Typography variant="h4">{currentPeriod.permanentRequests}</Typography>
                <Typography variant="body2">Permanentes</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatComparison title="Tasa de Cumplimiento" currentValue={currentPeriod.fulfillmentRate} previousValue={previousPeriod?.fulfillmentRate || 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatComparison title="Tiempo Promedio de Cobertura" currentValue={currentPeriod.avgTimeToFill} previousValue={previousPeriod?.avgTimeToFill || 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatComparison title="Tasa de No Presentación" currentValue={currentPeriod.noShowRate} previousValue={previousPeriod?.noShowRate || 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatComparison 
            title="Solicitudes Vencidas" 
            currentValue={currentPeriod.overdueRequests} 
            previousValue={previousPeriod?.overdueRequests || 0} 
            onClick={() => handleOpenModal(
              "Solicitudes Vencidas", 
              <List>{currentPeriod.overdueRequestsList.map((item: any) => {
                const hotel = hotels.find(h => h.id === item.hotel_id);
                return <ListItemText key={item.id} primary={`${item.role} en ${hotel?.name || 'Hotel desconocido'}`} secondary={`Fecha de inicio: ${new Date(item.start_date).toLocaleDateString()}`} />
              })}</List>
            )}
          />
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
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5">Personal Activo por Cargo</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { backgroundColor: 'secondary.main', color: 'common.white' } }}><TableCell><TableSortLabel active={sortConfigRoles?.key === 'name'} direction={sortConfigRoles?.direction} onClick={() => requestSortRoles('name')}>Cargo</TableSortLabel></TableCell><TableCell align="right"><TableSortLabel active={sortConfigRoles?.key === 'value'} direction={sortConfigRoles?.direction} onClick={() => requestSortRoles('value')}>Cantidad</TableSortLabel></TableCell></TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedRoles.map((role: any) => (
                      <TableRow key={role.name}><TableCell>{role.name}</TableCell><TableCell align="right">{role.value}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Grid>
        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5">Visitas por Ciudad</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { backgroundColor: 'secondary.main', color: 'common.white' } }}><TableCell><TableSortLabel active={sortConfigCities?.key === 'name'} direction={sortConfigCities?.direction} onClick={() => requestSortCities('name')}>Ciudad</TableSortLabel></TableCell><TableCell align="right"><TableSortLabel active={sortConfigCities?.key === 'currentVisits'} direction={sortConfigCities?.direction} onClick={() => requestSortCities('currentVisits')}>Visitas (Actual)</TableSortLabel></TableCell><TableCell align="right"><TableSortLabel active={sortConfigCities?.key === 'previousVisits'} direction={sortConfigCities?.direction} onClick={() => requestSortCities('previousVisits')}>Visitas (Anterior)</TableSortLabel></TableCell><TableCell align="right"><TableSortLabel active={sortConfigCities?.key === 'change'} direction={sortConfigCities?.direction} onClick={() => requestSortCities('change')}>Cambio</TableSortLabel></TableCell></TableRow>
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
                          <TableCell align="right" sx={{ color: changeColor, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}><ChangeIcon sx={{ fontSize: '1rem', mr: 0.5 }} /> {change}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* Section 4: New Tables */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5">Empleados por Hotel</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { backgroundColor: 'secondary.main', color: 'common.white' } }}><TableCell><TableSortLabel active={sortConfigHotels?.key === 'name'} direction={sortConfigHotels?.direction} onClick={() => requestSortHotels('name')}>Hotel</TableSortLabel></TableCell><TableCell align="right"><TableSortLabel active={sortConfigHotels?.key === 'count'} direction={sortConfigHotels?.direction} onClick={() => requestSortHotels('count')}>Cantidad</TableSortLabel></TableCell></TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedHotels.map((hotel: any) => (
                      <TableRow key={hotel.name}><TableCell>{hotel.name}</TableCell><TableCell align="right">{hotel.count}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5">Nuevos Empleados</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { backgroundColor: 'secondary.main', color: 'common.white' } }}><TableCell><TableSortLabel active={sortConfigNewEmployees?.key === 'name'} direction={sortConfigNewEmployees?.direction} onClick={() => requestSortNewEmployees('name')}>Nombre</TableSortLabel></TableCell></TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedNewEmployees.map((emp: any) => (
                      <TableRow key={emp.id}><TableCell>{emp.name}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Grid>
        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5">Empleados en Lista Negra</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { backgroundColor: 'secondary.main', color: 'common.white' } }}><TableCell><TableSortLabel active={sortConfigBlacklisted?.key === 'name'} direction={sortConfigBlacklisted?.direction} onClick={() => requestSortBlacklisted('name')}>Nombre</TableSortLabel></TableCell></TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedBlacklisted.map((emp: any) => (
                      <TableRow key={emp.id}><TableCell>{emp.name}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Grid>
        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5">Hoteles con Mayor Rotación</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { backgroundColor: 'secondary.main', color: 'common.white' } }}>
                        <TableCell>
                            <TableSortLabel active={sortConfigHotelTurnover?.key === 'hotelName'} direction={sortConfigHotelTurnover?.direction} onClick={() => requestSortHotelTurnover('hotelName')}>
                                Hotel
                            </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">
                            <TableSortLabel active={sortConfigHotelTurnover?.key === 'turnoverRate'} direction={sortConfigHotelTurnover?.direction} onClick={() => requestSortHotelTurnover('turnoverRate')}>
                                Tasa de Rotación (%)
                            </TableSortLabel>
                        </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedHotelTurnover.map((hotel: any) => (
                      <TableRow key={hotel.hotelId} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenModal(
                        `Detalles de Rotación - ${hotel.hotelName}`,
                        [hotel], // Pass the single hotel object as an array
                        (item: any) => (
                            <Box sx={{p:2}}>
                                <Typography variant="h6">{item.hotelName}</Typography>
                                <Typography>Tasa de rotación: {item.turnoverRate.toFixed(1)}%</Typography>
                                <Typography>Separaciones: {item.separations}</Typography>
                                <Typography>Promedio de empleados: {item.avgEmployees.toFixed(1)}</Typography>
                            </Box>
                        )
                      )}>
                        <TableCell>{hotel.hotelName}</TableCell>
                        <TableCell align="right">{hotel.turnoverRate.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5">Detalle de Solicitudes de Personal</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { backgroundColor: 'secondary.main', color: 'common.white' } }}>
                      <TableCell>
                        <TableSortLabel active={sortConfigRequests?.key === 'hotel'} direction={sortConfigRequests?.direction} onClick={() => requestSortRequests('hotel')}>
                          Hotel
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel active={sortConfigRequests?.key === 'role'} direction={sortConfigRequests?.direction} onClick={() => requestSortRequests('role')}>
                          Cargo
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel active={sortConfigRequests?.key === 'created_at'} direction={sortConfigRequests?.direction} onClick={() => requestSortRequests('created_at')}>
                          Fecha de Solicitud
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel active={sortConfigRequests?.key === 'completed_at'} direction={sortConfigRequests?.direction} onClick={() => requestSortRequests('completed_at')}>
                          Fecha de Cobertura
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel active={sortConfigRequests?.key === 'timeToFill'} direction={sortConfigRequests?.direction} onClick={() => requestSortRequests('timeToFill')}>
                          Tiempo para Cubrir (días)
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel active={sortConfigRequests?.key === 'status'} direction={sortConfigRequests?.direction} onClick={() => requestSortRequests('status')}>
                          Estado
                        </TableSortLabel>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedRequests.map((req: any) => {
                      const hotel = hotels.find(h => h.id === req.hotel_id);
                      const timeToFill = req.completed_at ? differenceInDays(new Date(req.completed_at), new Date(req.created_at)) : null;
                      return (
                        <TableRow key={req.id}>
                          <TableCell>{hotel?.name || 'N/A'}</TableCell>
                          <TableCell>{req.role}</TableCell>
                          <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>{req.completed_at ? new Date(req.completed_at).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>{timeToFill !== null ? timeToFill : 'N/A'}</TableCell>
                          <TableCell>{req.status}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      <DetailsModal 
        open={modalData.open} 
        onClose={handleCloseModal} 
        title={modalData.title}
      >
        {modalData.content}
      </DetailsModal>
    </Box>
  );
}

export default InformesPage;
// refresh