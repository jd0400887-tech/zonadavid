import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, Grid, List, ListItem, ListItemText, Chip, 
  IconButton, Snackbar, FormControlLabel, Switch, Avatar, Stack, 
  Divider, Button, Tooltip, CircularProgress, useTheme
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import MapIcon from '@mui/icons-material/Map';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BadgeIcon from '@mui/icons-material/Badge';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useEmployees } from '../hooks/useEmployees';
import type { Employee } from '../types';
import L from 'leaflet';
import { useHotels } from '../hooks/useHotels';
import { useAuth } from '../hooks/useAuth';
import TurnoverAnalysis from '../components/hotel/TurnoverAnalysis';

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

export default function HotelDetailPage() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  
  const { hotels, loading } = useHotels();
  const { employees } = useEmployees();
  const { profile } = useAuth();
  
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [showOnlyPermanent, setShowOnlyPermanent] = useState(false);

  const hotel = hotels.find(h => h.id === hotelId);

  const handleCopyId = () => {
    if (hotel) {
      navigator.clipboard.writeText(hotel.id).then(() => {
        setShowCopySuccess(true);
      });
    }
  };

  const assignedEmployees = employees.filter(emp => emp.hotelId === hotelId);
  
  const displayedEmployees = useMemo(() => {
    return assignedEmployees.filter(employee => {
      if (showOnlyPermanent) return employee.employeeType === 'permanente';
      return true;
    });
  }, [assignedEmployees, showOnlyPermanent]);

  const stats = useMemo(() => ({
    total: assignedEmployees.length,
    active: assignedEmployees.filter(emp => emp.isActive && !emp.isBlacklisted).length,
    inactive: assignedEmployees.filter(emp => !emp.isActive && !emp.isBlacklisted).length,
    blocked: assignedEmployees.filter(emp => emp.isBlacklisted).length
  }), [assignedEmployees]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  if (!hotel) return <Box sx={{ p: 4, textAlign: 'center' }}><Typography variant="h5" color="error">Hotel no encontrado</Typography></Box>;

  const mapCenter: [number, number] | null = hotel.latitude ? [hotel.latitude, hotel.longitude!] : null;

  return (
    <Box sx={{ pb: 5 }}>
      {/* HEADER / BANNER HERO */}
      <Box sx={{ 
        height: 220, 
        width: '100%', 
        position: 'relative', 
        overflow: 'hidden',
        background: hotel.imageUrl 
          ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url(${hotel.imageUrl})`
          : 'linear-gradient(45deg, #1a237e 30%, #FF5722 90%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'flex-end',
        p: { xs: 2, md: 4 },
        mb: 4
      }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/hoteles')}
          sx={{ position: 'absolute', top: 20, left: 20, color: 'white', bgcolor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(5px)', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' } }}
        >
          Volver
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
          <Avatar 
            variant="rounded" 
            sx={{ width: 100, height: 100, bgcolor: 'primary.main', border: '4px solid rgba(255,255,255,0.2)', boxShadow: 10 }}
          >
            <ApartmentIcon sx={{ fontSize: 60 }} />
          </Avatar>
          <Box sx={{ color: 'white', flexGrow: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Chip label={hotel.zone} size="small" sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }} />
              <Chip label={hotel.city} size="small" variant="outlined" sx={{ color: 'white', borderColor: 'white' }} />
            </Stack>
            <Typography variant="h3" sx={{ fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              {hotel.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.8 }}>
              <LocationOnIcon fontSize="small" />
              <Typography variant="body1">{hotel.address}</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, md: 4 } }}>
        {/* TARJETAS DE ESTADÍSTICAS */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { label: 'Total Personal', val: stats.total, color: 'primary.main', icon: <PeopleIcon /> },
            { label: 'Activos', val: stats.active, color: 'success.main', icon: <TrendingUpIcon /> },
            { label: 'Inactivos', val: stats.inactive, color: 'text.secondary', icon: <PeopleIcon /> },
            { label: 'Restringidos', val: stats.blocked, color: 'error.main', icon: <BadgeIcon /> },
          ].map((s) => (
            <Grid item xs={6} md={3} key={s.label}>
              <Paper sx={{ p: 2, borderRadius: 3, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', bgcolor: 'rgba(255,255,255,0.02)' }}>
                <Box sx={{ color: s.color, mb: 1, display: 'flex', justifyContent: 'center' }}>{s.icon}</Box>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>{s.val}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{s.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={4}>
          {/* COLUMNA IZQUIERDA: INFO Y MAPA */}
          <Grid item xs={12} lg={5}>
            <Stack spacing={3}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)', bgcolor: 'rgba(255,255,255,0.02)' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Información Técnica</Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="text.secondary">ID del Sistema:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'rgba(0,0,0,0.2)', px: 1, borderRadius: 1 }}>{hotel.id}</Typography>
                      <IconButton onClick={handleCopyId} size="small" color="primary"><ContentCopyIcon fontSize="inherit" /></IconButton>
                    </Box>
                  </Box>
                  <Divider sx={{ opacity: 0.05 }} />
                  {hotel.latitude && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">Coordenadas:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{hotel.latitude.toFixed(4)}, {hotel.longitude?.toFixed(4)}</Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>

              <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', height: 300 }}>
                {mapCenter ? (
                  <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={mapCenter}>
                      <Popup>{hotel.name}</Popup>
                    </Marker>
                  </MapContainer>
                ) : (
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.1)' }}>
                    <MapIcon sx={{ fontSize: 40, opacity: 0.2, mr: 1 }} />
                    <Typography color="text.secondary">Mapa no disponible</Typography>
                  </Box>
                )}
              </Paper>
            </Stack>
          </Grid>

          {/* COLUMNA DERECHA: TURNOVER Y LISTA */}
          <Grid item xs={12} lg={7}>
            <Stack spacing={3}>
              <Box>
                <TurnoverAnalysis hotelId={hotel.id} />
              </Box>

              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)', bgcolor: 'rgba(255,255,255,0.02)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Personal del Hotel</Typography>
                  <FormControlLabel
                    control={<Switch size="small" checked={showOnlyPermanent} onChange={(e) => setShowOnlyPermanent(e.target.checked)} />}
                    label={<Typography variant="caption" sx={{ fontWeight: 'bold' }}>SÓLO PERMANENTES</Typography>}
                  />
                </Box>

                <List sx={{ px: 0 }}>
                  {displayedEmployees.map(employee => (
                    <ListItem 
                      key={employee.id} 
                      divider 
                      sx={{ 
                        px: 1, 
                        py: 2,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                        borderRadius: 2, mb: 1, border: '1px solid transparent'
                      }}
                    >
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 40, height: 40, fontWeight: 'bold' }}>
                        {employee.name[0]}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{employee.name}</Typography>
                            <Chip 
                              label={employee.isActive ? 'ACTIVO' : 'INACTIVO'} 
                              size="small" 
                              color={employee.isActive ? 'success' : 'default'}
                              sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900 }}
                            />
                            {employee.isBlacklisted && <Chip label="BLOQUEADO" size="small" color="error" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900 }} />}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {employee.role} • {employee.payrollType.toUpperCase()} • ID: {employee.employeeNumber}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                  {displayedEmployees.length === 0 && (
                    <Box sx={{ py: 4, textAlign: 'center', opacity: 0.5 }}>
                      <PeopleIcon sx={{ fontSize: 40, mb: 1 }} />
                      <Typography>No hay personal registrado</Typography>
                    </Box>
                  )}
                </List>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={showCopySuccess}
        autoHideDuration={2000}
        onClose={() => setShowCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Paper sx={{ bgcolor: 'success.main', color: 'white', px: 3, py: 1, borderRadius: 2 }}>
          ID copiado al portapapeles
        </Paper>
      </Snackbar>
    </Box>
  );
}