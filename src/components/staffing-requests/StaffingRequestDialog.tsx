

import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, FormControl, InputLabel, Grid, Tabs, Tab, Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import { useHotels } from '../../hooks/useHotels';
import { useEmployees } from '../../hooks/useEmployees';
import { useStaffingRequests } from '../../hooks/useStaffingRequests';
import type { StaffingRequest, StaffingRequestHistory } from '../../types';

interface StaffingRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (request: Omit<StaffingRequest, 'id' | 'created_at' | 'hotelName'>) => void;
  initialData?: StaffingRequest | null;
}

const defaultState: Omit<StaffingRequest, 'id' | 'created_at' | 'hotelName'> = {
  hotel_id: '',
  request_type: 'temporal',
  num_of_people: 1,
  role: '',
  start_date: new Date().toISOString().split('T')[0],
  status: 'Pendiente',
  notes: '',
};

export default function StaffingRequestDialog({ open, onClose, onSubmit, initialData }: StaffingRequestDialogProps) {
  const [formData, setFormData] = useState(defaultState);
  const [tab, setTab] = useState(0);
  const [history, setHistory] = useState<StaffingRequestHistory[]>([]);
  
  const { hotels } = useHotels();
  const { roles } = useEmployees();
  const { fetchHistory } = useStaffingRequests();

  useEffect(() => {
    if (initialData && open) {
      setFormData({
        ...defaultState,
        ...initialData,
        start_date: new Date(initialData.start_date).toISOString().split('T')[0],
      });
      
      const loadHistory = async () => {
        const historyData = await fetchHistory(initialData.id);
        setHistory(historyData);
      };
      loadHistory();
      
    } else {
      setFormData(defaultState);
      setHistory([]);
      setTab(0);
    }
  }, [initialData, open, fetchHistory]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const handleSubmit = () => {
    const utcDate = new Date(`${formData.start_date}T00:00:00`);
    const submissionData = {
      ...formData,
      start_date: utcDate.toISOString(),
    };
    onSubmit(submissionData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? 'Editar Solicitud' : 'Nueva Solicitud'}</DialogTitle>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={handleTabChange} aria-label="request details tabs">
          <Tab label="Detalles" />
          <Tab label="Historial" disabled={!initialData} />
        </Tabs>
      </Box>
      <DialogContent>
        {tab === 0 && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="hotel-select-label">Hotel</InputLabel>
                <Select labelId="hotel-select-label" name="hotel_id" value={formData.hotel_id} onChange={handleChange} label="Hotel">
                  {hotels.map(hotel => (<MenuItem key={hotel.id} value={hotel.id}>{hotel.name}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="type-select-label">Tipo de Solicitud</InputLabel>
                <Select labelId="type-select-label" name="request_type" value={formData.request_type} onChange={handleChange} label="Tipo de Solicitud">
                  <MenuItem value="temporal">Temporal</MenuItem>
                  <MenuItem value="permanente">Permanente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="role-select-label">Cargo Requerido</InputLabel>
                <Select labelId="role-select-label" name="role" value={formData.role} onChange={handleChange} label="Cargo Requerido">
                  {roles.map(role => (<MenuItem key={role} value={role}>{role}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Cantidad de Personas" name="num_of_people" value={formData.num_of_people} onChange={handleChange} InputProps={{ inputProps: { min: 1 } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Fecha Requerida" name="start_date" value={formData.start_date} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Notas Adicionales" name="notes" value={formData.notes || ''} onChange={handleChange} />
            </Grid>
          </Grid>
        )}
        {tab === 1 && (
          <List>
            {history.length > 0 ? history.map(entry => (
              <ListItem key={entry.id} dense>
                <ListItemText
                  primary={entry.change_description}
                  secondary={`Por ${entry.changed_by || 'Sistema'} el ${new Date(entry.created_at).toLocaleString()}`}
                />
              </ListItem>
            )) : (
              <Typography sx={{ p: 2 }}>No hay historial de cambios para esta solicitud.</Typography>
            )}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={tab === 1}>
          {initialData ? 'Guardar Cambios' : 'Crear Solicitud'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}