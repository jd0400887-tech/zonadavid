import { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, InputAdornment, FormControl, 
  InputLabel, Select, MenuItem, Button, ToggleButton, ToggleButtonGroup, 
  CircularProgress, IconButton, Snackbar, Alert, Stack, Divider, Tooltip
} from '@mui/material';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

// Iconos
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ArchiveIcon from '@mui/icons-material/Archive';
import RefreshIcon from '@mui/icons-material/Refresh';
import MapIcon from '@mui/icons-material/Map';
import ApartmentIcon from '@mui/icons-material/Apartment';
import FilterListIcon from '@mui/icons-material/FilterList';
import CategoryIcon from '@mui/icons-material/Category';

import { useStaffingRequestsContext } from '../contexts/StaffingRequestsContext';
import { useHotels } from '../hooks/useHotels';
import { useAuth } from '../hooks/useAuth';
import type { StaffingRequest } from '../types';
import KanbanColumn from '../components/staffing-requests/KanbanColumn';
import StaffingRequestDialog from '../components/staffing-requests/StaffingRequestDialog';
import ArchivedRequestsPage from './ArchivedRequestsPage';
import ConfirmationDialog from '../components/common/ConfirmationDialog';

const statusColumns: StaffingRequest['status'][] = [
  'Pendiente', 'Enviada a Reclutamiento', 'En Proceso', 'Completada', 'Completada Parcialmente', 'Candidato No Presentado', 'Cancelada por Hotel', 'Vencida',
];

const statusColors: { [key in StaffingRequest['status']]: { bg: string, text: string } } = {
  'Pendiente': { bg: '#f4f5f7', text: '#172b4d' },
  'Enviada a Reclutamiento': { bg: '#e6fcff', text: '#00526e' },
  'En Proceso': { bg: '#deebff', text: '#0747a6' },
  'Completada': { bg: '#e3fcef', text: '#006644' },
  'Completada Parcialmente': { bg: '#fffae6', text: '#974f0c' },
  'Candidato No Presentado': { bg: '#fffae6', text: '#974f0c' },
  'Cancelada por Hotel': { bg: '#ffebe6', text: '#bf2600' },
  'Vencida': { bg: '#ffebe6', text: '#bf2600' },
};

