import { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { Box, Toolbar, Button, Snackbar, Alert, CircularProgress, Typography, Grid, Paper, Stack, Fab, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { startOfWeek, startOfMonth, endOfWeek, endOfMonth, subMonths, subWeeks } from 'date-fns';

// Hooks
import { useHotels } from '../hooks/useHotels';
import { useEmployees } from '../hooks/useEmployees';
import { useAttendance } from '../hooks/useAttendance';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useMonthlyGrowthStats } from '../hooks/useMonthlyGrowthStats';

// Components
import StatCard from '../components/dashboard/StatCard';
import RequestsCounter from '../components/dashboard/RequestsCounter';
import ManualAttendance from '../components/archive/ManualAttendance'; // Import the new component
import MonthlyGrowthChart from '../components/dashboard/MonthlyGrowthChart';
import HotelRankingTable from '../components/dashboard/HotelRankingTable';
import DashboardPieChart from '../components/dashboard/DashboardPieChart';
import { DashboardBarChart } from '../components/dashboard/DashboardBarChart';

// Utils
import { getDistanceInMeters, getDistanceInMiles } from '../utils/geolocation';

// Icons
import MyLocationIcon from '@mui/icons-material/MyLocation';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import BlockIcon from '@mui/icons-material/Block';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

// Fix for default marker icon issue with webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const CHECK_IN_RADIUS_METERS = 150;
const CHECK_IN_RADIUS_MILES = CHECK_IN_RADIUS_METERS * 0.000621371; // Convert meters to miles

// Dynamically import MapContainer
const LazyMapContainer = lazy(() => import('react-leaflet').then(module => ({ default: module.MapContainer })));
const LazyTileLayer = lazy(() => import('react-leaflet').then(module => ({ default: module.TileLayer })));
const LazyMarker = lazy(() => import('react-leaflet').then(module => ({ default: module.Marker })));
const LazyPopup = lazy(() => import('react-leaflet').then(module => ({ default: module.Popup })));

function DashboardPage() {
  const navigate = useNavigate();
  const { hotels } = useHotels();
  const { addRecord } = useAttendance({ start: null, end: null });
  
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [snackbarInfo, setSnackbarInfo] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({ open: false, message: '', severity: 'success' });
  const [customReportDialogOpen, setCustomReportDialogOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const stats = useDashboardStats();
  const monthlyGrowthData = useMonthlyGrowthStats();

  const handleGenerateWeeklyReport = () => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 0 });
    const end = endOfWeek(today, { weekStartsOn: 0 });
    navigate('/informes', {
      state: {
        title: 'Reporte Semanal',
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }
    });
  };

  const handleGenerateMonthlyReport = () => {
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    navigate('/informes', {
      state: {
        title: 'Reporte Mensual',
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }
    });
  };

  const handleGenerateSemestralReport = () => {
    const today = new Date();
    let start: Date, end: Date;
    const currentMonth = today.getMonth();

    if (currentMonth < 6) {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 5, 30);
    } else {
      start = new Date(today.getFullYear(), 6, 1);
      end = new Date(today.getFullYear(), 11, 31);
    }
    navigate('/informes', {
      state: {
        title: 'Reporte Semestral',
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }
    });
  };

  useEffect(() => {
    const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
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
      async (position) => {
        const { latitude, longitude } = position.coords;
        let closestHotel: (typeof hotels)[0] | null = null;
        let minDistanceInMiles = Infinity;

        hotels.forEach(hotel => {
          if (hotel.latitude && hotel.longitude) {
            const distanceInMiles = getDistanceInMiles(latitude, longitude, hotel.latitude, hotel.longitude);
            if (distanceInMiles < minDistanceInMiles) {
              minDistanceInMiles = distanceInMiles;
              closestHotel = hotel;
            }
          }
        });

        if (closestHotel) {
          console.log(`Closest hotel: ${closestHotel.name}, Distance: ${minDistanceInMiles.toFixed(2)} miles`);
        }

        if (closestHotel && minDistanceInMiles <= CHECK_IN_RADIUS_MILES) {
          try {
            await addRecord(closestHotel.id);
            setSnackbarInfo({ open: true, message: `Check-in exitoso en: ${closestHotel.name}`, severity: 'success' });
          } catch (error: any) {
            setSnackbarInfo({ open: true, message: error.message, severity: 'error' });
          }
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
          <RequestsCounter />
          <ManualAttendance />
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4} md={2}><StatCard title="Hoteles Totales" value={stats.totalHotels} icon={<ApartmentIcon />} onClick={() => navigate('/hoteles')} /></Grid>
            <Grid item xs={12} sm={4} md={2}><StatCard title="Empleados Activos" value={stats.activeEmployees} icon={<PeopleIcon />} onClick={() => navigate('/empleados')} /></Grid>
            <Grid item xs={12} sm={4} md={2}><StatCard title="Docs Incompletos" value={stats.incompleteDocsCount} icon={<FactCheckIcon />} onClick={() => navigate('/empleados?documentation=incomplete')} /></Grid>
            <Grid item xs={12} sm={4} md={2}><StatCard title="Aplicaciones Pendientes" value={stats.pendingApplications} icon={<PendingActionsIcon />} onClick={() => navigate('/aplicaciones')} /></Grid>
            <Grid item xs={12} sm={4} md={2}><StatCard title="Nóminas por Revisar" value={stats.payrollsToReview} icon={<FactCheckIcon />} onClick={() => navigate('/revision-nomina')} /></Grid>
            <Grid item xs={12} sm={4} md={2}><StatCard title="En Lista Negra" value={stats.blacklistedEmployees} icon={<BlockIcon />} onClick={() => navigate('/empleados')} /></Grid>
          </Grid>

          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Button variant="contained" onClick={handleGenerateWeeklyReport}>Generar Reporte Semanal</Button>
            <Button variant="contained" onClick={handleGenerateMonthlyReport}>Generar Reporte Mensual</Button>
            <Button variant="contained" onClick={handleGenerateSemestralReport}>Generar Reporte Semestral</Button>
            <Button variant="contained" onClick={() => setCustomReportDialogOpen(true)}>Generar Reporte Personalizado</Button>
            <Button 
                variant="contained" 
                color="secondary"
                startIcon={<AutoAwesomeIcon />}
                onClick={() => navigate('/reporte-corporativo')}
                sx={{ 
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                }}
            >
                Análisis Inteligente
            </Button>
          </Stack>

          <Dialog open={customReportDialogOpen} onClose={() => setCustomReportDialogOpen(false)}>
            <DialogTitle>Generar Reporte Personalizado</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                id="startDate"
                label="Fecha de Inicio"
                type="date"
                fullWidth
                variant="standard"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                margin="dense"
                id="endDate"
                label="Fecha de Fin"
                type="date"
                fullWidth
                variant="standard"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCustomReportDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => {
                if (customStartDate && customEndDate) {
                  navigate('/informes', {
                    state: {
                      title: 'Reporte Personalizado',
                      startDate: new Date(customStartDate).toISOString(),
                      endDate: new Date(customEndDate).toISOString()
                    }
                  });
                  setCustomReportDialogOpen(false);
                }
              }}>Generar</Button>
            </DialogActions>
          </Dialog>

          <Box sx={{ mb: 3 }}><MonthlyGrowthChart data={monthlyGrowthData} /></Box>

          <Grid container spacing={3} columns={12} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}><DashboardBarChart title="Visitas por Ciudad" data={stats.visitsByCity} /></Grid>
            <Grid item xs={12} md={6}><DashboardPieChart title="Personal por Posición" data={stats.activeEmployeesByRole} /></Grid>
          </Grid>

          <Box sx={{ mb: 3 }}><DashboardBarChart title="Distribución de Empleados por Hotel" data={stats.employeesByHotel} /></Box>

          <Box sx={{ mb: 3 }}><HotelRankingTable data={stats.hotelRankingByVisits} /></Box>

          <Paper sx={{ height: '60vh', overflow: 'hidden' }}><Typography variant="h6" sx={{ p: 2, pb: 0 }}>Mapa de Hoteles</Typography><Suspense fallback={<Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /><Typography sx={{ ml: 2 }}>Cargando mapa...</Typography></Box>}><LazyMapContainer center={mapCenter} zoom={4} style={{ height: '100%', width: '100%' }}><LazyTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{hotelsWithLocation.map((hotel) => (<LazyMarker key={hotel.id} position={[hotel.latitude!, hotel.longitude!]}><LazyPopup><b>{hotel.name}</b><br />{hotel.address}</LazyPopup></LazyMarker>))}</LazyMapContainer></Suspense></Paper>
        </Box>
        <Fab color="primary" aria-label="registrar asistencia" sx={{ position: 'fixed', bottom: 32, right: 32, transition: 'box-shadow 0.3s ease-in-out', '&:hover': { boxShadow: `0 0 12px 3px #FF5722`, } }} onClick={handleCheckIn} disabled={isCheckingIn}>{isCheckingIn ? <CircularProgress color="inherit" size={24} /> : <MyLocationIcon />}</Fab>
        <Snackbar open={snackbarInfo.open} autoHideDuration={6000} onClose={handleCloseSnackbar}><Alert onClose={handleCloseSnackbar} severity={snackbarInfo.severity} sx={{ width: '100%' }}>{snackbarInfo.message}</Alert></Snackbar>
      </Box>
    </>
  );
}
export default DashboardPage;