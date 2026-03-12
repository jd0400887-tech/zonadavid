import { useRef } from 'react';
import { 
  TextField, Button, Box, Grid, Typography, FormControl, InputLabel, 
  Select, MenuItem, InputAdornment, Stack, Divider, Avatar, Paper, useTheme, IconButton 
} from '@mui/material';

// Iconos
import MyLocationIcon from '@mui/icons-material/MyLocation';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import MapIcon from '@mui/icons-material/Map';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

import { useAuth } from '../../hooks/useAuth';
import type { Hotel } from '../../types';

interface HotelFormProps {
  hotelData: Partial<Hotel>;
  onFormChange: (field: keyof Hotel, value: any) => void;
  uploadHotelImage: (file: File, hotelId: string) => Promise<void>;
  isEditMode: boolean;
}

export default function HotelForm({ hotelData, onFormChange, uploadHotelImage, isEditMode }: HotelFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile } = useAuth();
  const theme = useTheme();
  
  const isInspector = profile?.role === 'INSPECTOR';

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onFormChange('latitude', position.coords.latitude);
          onFormChange('longitude', position.coords.longitude);
        },
        (error) => {
          console.error("Error getting location: ", error);
          alert(`Error al obtener ubicación: ${error.message}`);
        }
      );
    } else {
      alert("La geolocalización no es soportada por este navegador.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && hotelData.id) {
      uploadHotelImage(file, hotelData.id);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Grid container spacing={3}>
        {/* --- SECCIÓN 1: DATOS GENERALES --- */}
        <Grid item xs={12}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <ApartmentIcon fontSize="small" />
            </Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Identificación y Ubicación
            </Typography>
          </Stack>
          <Divider sx={{ mt: 1, mb: 2, opacity: 0.1 }} />
        </Grid>

        <Grid item xs={12} sm={8}>
          <TextField
            autoFocus
            label="Nombre del Hotel"
            fullWidth
            variant="outlined"
            size="small"
            value={hotelData.name || ''}
            onChange={(e) => onFormChange('name', e.target.value)}
            required
            InputProps={{
              startAdornment: <InputAdornment position="start"><ApartmentIcon color="primary" fontSize="small" /></InputAdornment>,
              sx: { borderRadius: 2 }
            }}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small" required>
            <InputLabel>Zona Asignada</InputLabel>
            <Select
              value={hotelData.zone || 'Centro'}
              label="Zona Asignada"
              onChange={(e) => onFormChange('zone', e.target.value)}
              disabled={isInspector} // SEGURIDAD: Inspector no puede mover hoteles de zona
              startAdornment={<InputAdornment position="start"><MapIcon color="primary" fontSize="small" /></InputAdornment>}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="Centro">Centro</MenuItem>
              <MenuItem value="Norte">Norte</MenuItem>
              <MenuItem value="Noroeste">Noroeste</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Ciudad"
            fullWidth
            variant="outlined"
            size="small"
            value={hotelData.city || ''}
            onChange={(e) => onFormChange('city', e.target.value)}
            required
            InputProps={{
              startAdornment: <InputAdornment position="start"><LocationCityIcon color="primary" fontSize="small" /></InputAdornment>,
              sx: { borderRadius: 2 }
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Dirección"
            fullWidth
            variant="outlined"
            size="small"
            value={hotelData.address || ''}
            onChange={(e) => onFormChange('address', e.target.value)}
            required
            InputProps={{
              startAdornment: <InputAdornment position="start"><LocationOnIcon color="primary" fontSize="small" /></InputAdornment>,
              sx: { borderRadius: 2 }
            }}
          />
        </Grid>

        {/* --- SECCIÓN 2: MULTIMEDIA Y GEOPOSICIÓN --- */}
        <Grid item xs={12} sx={{ mt: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <PhotoCameraIcon fontSize="small" />
            </Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Multimedia y Posicionamiento
            </Typography>
          </Stack>
          <Divider sx={{ mt: 1, mb: 2, opacity: 0.1 }} />
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {hotelData.imageUrl ? (
              <Box sx={{ position: 'relative' }}>
                <img 
                  src={hotelData.imageUrl} 
                  alt="Vista previa" 
                  style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '12px' }} 
                />
                {isEditMode && (
                  <IconButton 
                    onClick={handleUploadClick}
                    sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                  >
                    <AddPhotoAlternateIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ) : (
              <Box sx={{ py: 3 }}>
                <PhotoCameraIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="caption" display="block" color="text.secondary">Sin imagen de portada</Typography>
                {isEditMode && (
                  <Button size="small" variant="outlined" sx={{ mt: 1, borderRadius: 2 }} onClick={handleUploadClick}>
                    Subir Foto
                  </Button>
                )}
              </Box>
            )}
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            <Button
              variant="contained"
              startIcon={<MyLocationIcon />}
              onClick={handleGetLocation}
              fullWidth
              sx={{ 
                borderRadius: 2, py: 1, fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(255, 87, 34, 0.2)',
                background: 'linear-gradient(45deg, #FF5722 30%, #FF8A65 90%)',
              }}
            >
              Capturar Mi Ubicación
            </Button>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Latitud"
                  fullWidth
                  size="small"
                  value={hotelData.latitude || ''}
                  disabled
                  InputProps={{ sx: { borderRadius: 2, bgcolor: 'rgba(0,0,0,0.05)' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Longitud"
                  fullWidth
                  size="small"
                  value={hotelData.longitude || ''}
                  disabled
                  InputProps={{ sx: { borderRadius: 2, bgcolor: 'rgba(0,0,0,0.05)' } }}
                />
              </Grid>
            </Grid>
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              * Se recomienda estar físicamente en el hotel para capturar las coordenadas exactas.
            </Typography>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}