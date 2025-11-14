import { useState, useMemo } from 'react';
import { Box, Typography, Toolbar, ToggleButtonGroup, ToggleButton } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import DriveEtaIcon from '@mui/icons-material/DriveEta'; // Icon for Mileage
import { subDays } from 'date-fns';

import { useAuth } from '../hooks/useAuth'; // Import useAuth
import { useAttendance } from '../hooks/useAttendance';
import type { DateRange } from '../hooks/useAttendance';

import EmptyState from '../components/EmptyState';
import AttendanceFilters from '../components/attendance/AttendanceFilters';
import AttendanceChart from '../components/attendance/AttendanceChart';
import AttendanceGroupedList from '../components/attendance/AttendanceGroupedList';
import AttendanceCalendar from '../components/attendance/AttendanceCalendar';
import MileageReport from '../components/attendance/MileageReport'; // Import MileageReport

export default function AttendanceReportPage() {
  const [viewMode, setViewMode] = useState('report'); // report, calendar, or mileage
  const [dateRange, setDateRange] = useState<DateRange>({ start: subDays(new Date(), 30), end: new Date() });
  const [selectedHotelId, setSelectedHotelId] = useState<string | undefined>();

  const { session } = useAuth();
  const { filteredRecords, visitsByHotel, hotels, hotelsLoading, deleteRecord } = useAttendance(dateRange, selectedHotelId);

  const homeLocation = useMemo(() => {
    const lat = session?.user?.user_metadata?.home_lat;
    const lng = session?.user?.user_metadata?.home_lng;
    if (lat && lng) {
      return { lat: parseFloat(lat), lng: parseFloat(lng) };
    }
    return null;
  }, [session]);

  const recordsWithHotels = useMemo(() => {
    return filteredRecords.map(record => ({
      ...record,
      hotel: hotels.find(h => h.id === record.hotelId),
    }));
  }, [filteredRecords, hotels]);

  const handleViewChange = (_event: React.MouseEvent<HTMLElement>, nextView: string | null) => {
    if (nextView !== null) {
      setViewMode(nextView);
    }
  };

  const renderContent = () => {
    if (filteredRecords.length === 0) {
      return (
        <EmptyState 
          icon={<AssessmentIcon />}
          title="No hay visitas en el rango seleccionado"
          subtitle="Intenta cambiar las fechas o registrar una nueva visita desde el Dashboard."
        />
      );
    }

    switch (viewMode) {
      case 'report':
        return (
          <Box>
            <AttendanceChart data={visitsByHotel} />
            <AttendanceGroupedList groupedData={visitsByHotel} allRecords={filteredRecords} deleteRecord={deleteRecord} />
          </Box>
        );
      case 'calendar':
        return <AttendanceCalendar records={filteredRecords} hotels={hotels} />;
      case 'mileage':
        return <MileageReport records={recordsWithHotels} homeLocation={homeLocation} />;
      default:
        return null;
    }
  };

  return (
    <Box>
      <Toolbar />
      <Box component="main" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4">Reporte de Visitas</Typography>
        </Box>

        <AttendanceFilters 
          hotels={hotels}
          hotelsLoading={hotelsLoading}
          dateRange={dateRange}
          onDateChange={setDateRange}
          selectedHotelId={selectedHotelId}
          onHotelChange={setSelectedHotelId}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewChange}>
            <ToggleButton value="report" aria-label="report view">
              <EqualizerIcon sx={{ mr: 1}} />
              Reporte
            </ToggleButton>
            <ToggleButton value="calendar" aria-label="calendar view">
              <CalendarMonthIcon sx={{ mr: 1}} />
              Calendario
            </ToggleButton>
            <ToggleButton value="mileage" aria-label="mileage view">
              <DriveEtaIcon sx={{ mr: 1}} />
              Kilometraje
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {renderContent()}
      </Box>
    </Box>
  );
}