import { useState } from 'react';
import { Box, Typography, Button, Toolbar, ToggleButtonGroup, ToggleButton } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import { subDays } from 'date-fns';

import { useAttendance } from '../hooks/useAttendance';
import type { DateRange } from '../hooks/useAttendance';


import EmptyState from '../components/EmptyState';
import AttendanceFilters from '../components/attendance/AttendanceFilters';
import AttendanceChart from '../components/attendance/AttendanceChart';
import AttendanceGroupedList from '../components/attendance/AttendanceGroupedList';
import AttendanceCalendar from '../components/attendance/AttendanceCalendar';

export default function AttendanceReportPage() {
  const [viewMode, setViewMode] = useState('report'); // report or calendar
  const [dateRange, setDateRange] = useState<DateRange>({ start: subDays(new Date(), 30), end: new Date() });
  const [selectedHotelId, setSelectedHotelId] = useState<string | undefined>();

  const { filteredRecords, visitsByHotel, hotels, hotelsLoading, deleteRecord } = useAttendance(dateRange, selectedHotelId);

  const handleViewChange = (_event: React.MouseEvent<HTMLElement>, nextView: string | null) => {
    if (nextView !== null) {
      setViewMode(nextView);
    }
  };

  return (
    <Box>
      <Toolbar />
      <Box component="main" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4">Reporte de Visitas</Typography>
          {/* <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => exportAttendanceToPDF(filteredRecords, hotels)}
            disabled={filteredRecords.length === 0}
          >
            Exportar a PDF
          </Button> */}
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
          </ToggleButtonGroup>
        </Box>

        {filteredRecords.length > 0 ? (
          viewMode === 'report' ? (
            <Box>
              <AttendanceChart data={visitsByHotel} />
              <AttendanceGroupedList groupedData={visitsByHotel} allRecords={filteredRecords} deleteRecord={deleteRecord} />
            </Box>
          ) : (
            <AttendanceCalendar records={filteredRecords} hotels={hotels} />
          )
        ) : (
          <EmptyState 
            icon={<AssessmentIcon />}
            title="No hay visitas en el rango seleccionado"
            subtitle="Intenta cambiar las fechas o registrar una nueva visita desde el Dashboard."
          />
        )}
      </Box>
    </Box>
  );
}