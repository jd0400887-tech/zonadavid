import { useState, useMemo } from 'react';
import { Box, Typography, Paper, Grid, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Button, ToggleButton, ToggleButtonGroup, CircularProgress } from '@mui/material';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
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

import RefreshIcon from '@mui/icons-material/Refresh';

// ... (dentro del componente StaffingRequestsPage)
export default function StaffingRequestsPage() {
  const { activeRequests, loading, addRequest, updateRequest, archiveRequest, deleteRequest, fetchRequests } = useStaffingRequestsContext();
  // ...
  return (
    <Box component="main" sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4">Gestión de Solicitudes</Typography>
          <IconButton onClick={() => fetchRequests()} disabled={loading} color="primary">
            <RefreshIcon className={loading ? 'rotating' : ''} />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
...

      {viewMode === 'kanban' ? (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="Buscar por Cargo o Notas" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={4} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filtrar por Zona</InputLabel>
                  <Select value={zoneFilter} label="Filtrar por Zona" onChange={(e) => { setZoneFilter(e.target.value as any); setHotelFilter('all'); }}>
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
                  <Select value={hotelFilter} label="Hotel" onChange={(e) => setHotelFilter(e.target.value)}>
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
                  <Select value={requestTypeFilter} label="Tipo" onChange={(e) => setRequestTypeFilter(e.target.value as any)}>
                    <MenuItem value="all">Todos</MenuItem>
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
                <Grid item key={status} xs={12} sm={6} md={4} lg={3} sx={{ flexGrow: (requestsByStatus[status]?.length || 0) > 0 ? 1 : 0.1, transition: 'flex-grow 0.3s ease-out' }}>
                  <KanbanColumn id={status} title={status} requests={requestsByStatus[status] || []} bgColor={statusColors[status].bg} textColor={statusColors[status].text} onEditRequest={handleOpenDialog} onArchiveRequest={archiveRequest} onDeleteRequest={handleDeleteRequest} />
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
    </Box>
  );
}