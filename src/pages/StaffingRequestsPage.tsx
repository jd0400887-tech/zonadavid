import { useState, useMemo } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Toolbar, TableSortLabel, Chip, IconButton, Select, MenuItem, FormControl, Grid, TextField, InputAdornment, InputLabel, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useStaffingRequests } from '../hooks/useStaffingRequests';
import { useSortableData } from '../hooks/useSortableData';
import { useHotels } from '../hooks/useHotels';
import StaffingRequestDialog from '../components/staffing-requests/StaffingRequestDialog';
import StaffingRequestsDashboard from '../components/staffing-requests/StaffingRequestsDashboard';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import type { StaffingRequest } from '../types';
import { subDays } from 'date-fns';

const statusColors: { [key in StaffingRequest['status']]: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error' } = {
  'Pendiente': 'default',
  'Enviada a Reclutamiento': 'primary',
  'En Proceso': 'info',
  'Completada': 'success',
  'Completada Parcialmente': 'warning',
  'Cancelada por Hotel': 'error',
  'Candidato No Presentado': 'error',
  'Vencida': 'error',
};

export default function StaffingRequestsPage() {
  const { requests, loading, addRequest, updateRequest, deleteRequest } = useStaffingRequests();
  const { hotels } = useHotels();

  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = subDays(end, 30);
    return { start, end };
  });

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hotelFilter, setHotelFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' } | null>(null);

  const filteredRequests = useMemo(() => {
    return requests
      .filter(req => {
        const reqDate = new Date(req.created_at);
        return reqDate >= dateRange.start && reqDate <= dateRange.end;
      })
      .filter(req => statusFilter === 'all' || req.status === statusFilter)
      .filter(req => hotelFilter === 'all' || req.hotel_id === hotelFilter)
      .filter(req => {
        if (!searchTerm) return true;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return (
          req.role.toLowerCase().includes(lowerCaseSearch) ||
          (req.notes && req.notes.toLowerCase().includes(lowerCaseSearch))
        );
      });
  }, [requests, dateRange, statusFilter, hotelFilter, searchTerm]);

  const { items: sortedRequests, requestSort, sortConfig } = useSortableData(filteredRequests, { key: 'created_at', direction: 'desc' });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<StaffingRequest | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<number | null>(null);

  const handleOpenDialog = (request?: StaffingRequest) => {
    setEditingRequest(request || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRequest(null);
  };

  const handleSubmit = async (formData: Omit<StaffingRequest, 'id' | 'created_at' | 'hotelName'>) => {
    try {
      if (editingRequest) {
        await updateRequest(editingRequest.id, formData);
        setSnackbar({ open: true, message: 'Solicitud actualizada correctamente', severity: 'success' });
      } else {
        await addRequest(formData);
        setSnackbar({ open: true, message: 'Solicitud creada correctamente', severity: 'success' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al guardar la solicitud', severity: 'error' });
    }
  };

  const handleStatusChange = async (id: number, newStatus: StaffingRequest['status']) => {
    try {
      const updates: Partial<StaffingRequest> = { status: newStatus };
      if (newStatus === 'Completada' || newStatus === 'Cancelada por Hotel' || newStatus === 'Candidato No Presentado') {
        updates.completed_at = new Date().toISOString();
      }
      await updateRequest(id, updates);
      setSnackbar({ open: true, message: 'Estado actualizado correctamente', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al actualizar el estado', severity: 'error' });
    }
  };

  const handleDeleteClick = (id: number) => {
    setRequestToDelete(id);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (requestToDelete) {
        await deleteRequest(requestToDelete);
        setSnackbar({ open: true, message: 'Solicitud eliminada correctamente', severity: 'success' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al eliminar la solicitud', severity: 'error' });
    }
    setIsConfirmDialogOpen(false);
    setRequestToDelete(null);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newDate = new Date(`${value}T00:00:00`);
    setDateRange(prev => ({ ...prev, [name]: newDate }));
  };

  const handleFilterChange = (filterType: 'status', value: string) => {
    if (filterType === 'status') {
      setStatusFilter(value);
    }
  };

  return (
    <Box>
      <Toolbar />
      <Box component="main" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">Gestión de Solicitudes de Personal</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Nueva Solicitud
          </Button>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar por Cargo o Notas"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={statusFilter}
                  label="Estado"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {Object.keys(statusColors).map(status => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Hotel</InputLabel>
                <Select
                  value={hotelFilter}
                  label="Hotel"
                  onChange={(e) => setHotelFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {hotels.map(hotel => (
                    <MenuItem key={hotel.id} value={hotel.id}>{hotel.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField fullWidth name="start" label="Desde" type="date" value={dateRange.start.toISOString().split('T')[0]} onChange={handleDateChange} InputLabelProps={{ shrink: true }} size="small" />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField fullWidth name="end" label="Hasta" type="date" value={dateRange.end.toISOString().split('T')[0]} onChange={handleDateChange} InputLabelProps={{ shrink: true }} size="small" />
            </Grid>
          </Grid>
        </Paper>

        <StaffingRequestsDashboard requests={filteredRequests} onFilterChange={handleFilterChange} />

        <Paper sx={{ p: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Acciones</TableCell>
                  <TableCell><TableSortLabel active={sortConfig?.key === 'status'} direction={sortConfig?.direction} onClick={() => requestSort('status')}>Estado</TableSortLabel></TableCell>
                  <TableCell><TableSortLabel active={sortConfig?.key === 'hotelName'} direction={sortConfig?.direction} onClick={() => requestSort('hotelName')}>Hotel</TableSortLabel></TableCell>
                  <TableCell><TableSortLabel active={sortConfig?.key === 'role'} direction={sortConfig?.direction} onClick={() => requestSort('role')}>Cargo</TableSortLabel></TableCell>
                  <TableCell><TableSortLabel active={sortConfig?.key === 'num_of_people'} direction={sortConfig?.direction} onClick={() => requestSort('num_of_people')}>Cantidad</TableSortLabel></TableCell>
                  <TableCell><TableSortLabel active={sortConfig?.key === 'request_type'} direction={sortConfig?.direction} onClick={() => requestSort('request_type')}>Tipo</TableSortLabel></TableCell>
                  <TableCell><TableSortLabel active={sortConfig?.key === 'start_date'} direction={sortConfig?.direction} onClick={() => requestSort('start_date')}>Fecha Requerida</TableSortLabel></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7}>Cargando...</TableCell></TableRow>
                ) : (
                  sortedRequests.map((req) => (
                    <TableRow key={req.id} hover>
                      <TableCell>
                        <IconButton onClick={() => handleOpenDialog(req)} size="small"><EditIcon /></IconButton>
                        <IconButton onClick={() => handleDeleteClick(req.id)} size="small" color="error"><DeleteIcon /></IconButton>
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small" variant="outlined">
                          <Select
                            value={req.status}
                            onChange={(e) => handleStatusChange(req.id, e.target.value as StaffingRequest['status'])}
                            renderValue={(selected) => (<Chip label={selected} color={statusColors[selected]} size="small" sx={{ width: '100%' }} />)}
                            sx={{ '.MuiOutlinedInput-notchedOutline': { border: 'none' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' }, '& .MuiSelect-icon': { right: 0 } }}
                          >
                            {Object.keys(statusColors).map(status => (<MenuItem key={status} value={status}>{status}</MenuItem>))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>{req.hotelName}</TableCell>
                      <TableCell>{req.role}</TableCell>
                      <TableCell>{req.num_of_people}</TableCell>
                      <TableCell>{req.request_type}</TableCell>
                      <TableCell>{new Date(req.start_date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <StaffingRequestDialog open={isDialogOpen} onClose={handleCloseDialog} onSubmit={handleSubmit} initialData={editingRequest} />
        <ConfirmationDialog open={isConfirmDialogOpen} onClose={() => setIsConfirmDialogOpen(false)} onConfirm={handleConfirmDelete} title="Confirmar Eliminación" message="¿Estás seguro de que quieres eliminar esta solicitud? Esta acción no se puede deshacer." />
        <Snackbar open={snackbar?.open} autoHideDuration={6000} onClose={() => setSnackbar(null)}>
          <Alert onClose={() => setSnackbar(null)} severity={snackbar?.severity || 'success'} sx={{ width: '100%' }}>
            {snackbar?.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}