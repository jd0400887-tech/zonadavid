import { useRef } from 'react';
import { TextField, Button, Box, Grid, Typography } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import type { Hotel } from '../../types';

interface HotelFormProps {
  hotelData: Partial<Hotel>;
  onFormChange: (field: keyof Hotel, value: any) => void;
  uploadHotelImage: (file: File, hotelId: string) => Promise<void>;
  isEditMode: boolean;
}

export default function HotelForm({ hotelData, onFormChange, uploadHotelImage, isEditMode }: HotelFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onFormChange('latitude', position.coords.latitude);
          onFormChange('longitude', position.coords.longitude);
        },
        (error) => {
          console.error("Error getting location: ", error);
          alert(`ERROR(${error.code}): ${error.message}`);
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
    <>
      <TextField
        autoFocus
        margin="dense"
        id="name"
        label="Nombre del Hotel"
        type="text"
        fullWidth
        variant="outlined"
        value={hotelData.name || ''}
        onChange={(e) => onFormChange('name', e.target.value)}
        required
      />
      <TextField
        margin="dense"
        id="city"
        label="Ciudad"
        type="text"
        fullWidth
        variant="outlined"
        value={hotelData.city || ''}
        onChange={(e) => onFormChange('city', e.target.value)}
        required
      />
      <TextField
        margin="dense"
        id="address"
        label="Dirección"
        type="text"
        fullWidth
        variant="outlined"
        value={hotelData.address || ''}
        onChange={(e) => onFormChange('address', e.target.value)}
        required
      />

      {isEditMode && (
        <Box sx={{ my: 2 }}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <Button
            variant="outlined"
            startIcon={<AddPhotoAlternateIcon />}
            onClick={handleUploadClick}
          >
            Subir Imagen
          </Button>
        </Box>
      )}

      {hotelData.imageUrl && (
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography variant="caption">Vista Previa:</Typography>
          <img src={hotelData.imageUrl} alt="Vista previa" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '4px', marginTop: '8px' }} />
        </Box>
      )}

      <Box sx={{ my: 2 }}>
        <Button
          variant="outlined"
          startIcon={<MyLocationIcon />}
          onClick={handleGetLocation}
        >
          Obtener Ubicación Actual
        </Button>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            margin="dense"
            id="latitude"
            label="Latitud"
            type="number"
            fullWidth
            variant="outlined"
            value={hotelData.latitude || ''}
            disabled
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            margin="dense"
            id="longitude"
            label="Longitud"
            type="number"
            fullWidth
            variant="outlined"
            value={hotelData.longitude || ''}
            disabled
          />
        </Grid>
      </Grid>
    </>
  );
}