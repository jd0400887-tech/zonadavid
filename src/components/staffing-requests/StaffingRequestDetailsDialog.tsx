import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Grid, Chip, Box } from '@mui/material';
import type { StaffingRequest } from '../types';
import { format } from 'date-fns';

interface StaffingRequestDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  request: StaffingRequest | null;
}

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

export default function StaffingRequestDetailsDialog({ open, onClose, request }: StaffingRequestDetailsDialogProps) {
  if (!request) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Detalles de la Solicitud</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="textSecondary">Hotel:</Typography>
            <Typography variant="body1">{request.hotelName}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="textSecondary">Cargo:</Typography>
            <Typography variant="body1">{request.role}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" color="textSecondary">Cantidad:</Typography>
            <Typography variant="body1">{request.num_of_people}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" color="textSecondary">Tipo de Solicitud:</Typography>
            <Typography variant="body1">{request.request_type}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" color="textSecondary">Fecha Requerida:</Typography>
            <Typography variant="body1">{format(new Date(request.start_date), 'dd/MM/yyyy')}</Typography>
          </Grid>
          {request.end_date && (
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="textSecondary">Fecha Fin (Estimada):</Typography>
              <Typography variant="body1">{format(new Date(request.end_date), 'dd/MM/yyyy')}</Typography>
            </Grid>
          )}
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="textSecondary">Estado:</Typography>
            <Chip label={request.status} color={statusColors[request.status]} />
          </Grid>
          {request.notes && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" color="textSecondary">Notas:</Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{request.notes}</Typography>
            </Grid>
          )}
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="textSecondary">Creada el:</Typography>
            <Typography variant="body1">{format(new Date(request.created_at), 'dd/MM/yyyy HH:mm')}</Typography>
          </Grid>
          {request.completed_at && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" color="textSecondary">Completada el:</Typography>
              <Typography variant="body1">{format(new Date(request.completed_at), 'dd/MM/yyyy HH:mm')}</Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
