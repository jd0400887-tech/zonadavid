import { useState, useEffect, Fragment, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Toolbar, FormControl, InputLabel, Select, MenuItem, Chip, TextField, IconButton, Grid, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button, ListSubheader, CircularProgress } from '@mui/material';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import UndoIcon from '@mui/icons-material/Undo';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import FilterListIcon from '@mui/icons-material/FilterList';
import { getWeek } from 'date-fns';
import { useEmployees } from '../hooks/useEmployees';
import { useHotels } from '../hooks/useHotels';
import type { Employee } from '../types';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/dashboard/StatCard';
import { usePayrollHistory } from '../hooks/usePayrollHistory';
import { useTrendData } from '../hooks/useTrendData';
import { supabase } from '../utils/supabase';
import { ComplianceReviewModal } from '../components/payroll/ComplianceReviewModal';
import { NotApplicableModal } from '../components/payroll/NotApplicableModal';

export default function PayrollReviewPage() {
  const { employees, updateEmployee } = useEmployees();
  const { hotelTrend, payrollTrend } = useTrendData();
  const { hotels } = useHotels();
  const [selectedHotel, setSelectedHotel] = useState<string>('all');
  const [nameFilter, setNameFilter] = useState<string>(''); // New state for name filter
  const [overtimeNotes, setOvertimeNotes] = useState<{[key: string]: string}>({});
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployeeToReview, setSelectedEmployeeToReview] = useState<Employee | null>(null);
  const [currentEmployeeComplianceStatus, setCurrentEmployeeComplianceStatus] = useState<string>('incumplimiento_total');
  const [currentEmployeeComplianceReason, setCurrentEmployeeComplianceReason] = useState<string | null>(null);

  const [notApplicableModalOpen, setNotApplicableModalOpen] = useState(false);
  const [selectedEmployeeForNA, setSelectedEmployeeForNA] = useState<Employee | null>(null);

  const { startOfThisWeek, endOfThisWeek, startOfWeekTimestamp } = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    const daysSinceSunday = dayOfWeek; // 0 days if today is Sunday, 1 if Monday, etc.
    const startOfThisWeek = new Date(today);
    startOfThisWeek.setDate(today.getDate() - daysSinceSunday);
    startOfThisWeek.setHours(0, 0, 0, 0);
    const startOfWeekTimestamp = startOfThisWeek.getTime();

    const endOfThisWeek = new Date(startOfThisWeek);
    endOfThisWeek.setDate(startOfThisWeek.getDate() + 7);

    return { startOfThisWeek, endOfThisWeek, startOfWeekTimestamp };
  }, []);

  const { history: payrollHistory, refreshHistory } = usePayrollHistory(startOfThisWeek, endOfThisWeek);
  
  const fetchEmployeeComplianceForWeek = useCallback(async (employeeId: string, weekNumber: number, year: number) => {
    const { data, error } = await supabase
      .from('adoption_compliance_history')
      .select('compliance_status, reason')
      .eq('employee_id', employeeId)
      .eq('week_of_year', weekNumber)
      .eq('compliance_year', year)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error('Error fetching employee compliance:', error);
      return { compliance_status: 'incumplimiento_total', reason: null };
    }
    return data || { compliance_status: 'incumplimiento_total', reason: null };
  }, []);

  useEffect(() => {
    const initialOvertime: {[key: string]: string} = {};
    employees.forEach(emp => {
      const review = payrollHistory.find(h => h.employee_id === emp.id);
      if (review && review.overtime_hours) {
        initialOvertime[emp.id] = String(review.overtime_hours);
      }
    });
    setOvertimeNotes(initialOvertime);
  }, [employees, payrollHistory]);

  const handleOvertimeChange = (employeeId: string, value: string) => {
    setOvertimeNotes(prev => ({
      ...prev,
      [employeeId]: value,
    }));
  };

  const handleOpenModal = useCallback(async (employee: Employee) => {
    const currentYear = new Date().getFullYear();
    const weekNumber = getWeek(new Date(), { weekStartsOn: 1 });
    const compliance = await fetchEmployeeComplianceForWeek(employee.id, weekNumber, currentYear);
    
    setSelectedEmployeeToReview(employee);
    setCurrentEmployeeComplianceStatus(compliance.compliance_status || 'incumplimiento_total');
    setCurrentEmployeeComplianceReason(compliance.reason);
    setModalOpen(true);
  }, [fetchEmployeeComplianceForWeek]);

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEmployeeToReview(null);
  };

  const handleOpenNAModal = (employee: Employee) => {
    setSelectedEmployeeForNA(employee);
    setNotApplicableModalOpen(true);
  };

  const handleCloseNAModal = () => {
    setNotApplicableModalOpen(false);
    setSelectedEmployeeForNA(null);
  };

  const handleSaveCompliance = async (employeeId: string, status: string, reason: string | null) => {
    const overtimeValue = overtimeNotes[employeeId];
    const overtime = overtimeValue && !isNaN(parseFloat(overtimeValue)) ? parseFloat(overtimeValue) : null;
    
    // Insert into payroll_review_history
    const { error: historyError } = await supabase.from('payroll_review_history').insert({
      employee_id: employeeId,
      review_date: new Date().toISOString(),
      overtime_hours: overtime,
    });

    if (historyError) {
      console.error('Error saving payroll history:', historyError);
      alert('Error guardando historial de nómina: ' + historyError.message);
      return;
    }

    // Insert/Update into adoption_compliance_history
    const currentYear = new Date().getFullYear();
    const weekNumber = getWeek(new Date(), { weekStartsOn: 1 });

    const { data: existingCompliance, error: fetchComplianceError } = await supabase
      .from('adoption_compliance_history')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('week_of_year', weekNumber)
      .eq('compliance_year', currentYear)
      .single();

    if (fetchComplianceError && fetchComplianceError.code !== 'PGRST116') {
      console.error('Error checking existing compliance record:', fetchComplianceError);
      alert('Error verificando cumplimiento: ' + fetchComplianceError.message);
      return;
    }

    if (existingCompliance) {
      const { error: updateComplianceError } = await supabase
        .from('adoption_compliance_history')
        .update({ compliance_status: status, reason: reason })
        .eq('id', existingCompliance.id);

      if (updateComplianceError) {
        console.error('Error updating compliance history:', updateComplianceError);
        alert('Error actualizando cumplimiento: ' + updateComplianceError.message);
        return;
      }
    } else {
      const { error: insertComplianceError } = await supabase.from('adoption_compliance_history').insert({
        employee_id: employeeId,
        week_of_year: weekNumber,
        compliance_year: currentYear,
        compliance_status: status,
        reason: reason,
      });
      if (insertComplianceError) {
        console.error('Error saving compliance history:', insertComplianceError);
        alert('Error guardando cumplimiento: ' + insertComplianceError.message);
        return;
      }
    }

    updateEmployee({ id: employeeId, lastReviewedTimestamp: new Date().toISOString() });
    refreshHistory();
    handleCloseModal();
  };

  const handleMarkAsNotApplicable = async (reason: string) => {
    if (!selectedEmployeeForNA) return;

    // Update employee's lastReviewedTimestamp to clear them from the current week's review list
    updateEmployee({ id: selectedEmployeeForNA.id, lastReviewedTimestamp: new Date().toISOString() });

    // Insert a special record into adoption_compliance_history
    const currentYear = new Date().getFullYear();
    const weekNumber = getWeek(new Date(), { weekStartsOn: 1 });

    const { error: insertComplianceError } = await supabase.from('adoption_compliance_history').insert({
      employee_id: selectedEmployeeForNA.id,
      week_of_year: weekNumber,
      compliance_year: currentYear,
      compliance_status: 'no_aplica',
      reason: reason, // Use the reason from the modal
    });

    if (insertComplianceError) {
      console.error('Error saving "no aplica" compliance history:', insertComplianceError);
      alert('Error guardando estado "no aplica": ' + insertComplianceError.message);
      // Note: We don't return here, so the modal closes even if DB save fails, but the employee might reappear on next refresh.
      // This might be desired to avoid getting stuck.
    }
    refreshHistory();
    handleCloseNAModal();
  };

  const allWorkrecordEmployees = useMemo(() => 
    employees.filter(emp => emp.payrollType === 'Workrecord' && emp.isActive), 
    [employees]
  );

  const employeesNeedingReview = useMemo(() => 
    allWorkrecordEmployees.filter(emp => !emp.lastReviewedTimestamp || new Date(emp.lastReviewedTimestamp).getTime() < startOfWeekTimestamp),
    [allWorkrecordEmployees, startOfWeekTimestamp]
  );

  const pendingPayrollsCount = employeesNeedingReview.length;
  const pendingHotelsCount = useMemo(() => new Set(employeesNeedingReview.map(emp => emp.hotelId)).size, [employeesNeedingReview]);
  const totalToReviewGlobal = allWorkrecordEmployees.length;
  const reviewedGlobalCount = totalToReviewGlobal - pendingPayrollsCount;
  const globalProgressPercentage = totalToReviewGlobal > 0 ? (reviewedGlobalCount / totalToReviewGlobal) * 100 : 0;

  const hotelStats = useMemo(() => 
    hotels.map(hotel => {
      const hotelEmployees = allWorkrecordEmployees.filter(emp => emp.hotelId === hotel.id);
      const total = hotelEmployees.length;
      if (total === 0) return null;
      const reviewed = hotelEmployees.filter(emp => !(!emp.lastReviewedTimestamp || new Date(emp.lastReviewedTimestamp).getTime() < startOfWeekTimestamp)).length;
      const progress = total > 0 ? (reviewed / total) * 100 : 0;
      return { id: hotel.id, name: hotel.name, total, reviewed, progress };
    }).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name)),
    [hotels, allWorkrecordEmployees, startOfWeekTimestamp]
  );

  const workrecordHotels = useMemo(() => {
    const workrecordHotelIds = new Set(allWorkrecordEmployees.map(emp => emp.hotelId));
    return hotels.filter(hotel => workrecordHotelIds.has(hotel.id));
  }, [allWorkrecordEmployees, hotels]);

  const workrecordEmployeesFiltered = useMemo(() => {
    return allWorkrecordEmployees
      .filter(emp => selectedHotel === 'all' || emp.hotelId === selectedHotel)
      .filter(emp => emp.name.toLowerCase().includes(nameFilter.toLowerCase())) // Apply name filter
      .map(emp => ({ ...emp, needsReview: !emp.lastReviewedTimestamp || new Date(emp.lastReviewedTimestamp).getTime() < startOfWeekTimestamp }))
      .sort((a, b) => {
        if (a.needsReview !== b.needsReview) {
          return a.needsReview ? -1 : 1;
        }
        if (a.role === 'Housekeeper' && b.role !== 'Housekeeper') {
          return -1;
        }
        if (a.role !== 'Housekeeper' && b.role === 'Housekeeper') {
          return 1;
        }
        if (a.role.localeCompare(b.role) !== 0) {
          return a.role.localeCompare(b.role);
        }
        return a.name.localeCompare(b.name);
      });
  }, [allWorkrecordEmployees, selectedHotel, startOfWeekTimestamp]);

  const groupedByHotel = useMemo(() => {
    if (selectedHotel !== 'all') {
      return [];
    }
    const groups = workrecordEmployeesFiltered.reduce((acc, employee) => {
      const hotelName = hotels.find(h => h.id === employee.hotelId)?.name || 'Sin Hotel';
      if (!acc[hotelName]) {
        acc[hotelName] = [];
      }
      acc[hotelName].push(employee);
      return acc;
    }, {} as Record<string, typeof workrecordEmployeesFiltered>);

    return Object.entries(groups).map(([hotelName, employees]) => ({ hotelName, employees }));
  }, [workrecordEmployeesFiltered, selectedHotel, hotels]);

  const handleMarkAsReviewed = async (employeeId: string) => {
    const overtimeValue = overtimeNotes[employeeId];
    const overtime = overtimeValue && !isNaN(parseFloat(overtimeValue)) ? parseFloat(overtimeValue) : null;
    const currentComplianceStatus = complianceStatus[employeeId] || 'incumplimiento_total'; // Default to total non-compliance
    const currentComplianceReason = complianceReason[employeeId];
    
    // Validate that a reason is provided if status is not 'cumplio'
    if (currentComplianceStatus !== 'cumplio' && !currentComplianceReason) {
      alert('Por favor, selecciona o escribe un motivo para el estado de cumplimiento.');
      return;
    }

    // Insert into payroll_review_history
    const { error: historyError } = await supabase.from('payroll_review_history').insert({
      employee_id: employeeId,
      review_date: new Date().toISOString(),
      overtime_hours: overtime,
    });

    if (historyError) {
      console.error('Error saving payroll history:', historyError);
      return;
    }

    // Insert/Update into adoption_compliance_history
    const currentYear = new Date().getFullYear();
    const weekNumber = getWeek(new Date(), { weekStartsOn: 1 });

    const { data: existingCompliance, error: fetchComplianceError } = await supabase
      .from('adoption_compliance_history')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('week_of_year', weekNumber)
      .eq('compliance_year', currentYear)
      .single();

    if (fetchComplianceError && fetchComplianceError.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error('Error checking existing compliance record:', fetchComplianceError);
      return;
    }

    if (existingCompliance) {
      const { error: updateComplianceError } = await supabase
        .from('adoption_compliance_history')
        .update({ compliance_status: currentComplianceStatus, reason: currentComplianceReason })
        .eq('id', existingCompliance.id);

      if (updateComplianceError) {
        console.error('Error updating compliance history:', updateComplianceError);
        return;
      }
    } else {
      const { error: insertComplianceError } = await supabase.from('adoption_compliance_history').insert({
        employee_id: employeeId,
        week_of_year: weekNumber,
        year: currentYear,
        compliance_status: currentComplianceStatus,
        reason: currentComplianceReason,
      });
      if (insertComplianceError) {
        console.error('Error saving compliance history:', insertComplianceError);
        return;
      }
    }

    updateEmployee({ id: employeeId, lastReviewedTimestamp: new Date().toISOString() });
    refreshHistory();
  };

  const handleUnmarkAsReviewed = async (employeeId: string) => {
    // Delete from payroll_review_history
    const { error: deletePayrollHistoryError } = await supabase
      .from('payroll_review_history')
      .delete()
      .eq('employee_id', employeeId)
      .gte('review_date', startOfThisWeek.toISOString());

    if (deletePayrollHistoryError) {
      console.error('Error deleting payroll history:', deletePayrollHistoryError);
      return;
    }

    // Delete from adoption_compliance_history for the current week
    const currentYear = new Date().getFullYear();
    const weekNumber = getWeek(new Date(), { weekStartsOn: 1 });
    const { error: deleteComplianceError } = await supabase
      .from('adoption_compliance_history')
      .delete()
      .eq('employee_id', employeeId)
      .eq('week_of_year', weekNumber)
      .eq('compliance_year', currentYear);

    if (deleteComplianceError) {
      console.error('Error deleting compliance history:', deleteComplianceError);
      return;
    }

    updateEmployee({ id: employeeId, lastReviewedTimestamp: null });
    refreshHistory();
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
          <TableContainer sx={{ 
            maxHeight: 300,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0,0,0,0.1)',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#FF5722',
              borderRadius: '4px',
              boxShadow: '0 0 6px #FF5722',
            },
          }}>
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
                    <TableCell align="center">
                      {selectedHotel === stat.id ? (
                        <Button variant="outlined" size="small" onClick={() => setSelectedHotel('all')}>Ver Todos</Button>
                      ) : (
                        <IconButton size="small" onClick={() => setSelectedHotel(stat.id)}><FilterListIcon /></IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>



        <Paper sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="Buscar por nombre de empleado"
            variant="outlined"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
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
                          <>
                            <Button variant="contained" size="small" onClick={() => handleOpenModal(employee)}>
                              Calificar
                            </Button>
                            <Button variant="outlined" size="small" onClick={() => handleOpenNAModal(employee)}>
                              No Aplica
                            </Button>
                          </>
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

      {selectedEmployeeToReview && (
        <ComplianceReviewModal
          open={modalOpen}
          onClose={handleCloseModal}
          employeeId={selectedEmployeeToReview.id}
          employeeName={selectedEmployeeToReview.name}
          initialComplianceStatus={currentEmployeeComplianceStatus}
          initialComplianceReason={currentEmployeeComplianceReason}
          onSave={handleSaveCompliance}
        />
      )}

      {selectedEmployeeForNA && (
        <NotApplicableModal
          open={notApplicableModalOpen}
          onClose={handleCloseNAModal}
          employeeName={selectedEmployeeForNA.name}
          onSave={handleMarkAsNotApplicable}
        />
      )}
    </Box>
  );
}