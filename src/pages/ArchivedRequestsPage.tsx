import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Toolbar, Chip, IconButton } from '@mui/material';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useStaffingRequests } from '../hooks/useStaffingRequests';
import type { StaffingRequest } from '../types';
import ConfirmationDialog from '../components/common/ConfirmationDialog';

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

export default function ArchivedRequestsPage() {
  const { deleteRequest, unarchiveRequest, archivedRequests, loading } = useStaffingRequests();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<number | null>(null);

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

  return (
    <Box>
      <Toolbar />
      <Box component="main" sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Solicitudes Archivadas</Typography>

        <Paper sx={{ p: 2 }}>
          <TableContainer>
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
                ) : archivedRequests.length === 0 ? (
                  <TableRow><TableCell colSpan={7}>No hay solicitudes archivadas.</TableCell></TableRow>
                ) : (
                  archivedRequests.map((req) => (
                    <TableRow key={req.id} hover>
                      <TableCell>
                        <IconButton onClick={() => handleUnarchive(req.id)} size="small" color="primary"><UnarchiveIcon /></IconButton>
                        <IconButton onClick={() => handleDeleteClick(req.id)} size="small" color="error"><DeleteForeverIcon /></IconButton>
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
      </Box>
    </Box>
  );
}
