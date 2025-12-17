
import { Button, Box, Typography, Alert, Select, MenuItem, FormControl, InputLabel, TextField, CircularProgress } from '@mui/material';
import { useState } from 'react';
import { useAttendance } from '../../hooks/useAttendance';
import { useHotels } from '../../hooks/useHotels';
import type { Hotel } from '../../types';

// This flag can be used to show/hide the component
const SHOW_MANUAL_ATTENDANCE = false;

export default function ManualAttendance() {
  const { hotels, loading: hotelsLoading } = useHotels(); // Get loading state
  const { addRecord } = useAttendance({ start: null, end: null });

  const [selectedHotel, setSelectedHotel] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{severity: 'success' | 'error', message: string} | null>(null);

  const handleManualCheckIn = async () => {
    setLoading(true);
    setResult(null);

    if (!selectedHotel) {
      setResult({ severity: 'error', message: 'Por favor, selecciona un hotel.' });
      setLoading(false);
      return;
    }
    if (!selectedDate) {
      setResult({ severity: 'error', message: 'Por favor, selecciona una fecha.' });
      setLoading(false);
      return;
    }

    try {
      // The addRecord function needs a hotelId and a timestamp.
      // We'll use the selected date and set the time to the current time.
      const timestamp = new Date(selectedDate);
      timestamp.setHours(new Date().getHours());
      timestamp.setMinutes(new Date().getMinutes());
      timestamp.setSeconds(new Date().getSeconds());

      await addRecord(selectedHotel, timestamp);
      const hotelName = hotels.find(h => h.id === selectedHotel)?.name || '';
      setResult({ severity: 'success', message: `¡Éxito! Se ha añadido el registro de asistencia para ${hotelName} en la fecha seleccionada.` });
    } catch (error: any) {
      setResult({ severity: 'error', message: `Error al añadir el registro: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };
  
  if (!SHOW_MANUAL_ATTENDANCE) {
    return null;
  }

  return (
    <Box sx={{ border: '2px dashed orange', p: 2, my: 2 }}>
      <Typography variant="h6" gutterBottom>Registro de Asistencia Manual</Typography>
      <Typography variant="body2" sx={{mb: 2}}>
        Esta herramienta es para uso excepcional, en caso de que hayas olvidado registrar una visita.
      </Typography>
      <FormControl fullWidth sx={{ mb: 2 }} disabled={hotelsLoading}>
        <InputLabel>Hotel</InputLabel>
        <Select
          value={selectedHotel}
          label="Hotel"
          onChange={(e) => setSelectedHotel(e.target.value)}
        >
          {hotels.map((hotel: Hotel) => (
            <MenuItem key={hotel.id} value={hotel.id}>{hotel.name}</MenuItem>
          ))}
        </Select>
        {hotelsLoading && <CircularProgress size={24} sx={{ position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px' }} />}
      </FormControl>
      <TextField
        label="Fecha de Visita"
        type="date"
        fullWidth
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        InputLabelProps={{
          shrink: true,
        }}
        sx={{ mb: 2 }}
        disabled={hotelsLoading}
      />
      <Button variant="contained" color="primary" onClick={handleManualCheckIn} disabled={loading || hotelsLoading}>
        {loading ? <CircularProgress size={24} /> : 'Registrar Visita Manualmente'}
      </Button>
      {result && (
        <Alert severity={result.severity} sx={{ mt: 2 }}>
          {result.message}
        </Alert>
      )}
    </Box>
  );
}
