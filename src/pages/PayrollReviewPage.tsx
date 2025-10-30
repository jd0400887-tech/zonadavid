import { useState, useEffect, Fragment } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Toolbar, FormControl, InputLabel, Select, MenuItem, Chip, LinearProgress, TextField, IconButton, Grid, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button, ListSubheader, CircularProgress } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import UndoIcon from '@mui/icons-material/Undo';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useEmployees } from '../hooks/useEmployees';
import { useHotels } from '../hooks/useHotels';
import type { Employee } from '../types';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/dashboard/StatCard';
import { usePayrollHistory } from '../hooks/usePayrollHistory';
import { useTrendData } from '../hooks/useTrendData';
import { supabase } from '../utils/supabase';

export default function PayrollReviewPage() {
  const { employees, updateEmployee } = useEmployees();
  const { hotelTrend, payrollTrend } = useTrendData();
  const { hotels } = useHotels();
  const [selectedHotel, setSelectedHotel] = useState<string>('all');
  const [overtimeNotes, setOvertimeNotes] = useState<{[key: string]: string}>({});

  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const startOfThisWeek = new Date(today);
  startOfThisWeek.setDate(today.getDate() - daysSinceMonday);
  startOfThisWeek.setHours(0, 0, 0, 0);
  const startOfWeekTimestamp = startOfThisWeek.getTime();

  const endOfThisWeek = new Date(startOfThisWeek);
  endOfThisWeek.setDate(startOfThisWeek.getDate() + 7);

  const { history: payrollHistory } = usePayrollHistory(startOfThisWeek, endOfThisWeek);

  useEffect(() => {
    const initialOvertime = employees.reduce((acc, emp) => {
      const needsReview = !emp.lastReviewedTimestamp || new Date(emp.lastReviewedTimestamp).getTime() < startOfWeekTimestamp;
      if (!needsReview) {
        const review = payrollHistory.find(h => h.employee_id === emp.id);
        if (review && review.overtime_hours) {
          acc[emp.id] = String(review.overtime_hours);
        }
      }
      return acc;
    }, {} as {[key: string]: string});
    setOvertimeNotes(initialOvertime);
  }, [employees, payrollHistory, startOfWeekTimestamp]);

  const handleOvertimeChange = (employeeId: string, value: string) => {
    setOvertimeNotes(prev => ({
      ...prev,
      [employeeId]: value,
    }));
  };

  const allWorkrecordEmployees = employees.filter(emp => emp.payrollType === 'Workrecord' && emp.isActive);
  const employeesNeedingReview = allWorkrecordEmployees.filter(emp => !emp.lastReviewedTimestamp || new Date(emp.lastReviewedTimestamp).getTime() < startOfWeekTimestamp);
  const pendingPayrollsCount = employeesNeedingReview.length;
  const pendingHotelsCount = new Set(employeesNeedingReview.map(emp => emp.hotelId)).size;
  const totalToReviewGlobal = allWorkrecordEmployees.length;
  const reviewedGlobalCount = totalToReviewGlobal - pendingPayrollsCount;
  const globalProgressPercentage = totalToReviewGlobal > 0 ? (reviewedGlobalCount / totalToReviewGlobal) * 100 : 0;



  const hotelStats = hotels.map(hotel => {
    const hotelEmployees = allWorkrecordEmployees.filter(emp => emp.hotelId === hotel.id);
    const total = hotelEmployees.length;
    if (total === 0) return null;
    const reviewed = hotelEmployees.filter(emp => !(!emp.lastReviewedTimestamp || new Date(emp.lastReviewedTimestamp).getTime() < startOfWeekTimestamp)).length;
    const progress = total > 0 ? (reviewed / total) * 100 : 0;
    return { id: hotel.id, name: hotel.name, total, reviewed, progress };
  }).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));

  const workrecordEmployeesFiltered = allWorkrecordEmployees
    .filter(emp => selectedHotel === 'all' || emp.hotelId === selectedHotel)
    .map(emp => ({ ...emp, needsReview: !emp.lastReviewedTimestamp || new Date(emp.lastReviewedTimestamp).getTime() < startOfWeekTimestamp }))
    .sort((a, b) => (a.needsReview === b.needsReview ? a.name.localeCompare(b.name) : b.needsReview ? 1 : -1));

  const handleMarkAsReviewed = async (employeeId: string) => {
    const overtimeValue = overtimeNotes[employeeId];
    const overtime = overtimeValue && !isNaN(parseFloat(overtimeValue)) ? parseFloat(overtimeValue) : null;

    const { error: historyError } = await supabase.from('payroll_review_history').insert({
      employee_id: employeeId,
      review_date: new Date().toISOString(),
      overtime_hours: overtime,
    });

    if (historyError) {
      console.error('Error saving payroll history:', historyError);
      return;
    }

    updateEmployee({ id: employeeId, lastReviewedTimestamp: new Date().toISOString(), overtime: null });
  };

  const handleUnmarkAsReviewed = async (employeeId: string) => {
    const { error: deleteError } = await supabase
      .from('payroll_review_history')
      .delete()
      .eq('employee_id', employeeId)
      .gte('review_date', startOfThisWeek.toISOString());

    if (deleteError) {
      console.error('Error deleting payroll history:', deleteError);
      return;
    }

    updateEmployee({ id: employeeId, lastReviewedTimestamp: null, overtime: null });
  };

  const firstReviewedIndex = workrecordEmployeesFiltered.findIndex(emp => !emp.needsReview);

  useEffect(() => {
    const saveDailyStats = async () => {
      if (totalToReviewGlobal === 0) return;

      const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD

      const { data, error } = await supabase
        .from('daily_stats')
        .select('id')
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
        console.error('Error checking daily stats:', error);
        return;
      }

      if (!data) {
        const { error: insertError } = await supabase
          .from('daily_stats')
          .insert({
            date: today,
            pending_hotels: pendingHotelsCount,
            pending_payrolls: pendingPayrollsCount,
          });

        if (insertError) {
          console.error('Error inserting daily stats:', insertError);
        }
      }
    };

    saveDailyStats();
  }, [pendingHotelsCount, pendingPayrollsCount, totalToReviewGlobal]);

  return (
    <Box>
      <Toolbar />
      <Box component="main" sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>Revisión de Nómina (Workrecord)</Typography>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}><StatCard title="Hoteles Pendientes" value={pendingHotelsCount} icon={<ApartmentIcon />} trendData={hotelTrend} /></Grid>
          <Grid item xs={12} md={4}><StatCard title="Nóminas Pendientes" value={pendingPayrollsCount} icon={<PeopleIcon />} trendData={payrollTrend} /></Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom>Progreso General</Typography>
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                <CircularProgress variant="determinate" value={globalProgressPercentage} size={80} thickness={4} color="primary" />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h6" component="div" color="text.secondary">
                    {`${Math.round(globalProgressPercentage)}%`}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body1" color="text.secondary">{`${reviewedGlobalCount} / ${totalToReviewGlobal} revisados`}</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Desglose por Hotel</Typography>
          <TableContainer sx={{ maxHeight: 300 }}>
            <Table stickyHeader>
              <TableHead><TableRow><TableCell>Hotel</TableCell><TableCell align="center">Progreso</TableCell><TableCell align="right">Estado</TableCell><TableCell align="center">Acción</TableCell></TableRow></TableHead>
              <TableBody>
                {hotelStats.map(stat => (
                  stat && <TableRow key={stat.id} hover>
                    <TableCell>{stat.name}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                        <CircularProgress variant="determinate" value={stat.progress} size={40} thickness={4} />
                        <Box
                          sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="caption" component="div" color="text.secondary">
                            {`${Math.round(stat.progress)}%`}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{`${stat.reviewed} / ${stat.total}`}</TableCell>
                    <TableCell align="center"><IconButton size="small" onClick={() => setSelectedHotel(stat.id)}><FilterListIcon /></IconButton></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper sx={{ p: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Filtrar por Hotel</InputLabel>
            <Select value={selectedHotel} label="Filtrar por Hotel" onChange={(e) => setSelectedHotel(e.target.value)}>
              <MenuItem value="all">Todos los Hoteles</MenuItem>
              {hotels.map(hotel => <MenuItem key={hotel.id} value={hotel.id}>{hotel.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Paper>

        <Paper sx={{ p: 2 }}>
          {workrecordEmployeesFiltered.length > 0 ? (
            <List>
              {workrecordEmployeesFiltered.map((employee, index) => {
                const hotel = hotels.find(h => h.id === employee.hotelId);
                const subheader = index === firstReviewedIndex && firstReviewedIndex > 0 ? 
                  <ListSubheader sx={{ bgcolor: 'background.paper' }}>Revisados</ListSubheader> : null;

                return (
                  <Fragment key={employee.id}>
                    {subheader}
                    <ListItem divider sx={{ backgroundColor: employee.needsReview ? 'rgba(255, 152, 0, 0.1)' : 'transparent' }}>
                      <ListItemText
                        primary={<Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>{employee.name}{employee.needsReview && <Chip label="Necesita Revisión" color="warning" size="small" sx={{ ml: 2 }} />}</Box>}
                        secondary={`Hotel: ${hotel?.name || 'N/A'} | Última revisión: ${employee.lastReviewedTimestamp ? new Date(employee.lastReviewedTimestamp).toLocaleDateString('es-ES') : 'Nunca'}`}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TextField label="Overtime" type="number" size="small" inputProps={{ step: "0.1" }} sx={{ width: '100px' }} value={overtimeNotes[employee.id] || ''} onChange={(e) => handleOvertimeChange(employee.id, e.target.value)} disabled={!employee.needsReview} />
                        {employee.needsReview ? (
                          <IconButton color="primary" onClick={() => handleMarkAsReviewed(employee.id)}><CheckCircleOutlineIcon /></IconButton>
                        ) : (
                          <IconButton color="secondary" onClick={() => handleUnmarkAsReviewed(employee.id)}><UndoIcon /></IconButton>
                        )}
                      </Box>
                    </ListItem>
                  </Fragment>
                );
              })}
            </List>
          ) : (
            <EmptyState icon={<FactCheckIcon />} title="Todo revisado" subtitle="No hay empleados de tipo Workrecord pendientes de revisión para el filtro seleccionado." />
          )}
        </Paper>
      </Box>
    </Box>
  );
}