import { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, 
  FormControl, InputLabel, Grid, Tabs, Tab, Box, List, ListItem, ListItemText, 
  Typography, Chip, Stack, Autocomplete, InputAdornment, Divider, Paper, IconButton,
  Avatar, Tooltip, CircularProgress
} from '@mui/material';

// Iconos
import ApartmentIcon from '@mui/icons-material/Apartment';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import NotesIcon from '@mui/icons-material/Notes';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CategoryIcon from '@mui/icons-material/Category';
import HistoryIcon from '@mui/icons-material/History';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PublicIcon from '@mui/icons-material/Public';

import { useHotels } from '../../hooks/useHotels';
import { useEmployees } from '../../hooks/useEmployees';
import { useStaffingRequestsContext } from '../../contexts/StaffingRequestsContext';
import { useRequestCandidates } from '../../hooks/useRequestCandidates';
import { useAuth } from '../../hooks/useAuth';
import type { StaffingRequest, StaffingRequestHistory, RequestCandidate } from '../../types';

interface StaffingRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (request: Omit<StaffingRequest, 'id' | 'created_at' | 'hotelName'>) => Promise<void>;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { hotels } = useHotels();
  const { employees, roles } = useEmployees();
  const { fetchHistory } = useStaffingRequestsContext();
  const { profile } = useAuth();
  const { candidates, loading: candidatesLoading, addCandidate, updateCandidateStatus, deleteCandidate } = useRequestCandidates(initialData?.id || null);

  const [newCandidateName, setNewCandidateName] = useState('');
  const [selectedExistingEmployeeId, setSelectedExistingEmployeeId] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');

  const isInspector = profile?.role === 'INSPECTOR';
  const isRecruiter = profile?.role === 'RECRUITER';

  // --- Zone & Hotel Filter Logic ---
  const [selectedZone, setSelectedZone] = useState<string>('all');

  useEffect(() => {
    if (isInspector && profile?.assigned_zone) {
      setSelectedZone(profile.assigned_zone);
    }
  }, [isInspector, profile]);

  const filteredHotels = useMemo(() => {
    if (selectedZone === 'all') {
      return hotels;
    }
    return hotels.filter(hotel => hotel.zone === selectedZone);
  }, [hotels, selectedZone]);

  const filteredEmployees = useMemo(() => {
    if (!employeeSearchTerm) return employees;
    return employees.filter(emp => emp.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()));
  }, [employees, employeeSearchTerm]);

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
      const initialHotel = hotels.find(h => h.id === initialData.hotel_id);
      if (initialHotel && initialHotel.zone) {
        setSelectedZone(initialHotel.zone);
      } else {
        setSelectedZone('all');
      }
    } else {
      setFormData(defaultState);
      setHistory([]);
      setTab(0);
      if (isInspector && profile?.assigned_zone) {
        setSelectedZone(profile.assigned_zone);
      } else {
        setSelectedZone('all');
      }
    }
  }, [initialData, open, fetchHistory, hotels, isInspector, profile]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const utcDate = new Date(`${formData.start_date}T00:00:00`);
    const submissionData = {
      ...formData,
      start_date: utcDate.toISOString(),
    };
    try {
      await onSubmit(submissionData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableStatuses = useMemo(() => {
    const allStatuses: StaffingRequest['status'][] = ['Pendiente', 'Enviada a Reclutamiento', 'En Proceso', 'Completada', 'Completada Parcialmente', 'Candidato No Presentado', 'Cancelada por Hotel', 'Vencida'];
    if (isInspector) return ['Pendiente', 'Enviada a Reclutamiento'];
    if (isRecruiter) return allStatuses.filter(s => s !== 'Pendiente');
    return allStatuses;
  }, [isInspector, isRecruiter]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, backgroundImage: 'none' }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1.5,
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        {initialData ? <WorkIcon color="primary" /> : <GroupAddIcon color="primary" />}
        <Typography variant="h5" component="span" sx={{ fontWeight: 800 }}>
          {initialData ? 'Gestionar Solicitud' : 'Nueva Solicitud de Personal'}
        </Typography>
      </DialogTitle>

      <Box sx={{ px: 2, pt: 1 }}>
        <Tabs 
          value={tab} 
          onChange={handleTabChange} 
          variant="fullWidth"
          sx={{ 
            minHeight: 48,
            '& .MuiTab-root': { fontWeight: 'bold', fontSize: '0.85rem' }
          }}
        >
          <Tab icon={<InfoOutlinedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Detalles" />
          <Tab icon={<HistoryIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Historial" disabled={!initialData} />
          <Tab icon={<GroupAddIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Candidatos" disabled={!initialData} />
        </Tabs>
      </Box>

      <DialogContent sx={{ mt: 1 }}>
        {tab === 0 && (
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {/* --- SECCIÓN 1: UBICACIÓN Y PERFIL --- */}
            <Grid item xs={12}>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 'bold', letterSpacing: 1.2 }}>
                Ubicación y Perfil
              </Typography>
              <Divider sx={{ mb: 2, mt: 0.5, borderColor: 'rgba(255, 87, 34, 0.2)' }} />
            </Grid>

            {!isInspector && (
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel id="zone-select-label">Filtrar por Zona</InputLabel>
                  <Select
                    labelId="zone-select-label"
                    value={selectedZone}
                    label="Filtrar por Zona"
                    startAdornment={<InputAdornment position="start"><PublicIcon fontSize="small" color="primary" /></InputAdornment>}
                    onChange={(e) => {
                      setSelectedZone(e.target.value as string);
                      if (formData.hotel_id && !filteredHotels.some(h => h.id === formData.hotel_id && h.zone === e.target.value)) {
                        setFormData(prev => ({ ...prev, hotel_id: '' }));
                      }
                    }}
                  >
                    <MenuItem value="all">Todas las Zonas</MenuItem>
                    <MenuItem value="Centro">Centro</MenuItem>
                    <MenuItem value="Norte">Norte</MenuItem>
                    <MenuItem value="Noroeste">Noroeste</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <Autocomplete
                options={filteredHotels}
                getOptionLabel={(option) => option.name}
                value={hotels.find(h => h.id === formData.hotel_id) || null}
                onChange={(_event, newValue) => {
                  setFormData(prev => ({ ...prev, hotel_id: newValue ? newValue.id : '' }));
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Hotel Destino" 
                    variant="outlined"
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <ApartmentIcon fontSize="small" color="primary" />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                noOptionsText={isInspector ? `No hay hoteles en la zona ${selectedZone}` : "No se encontraron hoteles"}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Cargo Requerido</InputLabel>
                <Select 
                  name="role" 
                  value={formData.role} 
                  onChange={handleChange} 
                  label="Cargo Requerido"
                  startAdornment={<InputAdornment position="start"><WorkIcon fontSize="small" color="primary" /></InputAdornment>}
                >
                  {roles && roles.map(role => (<MenuItem key={role} value={role}>{role}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Solicitud</InputLabel>
                <Select 
                  name="request_type" 
                  value={formData.request_type} 
                  onChange={handleChange} 
                  label="Tipo de Solicitud"
                  startAdornment={<InputAdornment position="start"><CategoryIcon fontSize="small" color="primary" /></InputAdornment>}
                >
                  <MenuItem value="temporal">Temporal</MenuItem>
                  <MenuItem value="permanente">Permanente</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* --- SECCIÓN 2: LOGÍSTICA Y ESTADO --- */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 'bold', letterSpacing: 1.2 }}>
                Logística y Estado
              </Typography>
              <Divider sx={{ mb: 2, mt: 0.5, borderColor: 'rgba(255, 87, 34, 0.2)' }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                type="number" 
                label="Vacantes" 
                name="num_of_people" 
                size="small"
                value={formData.num_of_people} 
                onChange={handleChange} 
                InputProps={{ 
                  inputProps: { min: 1 },
                  startAdornment: <InputAdornment position="start"><PeopleIcon fontSize="small" color="primary" /></InputAdornment>
                }} 
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                type="date" 
                label="Fecha de Inicio" 
                name="start_date" 
                size="small"
                value={formData.start_date} 
                onChange={handleChange} 
                InputLabelProps={{ shrink: true }} 
                InputProps={{
                  startAdornment: <InputAdornment position="start"><CalendarTodayIcon fontSize="small" color="primary" /></InputAdornment>
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado de la Solicitud</InputLabel>
                <Select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange} 
                  label="Estado de la Solicitud"
                  startAdornment={<InputAdornment position="start"><AssignmentIndIcon fontSize="small" color="primary" /></InputAdornment>}
                >
                  {availableStatuses.map(status => (
                    <MenuItem key={status} value={status}>
                      <Chip label={status} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField 
                fullWidth 
                multiline 
                rows={2} 
                label="Observaciones" 
                name="notes" 
                size="small"
                value={formData.notes || ''} 
                onChange={handleChange} 
                InputProps={{
                  startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}><NotesIcon fontSize="small" color="primary" /></InputAdornment>
                }}
              />
            </Grid>
          </Grid>
        )}

        {tab === 1 && (
          <Box sx={{ py: 1 }}>
            {history.length > 0 ? (
              <Stack spacing={2}>
                {history.map((entry, idx) => (
                  <Paper key={entry.id} variant="outlined" sx={{ p: 1.5, borderLeft: '4px solid #FF5722', position: 'relative' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{entry.change_description}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">Por: {entry.changed_by || 'Sistema'}</Typography>
                      <Typography variant="caption" color="text.secondary">{new Date(entry.created_at).toLocaleString()}</Typography>
                    </Box>
                    {idx < history.length - 1 && <Divider sx={{ position: 'absolute', bottom: -10, left: 20, height: 10, borderLeft: '2px dashed rgba(255,255,255,0.1)' }} />}
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                <HistoryIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
                <Typography>Sin historial registrado</Typography>
              </Box>
            )}
          </Box>
        )}

        {tab === 2 && (
          <Box sx={{ py: 1 }}>
            <Paper sx={{ p: 2, mb: 3, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupAddIcon fontSize="small" color="primary" /> Asignar Candidato
              </Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={7}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Nombre del candidato externo..."
                    value={newCandidateName}
                    onChange={(e) => setNewCandidateName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={async () => {
                      if (newCandidateName && initialData?.id) {
                        await addCandidate({ request_id: initialData.id, candidate_name: newCandidateName, existing_employee_id: null });
                        setNewCandidateName('');
                      }
                    }}
                    disabled={!newCandidateName || !initialData?.id}
                  >
                    Añadir Externo
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>o seleccionar existente</Divider>
                </Grid>
                <Grid item xs={12} sm={7}>
                  <Autocomplete
                    size="small"
                    options={employees}
                    getOptionLabel={(option) => option.name}
                    onChange={(_e, val) => setSelectedExistingEmployeeId(val ? val.id : '')}
                    renderInput={(params) => <TextField {...params} label="Buscar Empleado" />}
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={async () => {
                      if (selectedExistingEmployeeId && initialData?.id) {
                        await addCandidate({ request_id: initialData.id, candidate_name: null, existing_employee_id: selectedExistingEmployeeId });
                        setSelectedExistingEmployeeId('');
                      }
                    }}
                    disabled={!selectedExistingEmployeeId || !initialData?.id}
                  >
                    Asignar
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {candidatesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={30} /></Box>
            ) : candidates.length > 0 ? (
              <Stack spacing={1.5}>
                {candidates.map(candidate => {
                  const emp = employees.find(e => e.id === candidate.existing_employee_id);
                  return (
                    <Paper key={candidate.id} sx={{ 
                      p: 1.5, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      border: '1px solid rgba(255,255,255,0.05)',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' }
                    }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.9rem' }}>
                        {(candidate.candidate_name || emp?.name || '?')[0].toUpperCase()}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {candidate.candidate_name || emp?.name || 'Desconocido'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {candidate.existing_employee_id ? 'Empleado del sistema' : 'Candidato externo'}
                        </Typography>
                      </Box>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={candidate.status}
                          sx={{ fontSize: '0.75rem', height: 32 }}
                          onChange={(e) => updateCandidateStatus(candidate.id, e.target.value as RequestCandidate['status'])}
                        >
                          <MenuItem value="Asignado">Asignado</MenuItem>
                          <MenuItem value="Llegó">Llegó</MenuItem>
                          <MenuItem value="No llegó">No llegó</MenuItem>
                          <MenuItem value="Confirmado">Confirmado</MenuItem>
                        </Select>
                      </FormControl>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => deleteCandidate(candidate.id)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Paper>
                  );
                })}
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4, opacity: 0.5 }}>
                <PeopleIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2">No hay candidatos asignados</Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 'bold' }}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={tab === 1 || isSubmitting}
          sx={{ 
            px: 4, 
            fontWeight: 'bold',
            borderRadius: 2,
            boxShadow: '0 4px 14px 0 rgba(255, 87, 34, 0.39)',
            background: 'linear-gradient(45deg, #FF5722 30%, #FF8A65 90%)',
          }}
        >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (initialData ? 'Guardar Cambios' : 'Crear Solicitud')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