export default function StaffingRequestsPage() {
  const { profile } = useAuth();
  const { activeRequests, loading, addRequest, updateRequest, archiveRequest, deleteRequest, fetchRequests } = useStaffingRequestsContext();
  const { hotels } = useHotels();

  const [zoneFilter, setZoneFilter] = useState<'Todas' | 'Centro' | 'Norte' | 'Noroeste'>('Todas');
  const [hotelFilter, setHotelFilter] = useState<string>('all');
  const [requestTypeFilter, setRequestTypeFilter] = useState<'all' | 'temporal' | 'permanente'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<StaffingRequest | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'archived'>('kanban');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'info' | 'warning' | 'error' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const isAdmin = profile?.role === 'ADMIN';
  const isInspector = profile?.role === 'INSPECTOR';
  const isRecruiter = profile?.role === 'RECRUITER';

  const showMessage = (message: string, severity: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (request?: StaffingRequest) => {
    // Restricción: Reclutamiento no puede crear nuevas
    if (!request && isRecruiter) {
      showMessage('Como reclutador, no tienes permisos para crear nuevas solicitudes.', 'warning');
      return;
    }
    
    // Restricción: Inspector solo puede editar si es Pendiente
    if (request && isInspector && request.status !== 'Pendiente') {
      showMessage('Como inspector, solo puedes editar solicitudes en estado "Pendiente".', 'warning');
      return;
    }

    setEditingRequest(request || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRequest(null);
  };

  const handleSubmit = async (formData: Omit<StaffingRequest, 'id' | 'created_at' | 'hotelName' | 'is_archived'>) => {
    try {
      if (editingRequest) {
        await updateRequest(editingRequest.id, formData);
        showMessage('Solicitud actualizada correctamente', 'success');
      } else {
        await addRequest(formData);
        showMessage('Nueva solicitud creada', 'success');
      }
    } catch (error) {
      showMessage('Error al procesar la solicitud', 'error');
    }
  };

  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: 'kanban' | 'archived') => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleDeleteRequest = (id: number) => {
    setRequestToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (requestToDelete) {
      try {
        await deleteRequest(requestToDelete);
        showMessage('Solicitud eliminada', 'success');
      } catch (error) {
        showMessage('Error al eliminar la solicitud', 'error');
      }
    }
    setDeleteConfirmOpen(false);
    setRequestToDelete(null);
  };

  const filteredRequests = useMemo(() => {
    return activeRequests
      .filter(req => {
        if (zoneFilter === 'Todas') return true;
        const hotel = hotels.find(h => h.id === req.hotel_id);
        return hotel?.zone === zoneFilter;
      })
      .filter(req => hotelFilter === 'all' || req.hotel_id === hotelFilter)
      .filter(req => requestTypeFilter === 'all' || req.request_type === requestTypeFilter)
      .filter(req => {
        if (!searchTerm) return true;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return (req.role.toLowerCase().includes(lowerCaseSearch) || (req.notes && req.notes.toLowerCase().includes(lowerCaseSearch)));
      });
  }, [activeRequests, hotelFilter, searchTerm, zoneFilter, hotels]);

  const requestsByStatus = useMemo(() => {
    const grouped: { [key in StaffingRequest['status']]?: StaffingRequest[] } = {};
    statusColumns.forEach(status => {
      grouped[status] = filteredRequests.filter(req => req.status === status);
    });
    return grouped;
  }, [filteredRequests]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const request = activeRequests.find(r => r.id === activeId);
    if (!request) return;

    const activeContainer = active.data.current.sortable.containerId;
    const overContainer = (over.data.current?.sortable?.containerId || over.id) as StaffingRequest['status'];

    // Lógica de restricciones de movimiento
    if (isInspector) {
      // Inspector solo puede mover a Pendiente o Enviada a Reclutamiento
      if (overContainer !== 'Pendiente' && overContainer !== 'Enviada a Reclutamiento') {
        showMessage('Como inspector, solo puedes enviar solicitudes a Reclutamiento.', 'info');
        return;
      }
      // Y solo puede moverlas si están en Pendiente
      if (request.status !== 'Pendiente') {
        showMessage('Esta solicitud ya está siendo gestionada por Reclutamiento.', 'warning');
        return;
      }
    }

    if (isRecruiter) {
      // Reclutador no puede devolver a Pendiente
      if (overContainer === 'Pendiente') {
        showMessage('No puedes devolver una solicitud a estado Pendiente.', 'error');
        return;
      }
      // Reclutador solo actúa si ya fue enviada
      if (request.status === 'Pendiente') {
        showMessage('Debes esperar a que el inspector envíe la solicitud a Reclutamiento.', 'info');
        return;
      }
    }

    if (activeContainer !== overContainer) {
      updateRequest(activeId, { status: overContainer });
    }
  };

  if (loading && activeRequests.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>Cargando solicitudes...</Typography>
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ p: 2 }}>
      {/* ENCABEZADO MODERNO */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3, 
          background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
          border: '1px solid rgba(255, 87, 34, 0.1)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: 2 
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            backgroundColor: 'primary.main', 
            p: 1, 
            borderRadius: 2, 
            display: 'flex', 
            boxShadow: '0 4px 12px rgba(255, 87, 34, 0.3)' 
          }}>
            <FilterListIcon sx={{ color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>
              Solicitudes
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
              Gestión de personal y vacantes
            </Typography>
          </Box>
          
          <Tooltip title="Actualizar datos">
            <IconButton 
              onClick={() => fetchRequests()} 
              disabled={loading} 
              sx={{ 
                ml: 1,
                backgroundColor: 'rgba(255,255,255,0.05)',
                '&:hover': { backgroundColor: 'rgba(255, 87, 34, 0.1)' },
                animation: loading ? 'spin 2s linear infinite' : 'none',
                '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } }
              }}
            >
              <RefreshIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <ToggleButtonGroup 
            value={viewMode} 
            exclusive 
            onChange={handleViewModeChange} 
            size="small"
            sx={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, p: 0.5 }}
          >
            <ToggleButton value="kanban" sx={{ border: 'none', borderRadius: '8px !important', px: 2 }}>
              <ViewKanbanIcon sx={{ mr: 1, fontSize: 20 }} /> Kanban
            </ToggleButton>
            <ToggleButton value="archived" sx={{ border: 'none', borderRadius: '8px !important', px: 2 }}>
              <ArchiveIcon sx={{ mr: 1, fontSize: 20 }} /> Histórico
            </ToggleButton>
          </ToggleButtonGroup>

          {!isRecruiter && (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => handleOpenDialog()}
              sx={{ 
                borderRadius: 2, 
                px: 3, 
                py: 1,
                fontWeight: 'bold',
                boxShadow: '0 4px 14px 0 rgba(255, 87, 34, 0.39)',
                background: 'linear-gradient(45deg, #FF5722 30%, #FF8A65 90%)',
              }}
            >
              Nueva Solicitud
            </Button>
          )}
        </Stack>
      </Paper>

      {viewMode === 'kanban' ? (
        <>
          {/* BARRA DE FILTROS PREMIUM */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 2, 
              mb: 4, 
              borderRadius: 3, 
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField 
                  fullWidth 
                  placeholder="Buscar cargo o notas..." 
                  variant="outlined" 
                  size="small" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  InputProps={{ 
                    startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="primary" /></InputAdornment>,
                    sx: { borderRadius: 2 }
                  }} 
                />
              </Grid>
              
              <Grid item xs={12} sm={4} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filtrar por Zona</InputLabel>
                  <Select 
                    value={zoneFilter} 
                    label="Filtrar por Zona" 
                    onChange={(e) => { setZoneFilter(e.target.value as any); setHotelFilter('all'); }}
                    startAdornment={<InputAdornment position="start"><MapIcon fontSize="small" color="primary" /></InputAdornment>}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="Todas">Todas las Zonas</MenuItem>
                    <MenuItem value="Centro">Centro</MenuItem>
                    <MenuItem value="Norte">Norte</MenuItem>
                    <MenuItem value="Noroeste">Noroeste</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Hotel</InputLabel>
                  <Select 
                    value={hotelFilter} 
                    label="Hotel" 
                    onChange={(e) => setHotelFilter(e.target.value)}
                    startAdornment={<InputAdornment position="start"><ApartmentIcon fontSize="small" color="primary" /></InputAdornment>}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">Todos los Hoteles</MenuItem>
                    {hotels.filter(h => zoneFilter === 'Todas' || h.zone === zoneFilter).map(hotel => (
                      <MenuItem key={hotel.id} value={hotel.id}>{hotel.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select 
                    value={requestTypeFilter} 
                    label="Tipo" 
                    onChange={(e) => setRequestTypeFilter(e.target.value as any)}
                    startAdornment={<InputAdornment position="start"><CategoryIcon fontSize="small" color="primary" /></InputAdornment>}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">Todos los Tipos</MenuItem>
                    <MenuItem value="temporal">Temporal</MenuItem>
                    <MenuItem value="permanente">Permanente</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
            <Grid container spacing={2} sx={{ flexWrap: 'wrap' }}>
              {statusColumns.map(status => (
                <Grid item key={status} xs={12} sm={6} md={4} lg={3} sx={{ flexGrow: (requestsByStatus[status]?.length || 0) > 0 ? 1 : 0.1, transition: 'all 0.3s ease-in-out' }}>
                  <KanbanColumn 
                    id={status} 
                    title={status} 
                    requests={requestsByStatus[status] || []} 
                    bgColor={statusColors[status].bg} 
                    textColor={statusColors[status].text} 
                    onEditRequest={handleOpenDialog} 
                    onArchiveRequest={archiveRequest} 
                    onDeleteRequest={profile?.role === 'ADMIN' ? handleDeleteRequest : undefined}
                  />
                </Grid>
              ))}
            </Grid>
          </DndContext>
        </>
      ) : (
        <ArchivedRequestsPage />
      )}

      <StaffingRequestDialog open={isDialogOpen} onClose={handleCloseDialog} onSubmit={handleSubmit} initialData={editingRequest} />
      <ConfirmationDialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} onConfirm={handleConfirmDelete} title="Confirmar Eliminación" message="¿Estás seguro de que quieres eliminar esta solicitud? Esta acción no se puede deshacer." />
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 7 }} // Un poco de margen para que no tape el AppBar
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%', boxShadow: 3 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
