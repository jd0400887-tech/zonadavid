import { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { 
  Box, Toolbar, Button, Snackbar, Alert, CircularProgress, Typography, 
  Grid, Paper, Stack, Fab, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, ToggleButton, ToggleButtonGroup, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, Avatar, Tooltip 
} from '@mui/material';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { startOfWeek, startOfMonth, endOfWeek, endOfMonth, subMonths, subWeeks } from 'date-fns';

// Iconos
import MyLocationIcon from '@mui/icons-material/MyLocation';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

import { useHotels } from '../hooks/useHotels';
import { useAttendance } from '../hooks/useAttendance';
import { useAuth } from '../hooks/useAuth';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { supabase } from '../utils/supabase';

// Lazy load components
const LazyMapContainer = lazy(() => import('react-leaflet').then(module => ({ default: module.MapContainer })));
const LazyTileLayer = lazy(() => import('react-leaflet').then(module => ({ default: module.TileLayer })));
const LazyMarker = lazy(() => import('react-leaflet').then(module => ({ default: module.Marker })));
const LazyPopup = lazy(() => import('react-leaflet').then(module => ({ default: module.Popup })));

import StatCard from '../components/dashboard/StatCard';
import RecruiterDashboard from '../components/dashboard/RecruiterDashboard';

// Leaflet icon fix
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function DashboardPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [selectedZone, setSelectedZone] = useState<'Todas' | 'Centro' | 'Norte' | 'Noroeste'>('Todas');
  const [qaScore, setQaScore] = useState<number | null>(null);

  // Inicializar zona según el perfil del usuario
  useEffect(() => {
    if (profile?.assigned_zone) {
      setSelectedZone(profile.assigned_zone as any);
    } else if (profile?.role === 'INSPECTOR') {
      setSelectedZone('Centro'); 
    }
  }, [profile]);

  const { hotels } = useHotels();
  const { addRecord } = useAttendance({ start: null, end: null });
  const { stats: globalStats, loading: statsLoading } = useDashboardStats(selectedZone === 'Todas' ? undefined : selectedZone);

  // Cargar promedio de calidad
  useEffect(() => {
    const fetchQaScore = async () => {
      try {
        let query = supabase.from('qa_audits').select('score');
        if (profile?.role === 'INSPECTOR' && profile.assigned_zone) {
          query = query.eq('zone', profile.assigned_zone);
        } else if (selectedZone !== 'Todas') {
          query = query.eq('zone', selectedZone);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const avg = Math.round(data.reduce((acc, curr) => acc + curr.score, 0) / data.length);
          setQaScore(avg);
        } else {
          setQaScore(null);
        }
      } catch (e) {
        console.error("Error al cargar score QA:", e);
      }
    };
    if (profile) fetchQaScore();
  }, [profile, selectedZone]);

  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [snackbarInfo, setSnackbarInfo] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });

  const isAdmin = profile?.role === 'ADMIN';
  const isInspector = profile?.role === 'INSPECTOR';
  const isRecruiter = profile?.role === 'RECRUITER';

  const filteredHotels = hotels.filter(h => selectedZone === 'Todas' || h.zone === selectedZone);
  const hotelsWithLocation = filteredHotels.filter(h => h.latitude != null && h.longitude != null);
  const mapCenter: [number, number] = [25.7617, -80.1918]; // Default center

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      if (!navigator.geolocation) throw new Error("Geolocalización no soportada");
      
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const result = await addRecord(latitude, longitude);
        setSnackbarInfo({ open: true, message: result.message, severity: result.success ? 'success' : 'warning' });
        setIsCheckingIn(false);
      }, (error) => {
        setSnackbarInfo({ open: true, message: "Error de ubicación: " + error.message, severity: 'error' });
        setIsCheckingIn(false);
      });
    } catch (error: any) {
      setSnackbarInfo({ open: true, message: error.message, severity: 'error' });
      setIsCheckingIn(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbarInfo({ ...snackbarInfo, open: false });

  const renderInspectorDashboard = () => {
    // Validación de seguridad para evitar errores mientras cargan las estadísticas
    const safeStats = globalStats || {
      totalHotels: 0,
      activeEmployees: 0,
      pendingApplications: 0
    };

    return (
      <Box sx={{ p: { xs: 1, md: 3 } }}>
        <Box sx={{ mb: 5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', letterSpacing: '-1px' }}>Panel de Inspección</Typography>
          <Typography variant="body1" component="div" color="text.secondary" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
            Control y gestión de la zona <Chip label={selectedZone} size="small" color="primary" sx={{ fontWeight: 'bold' }} />
          </Typography>
        </Box>
        
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper onClick={() => navigate('/hoteles')} sx={{ p: 3, borderRadius: 4, cursor: 'pointer', background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)', border: '1px solid rgba(255, 87, 34, 0.2)', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 8px 25px rgba(255, 87, 34, 0.2)' } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography variant="h3" sx={{ fontWeight: 900, color: 'primary.main' }}>{safeStats.totalHotels}</Typography><Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Hoteles</Typography></Box>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, boxShadow: '0 4px 12px rgba(255, 87, 34, 0.4)' }}><ApartmentIcon fontSize="large" /></Avatar>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper onClick={() => navigate('/empleados')} sx={{ p: 3, borderRadius: 4, cursor: 'pointer', background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)', border: '1px solid rgba(33, 150, 243, 0.2)', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 8px 25px rgba(33, 150, 243, 0.2)' } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography variant="h3" sx={{ fontWeight: 900, color: '#2196F3' }}>{safeStats.activeEmployees}</Typography><Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Personal</Typography></Box>
                <Avatar sx={{ bgcolor: '#2196F3', width: 56, height: 56, boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)' }}><PeopleIcon fontSize="large" /></Avatar>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper onClick={() => navigate('/aplicaciones')} sx={{ p: 3, borderRadius: 4, cursor: 'pointer', background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)', border: '1px solid rgba(76, 175, 80, 0.2)', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 8px 25px rgba(76, 175, 80, 0.2)' } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography variant="h3" sx={{ fontWeight: 900, color: '#4CAF50' }}>{safeStats.pendingApplications}</Typography><Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Aplicaciones</Typography></Box>
                <Avatar sx={{ bgcolor: '#4CAF50', width: 56, height: 56, boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)' }}><PendingActionsIcon fontSize="large" /></Avatar>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper onClick={() => navigate('/calidad')} sx={{ p: 3, borderRadius: 4, cursor: 'pointer', background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)', border: '1px solid rgba(156, 39, 176, 0.2)', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 8px 25px rgba(156, 39, 176, 0.2)' } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography variant="h3" sx={{ fontWeight: 900, color: '#9C27B0' }}>{qaScore !== null ? `${qaScore}%` : '--'}</Typography><Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Calidad QA</Typography></Box>
                <Avatar sx={{ bgcolor: '#9C27B0', width: 56, height: 56, boxShadow: '0 4px 12px rgba(156, 39, 176, 0.4)' }}><VerifiedUserIcon fontSize="large" /></Avatar>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          <Grid item xs={12} md={5}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, px: 1 }}>Acciones Rápidas</Typography>
            <Stack spacing={2}>
              {[
                { label: 'Mis Hoteles', icon: <ApartmentIcon />, color: 'primary', path: '/hoteles', desc: 'Gestionar ubicaciones asignadas' },
                { label: 'Lista de Empleados', icon: <PeopleIcon />, color: 'info', path: '/empleados', desc: 'Ver personal activo en zona' },
                { label: 'Aplicaciones', icon: <PendingActionsIcon />, color: 'success', path: '/aplicaciones', desc: 'Revisar nuevos candidatos' },
                { label: 'Calidad QA', icon: <VerifiedUserIcon />, color: 'secondary', path: '/calidad', desc: 'Realizar auditorías de excelencia' },
                { label: 'Reporte Asistencia', icon: <EventAvailableIcon />, color: 'info', path: '/reporte-asistencia', desc: 'Control de ingresos diarios' }
              ].map((action) => (
                <Button key={action.label} variant="outlined" fullWidth onClick={() => navigate(action.path)} sx={{ justifyContent: 'flex-start', p: 2, borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'primary.main', transform: 'scale(1.02)' }, transition: 'all 0.2s' }}>
                  <Avatar sx={{ bgcolor: `${action.color}.main`, mr: 2, width: 40, height: 40 }}>{action.icon}</Avatar>
                  <Box sx={{ textAlign: 'left' }}><Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', lineHeight: 1 }}>{action.label}</Typography><Typography variant="caption" sx={{ color: 'text.secondary' }}>{action.desc}</Typography></Box>
                </Button>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={7}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, px: 1 }}>Mapa de Operaciones</Typography>
            <Paper sx={{ borderRadius: 4, overflow: 'hidden', height: '400px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              <Box sx={{ height: '100%', width: '100%' }}>
                <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>}>
                  <LazyMapContainer center={mapCenter} zoom={6} style={{ height: '100%', width: '100%' }}>
                    <LazyTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {hotelsWithLocation.map((hotel) => (
                      <LazyMarker key={hotel.id} position={[hotel.latitude!, hotel.longitude!]}>
                        <LazyPopup><Box sx={{ p: 1 }}><Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{hotel.name}</Typography><Typography variant="caption" color="text.secondary">{hotel.address}</Typography></Box></LazyPopup>
                      </LazyMarker>
                    ))}
                  </LazyMapContainer>
                </Suspense>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderAdminDashboard = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>Panel Administrativo</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Hoteles" value={globalStats.totalHotels} icon={<ApartmentIcon />} onClick={() => navigate('/hoteles')} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Personal Activo" value={globalStats.activeEmployees} icon={<PeopleIcon />} onClick={() => navigate('/empleados')} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Aplicaciones" value={globalStats.pendingApplications} icon={<PendingActionsIcon />} onClick={() => navigate('/aplicaciones')} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Calidad QA" value={qaScore !== null ? `${qaScore}%` : '--'} icon={<VerifiedUserIcon />} onClick={() => navigate('/calidad')} /></Grid>
      </Grid>
    </Box>
  );

  return (
    <>
      <Box component="main" sx={{ p: 1 }}>
        {isRecruiter ? (
          <RecruiterDashboard stats={globalStats} selectedZone={selectedZone} onZoneChange={setSelectedZone as any} />
        ) : isInspector ? (
          renderInspectorDashboard()
        ) : (
          renderAdminDashboard()
        )}
      </Box>
      {!isRecruiter && (
        <Fab color="primary" aria-label="registrar asistencia" sx={{ position: 'fixed', bottom: 32, right: 32, background: 'linear-gradient(45deg, #FF5722 30%, #FF8A65 90%)', boxShadow: '0 4px 20px 0 rgba(255, 87, 34, 0.4)', transition: 'all 0.3s ease-in-out', '&:hover': { boxShadow: '0 6px 25px 0 rgba(255, 87, 34, 0.6)', transform: 'scale(1.1) rotate(5deg)' } }} onClick={handleCheckIn} disabled={isCheckingIn}>
          {isCheckingIn ? <CircularProgress color="inherit" size={24} /> : <MyLocationIcon sx={{ fontSize: 28 }} />}
        </Fab>
      )}
      <Snackbar open={snackbarInfo.open} autoHideDuration={6000} onClose={handleCloseSnackbar}><Alert onClose={handleCloseSnackbar} severity={snackbarInfo.severity} sx={{ width: '100%' }}>{snackbarInfo.message}</Alert></Snackbar>
    </>
  );
}

export default DashboardPage;
