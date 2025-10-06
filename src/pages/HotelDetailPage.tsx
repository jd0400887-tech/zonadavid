import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { Box, Typography, Toolbar, Paper, Grid, List, ListItem, ListItemText, Chip, IconButton, Snackbar } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import useLocalStorage from '../hooks/useLocalStorage';
import { initialEmployees } from '../data/initialData';
import type { Employee } from '../types';
import L from 'leaflet';
import { useHotels } from '../hooks/useHotels';
import type { Hotel } from '../types';

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
  const { hotels, loading } = useHotels();
  const [employees] = useLocalStorage<Employee[]>('employees', initialEmployees);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const hotel = hotels.find(h => h.id === hotelId);

  const handleCopyId = () => {
    if (hotel) {
      navigator.clipboard.writeText(hotel.id).then(() => {
        setShowCopySuccess(true);
      });
    }
  };
  const assignedEmployees = employees.filter(emp => emp.hotelId === hotelId);

  if (loading) {
    return (
      <Box>
        <Toolbar />
        <Box component="main" sx={{ p: 3 }}>
          <Typography variant="h4">Cargando hotel...</Typography>
        </Box>
      </Box>
    );
  }

  if (!hotel) {
    return (
      <Box>
        <Toolbar />
        <Box component="main" sx={{ p: 3 }}>
          <Typography variant="h4" color="error">Hotel no encontrado</Typography>
        </Box>
      </Box>
    );
  }

  const mapCenter: [number, number] | null = hotel.latitude ? [hotel.latitude, hotel.longitude!] : null;

  return (
    <Box>
      <Toolbar />
      <Box component="main" sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>{hotel.name}</Typography>
        
        <Grid container spacing={3} columns={12} sx={{ mb: 3 }}>
          <Grid grid={{ xs: 12, sm: 6 }}>
            <Paper sx={{ p: 2, height: '100%' }}>
              {hotel.imageUrl && (
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={hotel.imageUrl}
                    alt={`Imagen de ${hotel.name}`}
                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                </Box>
              )}
              <Typography variant="h6">Detalles</Typography>
              <Typography variant="body1"><strong>Ciudad:</strong> {hotel.city}</Typography>
              <Typography variant="body1"><strong>Dirección:</strong> {hotel.address}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="body1" component="span" sx={{ mr: 1 }}>
                  <strong>ID:</strong> <code>{hotel.id}</code>
                </Typography>
                <IconButton onClick={handleCopyId} size="small">
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Box>
              {hotel.latitude && (
                <Typography variant="body1" sx={{ mt: 1 }}>
                  <strong>Coordenadas:</strong> {hotel.latitude.toFixed(4)}, {hotel.longitude?.toFixed(4)}</Typography>
              )}
            </Paper>
          </Grid>
          <Grid grid={{ xs: 12, sm: 6 }}>
            {mapCenter ? (
              <Box sx={{ height: 250, borderRadius: 1, overflow: 'hidden' }}>
                <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={mapCenter}>
                    <Popup>{hotel.name}</Popup>
                  </Marker>
                </MapContainer>
              </Box>
            ) : (
              <Paper sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <Typography color="text.secondary">Ubicación no disponible para este hotel.</Typography>
              </Paper>
            )}
          </Grid>
        </Grid>

        <Paper>
          <Typography variant="h6" sx={{ p: 2 }}>Empleados en este Hotel ({assignedEmployees.length})</Typography>
          <List>
            {assignedEmployees.map(employee => (
              <ListItem key={employee.id} divider>
                <ListItemText
                  primary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                      {employee.name}
                      <Chip
                        label={employee.isActive ? 'Activo' : 'Inactivo'}
                        color={employee.isActive ? 'success' : 'error'}
                        size="small"
                        sx={{ ml: 2 }}
                      />
                      {employee.isBlacklisted && (
                        <Chip
                          label="En Lista Negra"
                          color="default"
                          size="small"
                          sx={{ ml: 1, bgcolor: 'black', color: 'white' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={`Nº: ${employee.employeeNumber} | Cargo: ${employee.role} | Nómina: ${employee.payrollType}`}
                />
              </ListItem>
            ))}
            {assignedEmployees.length === 0 && (
               <ListItem>
                <ListItemText primary="No hay empleados asignados a este hotel." />
              </ListItem>
            )}
          </List>
        </Paper>
      </Box>
      <Snackbar
        open={showCopySuccess}
        autoHideDuration={2000}
        onClose={() => setShowCopySuccess(false)}
        message="ID copiado al portapapeles"
      />
    </Box>
  );
}