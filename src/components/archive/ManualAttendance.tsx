
import { Button, Box, Typography, Alert } from '@mui/material';
import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useUserProfile } from '../../hooks/useUserProfile';
import type { AttendanceRecord } from '../../types';

const hotelIdsToAdd = ['hotel-1759783989531', 'hotel-1759783989690', 'hotel-1759783988017'];

export default function ManualAttendance() {
  const { profile } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{severity: 'success' | 'error', message: string} | null>(null);

  const handleAddRecords = async () => {
    setLoading(true);
    setResult(null);

    if (!profile) {
      setResult({ severity: 'error', message: 'No se pudo cargar tu perfil de empleado. Intenta recargar la página.' });
      setLoading(false);
      return;
    }

    const employeeId = profile.id;

    const newRecords: Partial<AttendanceRecord>[] = hotelIdsToAdd.map(hotelId => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      hotelId: hotelId,
      employeeId: employeeId,
      timestamp: new Date().toISOString(),
    }));

    const { error } = await supabase.from('attendance_records').insert(newRecords);

    if (error) {
      setResult({ severity: 'error', message: `Error al insertar los registros: ${error.message}` });
    } else {
      setResult({ severity: 'success', message: `¡Éxito! Se han añadido ${newRecords.length} registros de asistencia.` });
    }
    setLoading(false);
  };

  return (
    <Box sx={{ border: '2px dashed red', p: 2, my: 2 }}>
      <Typography variant="h6" gutterBottom>Asistencia Manual (Temporal)</Typography>
      <Typography variant="body2" sx={{mb: 2}}>
        Haz clic en este botón para registrar las 3 visitas a hoteles que no se pudieron guardar hoy.
      </Typography>
      <Button variant="contained" color="primary" onClick={handleAddRecords} disabled={loading}>
        {loading ? 'Registrando...' : 'Registrar 3 Visitas Manualmente'}
      </Button>
      {result && (
        <Alert severity={result.severity} sx={{ mt: 2 }}>
          {result.message}
        </Alert>
      )}
    </Box>
  );
}
