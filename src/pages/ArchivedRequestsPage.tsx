import { useState, useMemo } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Toolbar, Chip, IconButton, Grid, TextField, Select, MenuItem, InputLabel, FormControl, Button } from '@mui/material';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useStaffingRequestsContext } from '../contexts/StaffingRequestsContext';
import type { StaffingRequest } from '../types';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import StaffingRequestDetailsDialog from '../components/staffing-requests/StaffingRequestDetailsDialog'; // Import the new dialog

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

const allStatuses: StaffingRequest['status'][] = ['Pendiente', 'Enviada a Reclutamiento', 'En Proceso', 'Completada', 'Completada Parcialmente', 'Cancelada por Hotel', 'Candidato No Presentado', 'Vencida'];
const requestTypes = ['Temporal', 'Permanente'];

export default function ArchivedRequestsPage() {
  const { deleteRequest, unarchiveRequest, archivedRequests, loading } = useStaffingRequestsContext();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<number | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false); // State for details dialog
  const [selectedRequest, setSelectedRequest] = useState<StaffingRequest | null>(null); // State for selected request

  const [filters, setFilters] = useState({
    hotelName: '',
    role: '',
    status: '',
    request_type: '',
    startDate: '',
    endDate: '',
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name as string]: value as string }));
  };

  const handleClearFilters = () => {
    setFilters({
      hotelName: '',
      role: '',
      status: '',
      request_type: '',
      startDate: '',
      endDate: '',
    });
  };

  const filteredRequests = useMemo(() => {
    return archivedRequests.filter(req => {
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      const reqDate = new Date(req.start_date);

      if (startDate && reqDate < startDate) return false;
      if (endDate && reqDate > endDate) return false;

      return (
        req.hotelName.toLowerCase().includes(filters.hotelName.toLowerCase()) &&
        req.role.toLowerCase().includes(filters.role.toLowerCase()) &&
        (filters.status === '' || req.status === filters.status) &&
        (filters.request_type === '' || req.request_type === filters.request_type)
      );
    });
  }, [archivedRequests, filters]);

  const handleUnarchive = async (id: number) => {
    await unarchiveRequest(id);
  };

  const handleDeleteClick = (id: number) => {
    setRequestToDelete(id);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (requestToDelete) {
      await deleteRequest(requestToDelete);
    }
    setIsConfirmDialogOpen(false);
    setRequestToDelete(null);
  };

  const handleRowClick = (request: StaffingRequest) => {
    setSelectedRequest(request);
    setIsDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setIsDetailsDialogOpen(false);
    setSelectedRequest(null);
  };

  return (
    <Box>
      <Toolbar />
      <Box component="main" sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Solicitudes Archivadas</Typography>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Filtros</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Hotel"
                name="hotelName"
                value={filters.hotelName}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Cargo"
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  label="Estado"
                >
                  <MenuItem value=""><em>Todos</em></MenuItem>
                  {allStatuses.map(status => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Solicitud</InputLabel>
                <Select
                  name="request_type"
                  value={filters.request_type}
                  onChange={handleFilterChange}
                  label="Tipo de Solicitud"
                >
                  <MenuItem value=""><em>Todos</em></MenuItem>
                  {requestTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Desde Fecha"
                name="startDate"
                type="date"
                value={filters.startDate}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Hasta Fecha"
                name="endDate"
                type="date"
                value={filters.endDate}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleClearFilters}
                fullWidth
                size="medium"
                sx={{ height: '40px' }} // Match height of text fields
              >
                Limpiar Filtros
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <TableContainer sx={{ 
            maxHeight: 600, // Set a max height to enable scrolling
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
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Acciones</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Hotel</TableCell>
                  <TableCell>Cargo</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Fecha Requerida</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7}>Cargando...</TableCell></TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow><TableCell colSpan={7}>No hay solicitudes archivadas que coincidan con los filtros.</TableCell></TableRow>
                ) : (
                  filteredRequests.map((req) => (
                    <TableRow key={req.id} hover onClick={() => handleRowClick(req)} sx={{ cursor: 'pointer' }}>
                      <TableCell>
                        <IconButton onClick={(e) => { e.stopPropagation(); handleUnarchive(req.id); }} size="small" color="primary"><UnarchiveIcon /></IconButton>
                        <IconButton onClick={(e) => { e.stopPropagation(); handleDeleteClick(req.id); }} size="small" color="error"><DeleteForeverIcon /></IconButton>
                      </TableCell>
                      <TableCell>
                        <Chip label={req.status} color={statusColors[req.status]} size="small" />
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

        <ConfirmationDialog open={isConfirmDialogOpen} onClose={() => setIsConfirmDialogOpen(false)} onConfirm={handleConfirmDelete} title="Confirmar Eliminación" message="¿Estás seguro de que quieres eliminar esta solicitud archivada? Esta acción no se puede deshacer." />
        <StaffingRequestDetailsDialog open={isDetailsDialogOpen} onClose={handleCloseDetailsDialog} request={selectedRequest} />
      </Box>
    </Box>
  );
}
