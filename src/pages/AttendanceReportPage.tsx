import { useState, useMemo } from 'react';
import { 
  Box, Typography, ToggleButtonGroup, ToggleButton, Paper, Grid, 
  Avatar, Stack, Divider, Tooltip, CircularProgress, useTheme 
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import DriveEtaIcon from '@mui/icons-material/DriveEta';
import HistoryIcon from '@mui/icons-material/History';
import MapIcon from '@mui/icons-material/Map';
import { subDays } from 'date-fns';

import { useAuth } from '../hooks/useAuth';
import { useAttendance } from '../hooks/useAttendance';
import type { DateRange } from '../hooks/useAttendance';

import EmptyState from '../components/EmptyState';
import AttendanceFilters from '../components/attendance/AttendanceFilters';
import AttendanceChart from '../components/attendance/AttendanceChart';
import AttendanceGroupedList from '../components/attendance/AttendanceGroupedList';
import AttendanceCalendar from '../components/attendance/AttendanceCalendar';
import MileageReport from '../components/attendance/MileageReport';

export default function AttendanceReportPage() {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const [viewMode, setViewMode] = useState('report'); // report or calendar
  const [dateRange, setDateRange] = useState<DateRange>({ start: subDays(new Date(), 30), end: new Date() });
  const [selectedHotelId, setSelectedHotelId] = useState<string | undefined>();

  const { profile, session } = useAuth();
  const { filteredRecords, visitsByHotel, hotels, hotelsLoading, deleteRecord } = useAttendance(dateRange, selectedHotelId);

  const isInspector = profile?.role === 'INSPECTOR';

  // Filtrar registros por zona si el usuario es INSPECTOR
  const zoneFilteredRecords = useMemo(() => {
    if (isInspector && profile.assigned_zone) {
      return filteredRecords.filter(record => {
        const hotel = hotels.find(h => h.id === record.hotelId);
        return hotel?.zone === profile.assigned_zone;
      });
    }
    return filteredRecords;
  }, [filteredRecords, hotels, profile, isInspector]);

  const zoneFilteredVisitsByHotel = useMemo(() => {
    if (isInspector && profile.assigned_zone) {
      return visitsByHotel.filter(v => {
        const hotel = hotels.find(h => h.id === v.hotelId);
        return hotel?.zone === profile.assigned_zone;
      });
    }
    return visitsByHotel;
  }, [visitsByHotel, hotels, profile, isInspector]);

  const homeLocation = useMemo(() => {
    const lat = session?.user?.user_metadata?.home_lat;
    const lng = session?.user?.user_metadata?.home_lng;
    if (lat && lng) return { lat: parseFloat(lat), lng: parseFloat(lng) };
    return null;
  }, [session]);

  const recordsWithHotels = useMemo(() => {
    return filteredRecords.map(record => ({
      ...record,
      hotel: hotels.find(h => h.id === record.hotelId),
    }));
  }, [filteredRecords, hotels]);

  const stats = useMemo(() => ({
    totalVisits: zoneFilteredRecords.length,
    hotelsVisited: new Set(zoneFilteredRecords.map(r => r.hotelId)).size,
  }), [zoneFilteredRecords]);

  const handleViewChange = (_event: React.MouseEvent<HTMLElement>, nextView: string | null) => {
    if (nextView !== null) setViewMode(nextView);
  };

  const renderContent = () => {
    if (zoneFilteredRecords.length === 0 && !hotelsLoading) {
      return (
        <EmptyState 
          icon={<AssessmentIcon />}
          title="Sin registros de visita"
          subtitle="No hemos encontrado visitas en este periodo. ¿Has registrado tu ubicación hoy?"
        />
      );
    }

    switch (viewMode) {
      case 'report':
        return (
          <Box sx={{ animation: 'fadeIn 0.5s ease-in-out' }}>
            <AttendanceChart data={zoneFilteredVisitsByHotel} />
            <AttendanceGroupedList groupedData={zoneFilteredVisitsByHotel} allRecords={zoneFilteredRecords} deleteRecord={deleteRecord} />
          </Box>
        );
      case 'calendar':
        return <AttendanceCalendar records={zoneFilteredRecords} hotels={hotels} />;
      case 'mileage':
        return <MileageReport records={recordsWithHotels.filter(r => zoneFilteredRecords.some(z => z.id === r.id))} homeLocation={homeLocation} />;
      default:
        return null;
    }
  };

  return (
    <Box component="main" sx={{ p: { xs: 1, md: 3 } }}>
      {/* ENCABEZADO PREMIUM */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, mb: 3, borderRadius: 3, 
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
          border: '1px solid rgba(33, 150, 243, 0.1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ backgroundColor: 'info.main', p: 1, borderRadius: 2, display: 'flex', boxShadow: '0 4px 12px rgba(3, 169, 244, 0.3)' }}>
            <AssessmentIcon sx={{ color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>Reporte de Visitas</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
              {isInspector ? `ZONA: ${profile?.assigned_zone}` : 'HISTORIAL GLOBAL DE ASISTENCIA'}
            </Typography>
          </Box>
        </Box>

        <ToggleButtonGroup 
          value={viewMode} exclusive onChange={handleViewChange} size="small"
          sx={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, p: 0.5 }}
        >
          <ToggleButton value="report" sx={{ border: 'none', borderRadius: '8px !important', px: 2 }}>
            <EqualizerIcon sx={{ mr: 1, fontSize: 20 }} /> Reporte
          </ToggleButton>
          <ToggleButton value="calendar" sx={{ border: 'none', borderRadius: '8px !important', px: 2 }}>
            <CalendarMonthIcon sx={{ mr: 1, fontSize: 20 }} /> Calendario
          </ToggleButton>
          {/* Mantenemos mileage oculto por ahora a petición del usuario */}
          {/* <ToggleButton value="mileage" sx={{ border: 'none', borderRadius: '8px !important', px: 2 }}>
            <DriveEtaIcon sx={{ mr: 1, fontSize: 20 }} /> Kilometraje
          </ToggleButton> */}
        </ToggleButtonGroup>
      </Paper>

      {/* RESUMEN DE ESTADÍSTICAS RÁPIDAS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Avatar sx={{ bgcolor: 'info.main', width: 48, height: 48 }}><HistoryIcon /></Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>{stats.totalVisits}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>VISITAS TOTALES EN EL PERIODO</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><MapIcon /></Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>{stats.hotelsVisited}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>HOTELES DIFERENTES VISITADOS</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* FILTROS ESTILIZADOS */}
      <Box sx={{ mb: 4 }}>
        <AttendanceFilters 
          hotels={hotels.filter(h => !isInspector || h.zone === profile?.assigned_zone)}
          hotelsLoading={hotelsLoading}
          dateRange={dateRange}
          onDateChange={setDateRange}
          selectedHotelId={selectedHotelId}
          onHotelChange={setSelectedHotelId}
        />
      </Box>

      {/* CONTENIDO PRINCIPAL */}
      {hotelsLoading ? (
        <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress /></Box>
      ) : (
        renderContent()
      )}
    </Box>
  );
}