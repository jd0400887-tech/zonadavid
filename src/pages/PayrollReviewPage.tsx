import { useState } from 'react';
import { Box, Typography, Button, Paper, List, ListItem, ListItemText, Toolbar, FormControl, InputLabel, Select, MenuItem, Chip, LinearProgress, TextField, IconButton } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import { useEmployees } from '../hooks/useEmployees';
import { useHotels } from '../hooks/useHotels';
import type { Hotel, Employee } from '../types';
import EmptyState from '../components/EmptyState';

export default function PayrollReviewPage() {
  const { employees, updateEmployee } = useEmployees();
  const { hotels } = useHotels();
  const [selectedHotel, setSelectedHotel] = useState<string>('all');
  const [overtimeNotes, setOvertimeNotes] = useState<{[key: string]: string}>({});

  const handleOvertimeChange = (employeeId: string, value: string) => {
    setOvertimeNotes(prev => ({
      ...prev,
      [employeeId]: value,
    }));
  };

  // --- Logic to determine who needs review ---
  const today = new Date();
  const dayOfWeek = today.getDay(); // Sunday = 0, Monday = 1...
  // Adjust to make Monday the start of the week (day 1)
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const startOfThisWeek = new Date(today);
  startOfThisWeek.setDate(today.getDate() - daysSinceMonday);
  startOfThisWeek.setHours(0, 0, 0, 0);
  const startOfWeekTimestamp = startOfThisWeek.getTime();

  // --- Filter employees ---
  const workrecordEmployees = employees
    .filter(emp => emp.payrollType === 'Workrecord')
    .filter(emp => selectedHotel === 'all' || emp.hotelId === selectedHotel)
    .map(emp => {
      const needsReview = !emp.lastReviewedTimestamp || new Date(emp.lastReviewedTimestamp).getTime() < startOfWeekTimestamp;
      return { ...emp, needsReview };
    })
    .sort((a, b) => (b.needsReview ? 1 : -1) - (a.needsReview ? 1 : -1) || a.name.localeCompare(b.name)); // Sort by needsReview first, then by name

  // --- Progress Calculation ---
  const totalCount = workrecordEmployees.length;
  const reviewedCount = workrecordEmployees.filter(emp => !emp.needsReview).length;
  const progressPercentage = totalCount > 0 ? (reviewedCount / totalCount) * 100 : 0;

  const handleMarkAsReviewed = (employeeId: string) => {
    const overtime = overtimeNotes[employeeId];
    updateEmployee({ id: employeeId, lastReviewedTimestamp: new Date().toISOString(), overtime });
  };

  return (
    <Box>
      <Toolbar />
      <Box component="main" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">Revisión de Nómina (Workrecord)</Typography>
        </Box>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">Progreso Semanal</Typography>
            <Typography variant="h6">{`${reviewedCount} / ${totalCount}`}</Typography>
          </Box>
          <LinearProgress variant="determinate" value={progressPercentage} />
        </Paper>

        <Paper sx={{ p: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="hotel-filter-label">Filtrar por Hotel</InputLabel>
            <Select
              labelId="hotel-filter-label"
              value={selectedHotel}
              label="Filtrar por Hotel"
              onChange={(e) => setSelectedHotel(e.target.value)}
            >
              <MenuItem value="all">Todos los Hoteles</MenuItem>
              {hotels.map(hotel => (
                <MenuItem key={hotel.id} value={hotel.id}>{hotel.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        <Paper sx={{ p: 2 }}>
          {workrecordEmployees.length > 0 ? (
            <List>
              {workrecordEmployees.map(employee => {
                const hotel = hotels.find(h => h.id === employee.hotelId);
                return (
                  <ListItem
                    key={employee.id}
                    divider
                    secondaryAction={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TextField
                          label="Overtime"
                          variant="outlined"
                          size="small"
                          inputProps={{ maxLength: 5 }}
                          sx={{ width: '100px' }}
                          value={overtimeNotes[employee.id] || ''}
                          onChange={(e) => handleOvertimeChange(employee.id, e.target.value)}
                        />
                        <IconButton
                          color="primary"
                          onClick={() => handleMarkAsReviewed(employee.id)}
                          disabled={!employee.needsReview}
                        >
                          <CheckCircleOutlineIcon />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                          {employee.name}
                          {employee.needsReview && (
                            <Chip label="Necesita Revisión" color="warning" size="small" sx={{ ml: 2 }} />
                          )}
                        </Box>
                      }
                      secondary={`Hotel: ${hotel?.name || 'N/A'} | Última revisión: ${employee.lastReviewedTimestamp ? new Date(employee.lastReviewedTimestamp).toLocaleDateString('es-ES') : 'Nunca'}`}
                    />
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <EmptyState 
              icon={<FactCheckIcon />}
              title="Todo revisado"
              subtitle="No hay empleados de tipo Workrecord pendientes de revisión para el filtro seleccionado."
            />
          )}
        </Paper>
      </Box>
    </Box>
  );
}
