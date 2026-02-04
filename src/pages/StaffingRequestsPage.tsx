
import { useState, useMemo } from 'react';
import { Box, Typography, Paper, Grid, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Toolbar, Button, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useStaffingRequestsContext } from '../contexts/StaffingRequestsContext';
import { useHotels } from '../hooks/useHotels';
import type { StaffingRequest } from '../types';
import KanbanColumn from '../components/staffing-requests/KanbanColumn';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ArchiveIcon from '@mui/icons-material/Archive';
import StaffingRequestDialog from '../components/staffing-requests/StaffingRequestDialog';
import ArchivedRequestsPage from './ArchivedRequestsPage';
import ConfirmationDialog from '../components/common/ConfirmationDialog';

const statusColumns: StaffingRequest['status'][] = [
  'Pendiente',
  'Enviada a Reclutamiento',
  'En Proceso',
  'Completada',
  'Completada Parcialmente',
  'Candidato No Presentado',
  'Cancelada por Hotel',
  'Vencida',
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
  const { activeRequests, addRequest, updateRequest, archiveRequest, deleteRequest } = useStaffingRequestsContext();
  const { hotels } = useHotels();

  const [hotelFilter, setHotelFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<StaffingRequest | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'archived'>('kanban');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<number | null>(null);

  const handleOpenDialog = (request?: StaffingRequest) => {
    setEditingRequest(request || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRequest(null);
  };

  const handleSubmit = async (formData: Omit<StaffingRequest, 'id' | 'created_at' | 'hotelName' | 'is_archived'>) => {
    if (editingRequest) {
      await updateRequest(editingRequest.id, formData);
    } else {
      await addRequest(formData);
    }
  };

  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'kanban' | 'archived') => {
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
      await deleteRequest(requestToDelete);
    }
    setDeleteConfirmOpen(false);
    setRequestToDelete(null);
  };

  const filteredRequests = useMemo(() => {
    return activeRequests
      .filter(req => hotelFilter === 'all' || req.hotel_id === hotelFilter)
      .filter(req => {
        if (!searchTerm) return true;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return (
          req.role.toLowerCase().includes(lowerCaseSearch) ||
          (req.notes && req.notes.toLowerCase().includes(lowerCaseSearch))
        );
      });
  }, [activeRequests, hotelFilter, searchTerm]);

  const requestsByStatus = useMemo(() => {
    const grouped: { [key in StaffingRequest['status']]?: StaffingRequest[] } = {};
    statusColumns.forEach(status => {
      grouped[status] = filteredRequests.filter(req => req.status === status);
    });
    return grouped;
  }, [filteredRequests]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require mouse to move 8px to start dragging
      },
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeContainer = active.data.current.sortable.containerId;
    const overContainer = over.data.current?.sortable?.containerId || over.id;

    if (activeContainer !== overContainer) {
      const newStatus = overContainer as StaffingRequest['status'];
      updateRequest(activeId, { status: newStatus });
    }
  };

  return (
    <Box>
      <Toolbar />
      <Box component="main" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">Gestión de Solicitudes</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              aria-label="view mode"
              size="small"
            >
              <ToggleButton value="kanban" aria-label="kanban view">
                <ViewKanbanIcon />
              </ToggleButton>
              <ToggleButton value="archived" aria-label="archived view">
                <ArchiveIcon />
              </ToggleButton>
            </ToggleButtonGroup>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Nueva Solicitud
            </Button>
          </Box>
        </Box>

        {viewMode === 'kanban' ? (
          <>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
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
                <Grid item xs={12} sm={6}>
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
              </Grid>
            </Paper>

            <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
              <Grid container spacing={2} sx={{ flexWrap: 'wrap' }}>
                {statusColumns.map(status => (
                  <Grid item key={status} xs={12} sm={6} md={4} lg={3} sx={{ 
                    flexGrow: (requestsByStatus[status] && requestsByStatus[status].length > 0) ? 1 : 0.1,
                    transition: 'flex-grow 0.3s ease-out', // Smooth transition for resizing
                  }}>
                    <KanbanColumn
                      id={status}
                      title={status}
                      requests={requestsByStatus[status] || []}
                      bgColor={statusColors[status].bg}
                      textColor={statusColors[status].text}
                      onEditRequest={handleOpenDialog}
                      onArchiveRequest={archiveRequest}
                      onDeleteRequest={handleDeleteRequest}
                    />
                  </Grid>
                ))}
              </Grid>
            </DndContext>
          </>
        ) : (
          <ArchivedRequestsPage />
        )}

        <StaffingRequestDialog 
          open={isDialogOpen} 
          onClose={handleCloseDialog} 
          onSubmit={handleSubmit} 
          initialData={editingRequest} 
        />
        <ConfirmationDialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Confirmar Eliminación"
          message="¿Estás seguro de que quieres eliminar esta solicitud? Esta acción no se puede deshacer."
        />
      </Box>
    </Box>
  );
}
