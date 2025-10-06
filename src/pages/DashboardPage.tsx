import { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { Box, Toolbar, Button, Snackbar, Alert, CircularProgress, Typography, Grid, Paper, Stack, Fab } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { useNavigate } from 'react-router-dom';

import { startOfWeek, startOfMonth, endOfWeek, endOfMonth, subMonths } from 'date-fns';

// Hooks
import { useHotels } from '../hooks/useHotels';
import { useEmployees } from '../hooks/useEmployees';
import { useAttendance } from '../hooks/useAttendance';

// Components
import StatCard from '../components/dashboard/StatCard';

import VisitsOverTimeChart from '../components/dashboard/VisitsOverTimeChart';
import HotelRankingTable from '../components/dashboard/HotelRankingTable';
import DashboardPieChart from '../components/dashboard/DashboardPieChart';
import { DashboardBarChart } from '../components/dashboard/DashboardBarChart';

// Utils
import { getDistanceInMeters } from '../utils/geolocation';
import { generateReportPDF } from '../utils/reportUtils';
import { getPeriodStats } from '../utils/getPeriodStats';

// Icons
import MyLocationIcon from '@mui/icons-material/MyLocation';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import BlockIcon from '@mui/icons-material/Block';

// Fix for default marker icon issue with webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const CHECK_IN_RADIUS_METERS = 150;

// Dynamically import MapContainer
const LazyMapContainer = lazy(() => import('react-leaflet').then(module => ({
  default: module.MapContainer,
})));
const LazyTileLayer = lazy(() => import('react-leaflet').then(module => ({
  default: module.TileLayer,
})));
const LazyMarker = lazy(() => import('react-leaflet').then(module => ({
  default: module.Marker,
})));
const LazyPopup = lazy(() => import('react-leaflet').then(module => ({
  default: module.Popup,
})));

// A small custom hook inside the component to organize statistics calculation
function useDashboardStats() {
  const { employees } = useEmployees();
  const { hotels } = useHotels();
  const { allRecords: allAttendanceRecords } = useAttendance({ start: null, end: null }); // Fetch all records for stats

  const stats = useMemo(() => {
    const today = new Date();
    const startOfWeekTime = startOfWeek(today, { weekStartsOn: 1 }).getTime();
    const startOfMonthTime = startOfMonth(today).getTime();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const activeEmployeesList = employees.filter(e => e.isActive);
    const visitsThisWeek = allAttendanceRecords.filter(r => r.timestamp >= startOfWeekTime).length;
    const visitsThisMonth = allAttendanceRecords.filter(r => r.timestamp >= startOfMonthTime).length;

    // Original: Hotels by City
    const hotelsByCityMap = hotels.reduce((acc, hotel) => {
      acc[hotel.city] = (acc[hotel.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const hotelsByCity = Object.entries(hotelsByCityMap).map(([city, count]) => ({ city, count }));

    // Helper map for hotelId -> city
    const hotelCityMap = new Map(hotels.map(h => [h.id, h.city]));

    // 2. Active Personnel by Role
    const activeEmployeesByRole = activeEmployeesList.reduce((acc, employee) => {
      const role = employee.role || 'Sin Cargo';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 3. Visits by City
    const visitsByCity = allAttendanceRecords.reduce((acc, record) => {
      const city = hotelCityMap.get(record.hotelId) || 'Sin Ciudad';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 4. Hotel Ranking by Visits
    const visitsByHotel = allAttendanceRecords.reduce((acc, record) => {
      acc[record.hotelId] = (acc[record.hotelId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const hotelRankingByVisits = hotels.map(hotel => ({
      id: hotel.id,
      name: hotel.name,
      visits: visitsByHotel[hotel.id] || 0,
    })).sort((a, b) => b.visits - a.visits);

    // 5. Visits Over Time (last 30 days)
    const visitsOverTime = allAttendanceRecords
      .filter(r => r.timestamp >= thirtyDaysAgo.getTime())
      .reduce((acc, record) => {
        const date = new Date(record.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    const visitsOverTimeChartData = Object.entries(visitsOverTime)
      .map(([date, visits]: [string, number]) => ({ date, visits }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    const newEmployeesLastMonth = employees.filter(e => {
      const idTimestamp = parseInt(e.id.split('-')[1]);
      return !isNaN(idTimestamp) && idTimestamp >= oneMonthAgo.getTime();
    }).length;

    const payrollsToReview = employees.filter(emp => 
      emp.payrollType === 'Workrecord' && 
      (!emp.lastReviewedTimestamp || emp.lastReviewedTimestamp < startOfWeekTime)
    ).length;

    const payrollsReviewedInPeriod = employees.filter(emp =>
      emp.payrollType === 'Workrecord' &&
      emp.lastReviewedTimestamp &&
      emp.lastReviewedTimestamp >= startOfWeekTime
    ).length;

    const blacklistedEmployees = employees.filter(e => e.isBlacklisted).length;

    const employeesByHotel = employees.reduce((acc, employee) => {
      const hotelName = hotels.find(h => h.id === employee.hotelId)?.name || 'Sin Hotel';
      acc[hotelName] = (acc[hotelName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalHotels: hotels.length,
      activeEmployees: activeEmployeesList.length,
      visitsThisWeek,
      visitsThisMonth,
      hotelsByCity, // Keep original
      // New stats (formatted for charts)
      activeEmployeesByRole: Object.entries(activeEmployeesByRole).map(([name, value]: [string, number]) => ({ name, value })),
      visitsByCity: Object.entries(visitsByCity).map(([name, value]: [string, number]) => ({ name, value })),
      hotelRankingByVisits,
      visitsOverTime: visitsOverTimeChartData,
      newEmployeesLastMonth,
      payrollsToReview,
      payrollsReviewedInPeriod,
      blacklistedEmployees,
      employeesByHotel: Object.entries(employeesByHotel).map(([name, value]: [string, number]) => ({ name, value })),
    };
  }, [employees, hotels, allRecords]);

  return stats;
}

function DashboardPage() {
  const navigate = useNavigate();
  const { hotels } = useHotels();
  const { addRecord } = useAttendance({ start: null, end: null });
  
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [snackbarInfo, setSnackbarInfo] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({ open: false, message: '', severity: 'success' });

  const stats = useDashboardStats();

  const { employees } = useEmployees();
  const { hotels: allHotels } = useHotels();
  const { allRecords: allAttendanceRecords } = useAttendance({ start: null, end: null });

  const handleGenerateWeeklyReport = () => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
    const end = endOfWeek(today, { weekStartsOn: 0 }); // Saturday

    // Calculate previous week
    const prevWeekEnd = subMonths(start, 1); // Go back one week from current start
    const prevWeekStart = startOfWeek(prevWeekEnd, { weekStartsOn: 0 });

    const weeklyStats = getPeriodStats(employees, allHotels, allAttendanceRecords, start, end);
    const prevWeeklyStats = getPeriodStats(employees, allHotels, allAttendanceRecords, prevWeekStart, prevWeekEnd);
    generateReportPDF(weeklyStats, 'weekly', start, end, prevWeeklyStats);
  };

  const handleGenerateMonthlyReport = () => {
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);

    // Calculate previous month
    const prevMonthEnd = subMonths(start, 1); // Go back one month from current start
    const prevMonthStart = startOfMonth(prevMonthEnd);

    const monthlyStats = getPeriodStats(employees, allHotels, allAttendanceRecords, start, end);
    const prevMonthlyStats = getPeriodStats(employees, allHotels, allAttendanceRecords, prevMonthStart, prevMonthEnd);
    generateReportPDF(monthlyStats, 'monthly', start, end, prevMonthlyStats);
  };

  const handleGenerateSemestralReport = () => {
    const today = new Date();
    let start: Date;
    let end: Date;
    let prevStart: Date;
    let prevEnd: Date;

    const currentMonth = today.getMonth(); // 0-indexed

    if (currentMonth >= 0 && currentMonth <= 5) { // First semester (Jan-Jun)
      start = new Date(today.getFullYear(), 0, 1); // Jan 1st
      end = new Date(today.getFullYear(), 5, 30); // Jun 30th

      prevStart = new Date(today.getFullYear() - 1, 6, 1); // July 1st of previous year
      prevEnd = new Date(today.getFullYear() - 1, 11, 31); // Dec 31st of previous year
    } else { // Second semester (Jul-Dec)
      start = new Date(today.getFullYear(), 6, 1); // July 1st
      end = new Date(today.getFullYear(), 11, 31); // Dec 31st

      prevStart = new Date(today.getFullYear(), 0, 1); // Jan 1st of current year
      prevEnd = new Date(today.getFullYear(), 5, 30); // Jun 30th of current year
    }

    const semestralStats = getPeriodStats(employees, allHotels, allAttendanceRecords, start, end);
    const prevSemestralStats = getPeriodStats(employees, allHotels, allAttendanceRecords, prevStart, prevEnd);
    generateReportPDF(semestralStats, 'semestral', start, end, prevSemestralStats);
  };

  useEffect(() => {
    const DefaultIcon = L.icon({
      iconUrl: icon,
      shadowUrl: iconShadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });
    L.Marker.prototype.options.icon = DefaultIcon;
  }, []);

  const handleCheckIn = () => {
    setIsCheckingIn(true);
    if (!navigator.geolocation) {
      setSnackbarInfo({ open: true, message: 'La geolocalización no es soportada por este navegador.', severity: 'error' });
      setIsCheckingIn(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        let closestHotel: (typeof hotels)[0] | null = null;
        let minDistance = Infinity;

        hotels.forEach(hotel => {
          if (hotel.latitude && hotel.longitude) {
            const distance = getDistanceInMeters(latitude, longitude, hotel.latitude, hotel.longitude);
            if (distance < minDistance) {
              minDistance = distance;
              closestHotel = hotel;
            }
          }
        });

        if (closestHotel && minDistance <= CHECK_IN_RADIUS_METERS) {
          addRecord(closestHotel.id);
          setSnackbarInfo({ open: true, message: `Check-in exitoso en: ${closestHotel.name}`, severity: 'success' });
        } else {
          setSnackbarInfo({ open: true, message: 'No se encontró ningún hotel cercano. Acércate más para registrar la asistencia.', severity: 'error' });
        }
        setIsCheckingIn(false);
      },
      (error) => {
        setSnackbarInfo({ open: true, message: `Error al obtener ubicación: ${error.message}`, severity: 'error' });
        setIsCheckingIn(false);
      }
    );
  };

  const handleCloseSnackbar = () => {
    setSnackbarInfo(prev => ({ ...prev, open: false }));
  };

  const hotelsWithLocation = hotels.filter(h => h.latitude != null && h.longitude != null);
  const mapCenter: [number, number] = hotelsWithLocation.length > 0 ? [hotelsWithLocation[0].latitude!, hotelsWithLocation[0].longitude!] : [40.7128, -74.0060];

  return (
    <>
      <Box>
        <Toolbar />
        <Box component="main" sx={{ p: 3 }}>
          <Grid container spacing={3} columns={12} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4} md={2}>
              <StatCard title="Hoteles Totales" value={stats.totalHotels} icon={<ApartmentIcon />} onClick={() => navigate('/hoteles')} />
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <StatCard title="Empleados Activos" value={stats.activeEmployees} icon={<PeopleIcon />} onClick={() => navigate('/empleados')} />
            </Grid>
            <Grid xs={12} sm={4} md={2}>
            </Grid>
                      <Grid item xs={12} sm={4} md={2}>
                        <StatCard title="Nóminas Revisadas" value={stats.payrollsReviewedInPeriod} icon={<FactCheckIcon />} onClick={() => navigate('/revision-nomina')} />
                      </Grid>            <Grid xs={12} sm={4} md={2}>
              <StatCard title="Visitas (Semana)" value={stats.visitsThisWeek} icon={<EventAvailableIcon />} onClick={() => navigate('/reporte-asistencia')} />
            </Grid>
            <Grid xs={12} sm={4} md={2}>
              <StatCard title="Visitas (Mes)" value={stats.visitsThisMonth} icon={<EventAvailableIcon />} onClick={() => navigate('/reporte-asistencia')} />
            </Grid>
            <Grid xs={12} sm={4} md={2}>
              <StatCard title="En Lista Negra" value={stats.blacklistedEmployees} icon={<BlockIcon />} onClick={() => navigate('/empleados')} />
            </Grid>
          </Grid>

          {/* Report Generation Buttons */}
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Button variant="contained" onClick={handleGenerateWeeklyReport}>Generar Reporte Semanal</Button>
            <Button variant="contained" onClick={handleGenerateMonthlyReport}>Generar Reporte Mensual</Button>
            <Button variant="contained" onClick={handleGenerateSemestralReport}>Generar Reporte Semestral</Button>
          </Stack>

          {/* Row 2: Visits Over Time (Full Width) */}
          <Box sx={{ mb: 3 }}>
            <VisitsOverTimeChart data={stats.visitsOverTime} />
          </Box>

          {/* Row 3: Charts */}
          <Grid container spacing={3} columns={12} sx={{ mb: 3 }}>
            <Grid xs={12} md={6}>
              <DashboardBarChart title="Visitas por Ciudad" data={stats.visitsByCity} />
            </Grid>
            <Grid xs={12} md={6}>
              <DashboardPieChart title="Personal por Posición" data={stats.activeEmployeesByRole} />
            </Grid>
          </Grid>

          {/* Row 4: Employee Distribution */}
          <Box sx={{ mb: 3 }}>
            <DashboardBarChart title="Distribución de Empleados por Hotel" data={stats.employeesByHotel} />
          </Box>

          {/* Row 5: Ranking Table (Full Width) */}
          <Box sx={{ mb: 3 }}>
            <HotelRankingTable data={stats.hotelRankingByVisits} />
          </Box>

          {/* Row 6: Map (Full Width) */}
          <Paper sx={{ height: '60vh', overflow: 'hidden' }}>
            <Typography variant="h6" sx={{ p: 2, pb: 0 }}>Mapa de Hoteles</Typography>
            <Suspense fallback={
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress /><Typography sx={{ ml: 2 }}>Cargando mapa...</Typography>
              </Box>
            }>
              <LazyMapContainer center={mapCenter} zoom={4} style={{ height: '100%', width: '100%' }}>
                <LazyTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {hotelsWithLocation.map((hotel) => (
                  <LazyMarker key={hotel.id} position={[hotel.latitude!, hotel.longitude!]}><LazyPopup><b>{hotel.name}</b><br />{hotel.address}</LazyPopup></LazyMarker>
                ))}
              </LazyMapContainer>
            </Suspense>
          </Paper>
        </Box>
        <Fab
          color="primary"
          aria-label="registrar asistencia"
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            transition: 'box-shadow 0.3s ease-in-out',
            '&:hover': {
              boxShadow: `0 0 12px 3px #FF5722`,
            }
          }}
          onClick={handleCheckIn}
          disabled={isCheckingIn}
        >
          {isCheckingIn ? <CircularProgress color="inherit" size={24} /> : <MyLocationIcon />}
        </Fab>
        <Snackbar open={snackbarInfo.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbarInfo.severity} sx={{ width: '100%' }}>
            {snackbarInfo.message}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
}
export default DashboardPage;