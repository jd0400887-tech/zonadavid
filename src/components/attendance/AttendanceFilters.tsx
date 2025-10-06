import { Paper, TextField, Box, Autocomplete, Grid } from '@mui/material';
import type { Hotel } from '../../types';
import type { DateRange } from '../../hooks/useAttendance';

interface AttendanceFiltersProps {
  hotels: Hotel[];
  hotelsLoading: boolean; // Add hotelsLoading prop
  dateRange: DateRange;
  onDateChange: (newRange: DateRange) => void;
  selectedHotelId: string | undefined;
  onHotelChange: (hotelId: string | undefined) => void;
}

export default function AttendanceFilters({
  hotels,
  hotelsLoading, // Destructure hotelsLoading
  dateRange,
  onDateChange,
  selectedHotelId,
  onHotelChange,
}: AttendanceFiltersProps) {

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const newDate = value ? new Date(value) : null;
    // Adjust for timezone offset when parsing from YYYY-MM-DD
    if (newDate) {
      const timezoneOffset = newDate.getTimezoneOffset() * 60000;
      newDate.setTime(newDate.getTime() + timezoneOffset);
    }
    onDateChange({ ...dateRange, [field]: newDate });
  };

  const selectedHotel = hotels.find(h => h.id === selectedHotelId) || null;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2} columns={12} alignItems="center">
        <Grid grid={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            label="Fecha de inicio"
            type="date"
            value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
            onChange={(e) => handleDateChange('start', e.target.value)}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        <Grid grid={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            label="Fecha de fin"
            type="date"
            value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
            onChange={(e) => handleDateChange('end', e.target.value)}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        <Grid grid={{ xs: 12, md: 6 }}>
          <Autocomplete
            options={hotels}
            getOptionLabel={(option) => option.name}
            value={selectedHotel}
            onChange={(event, newValue) => {
              onHotelChange(newValue?.id);
            }}
            renderInput={(params) => <TextField {...params} label="Filtrar por hotel" />}
            fullWidth
            disabled={hotelsLoading} // Disable when loading
            loading={hotelsLoading} // Show loading indicator
          />
        </Grid>
      </Grid>
    </Paper>
  );
}