import { useState, useMemo } from 'react';
import { Box, Typography, Paper, Toolbar, Button, Snackbar, Alert, Grid, TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel, Chip, FormControlLabel, Switch, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useApplications, Application } from '../hooks/useApplications';
import { useHotels } from '../hooks/useHotels';
import EmployeeForm from '../components/employees/EmployeeForm';
import FormModal from '../components/form/FormModal';
import { useEmployees } from '../hooks/useEmployees';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import ApplicationForm from '../components/applications/ApplicationForm';
import { EMPLOYEE_POSITIONS } from '../data/constants';

// Placeholder for the new Card component
const applicationStatusColors: { [key in Application['status']]: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error' } = {
  'pendiente': 'warning',
  'completada': 'info',
  'empleado_creado': 'success',
};

const ApplicationCard = ({ application, onStatusChange, onAddEmployee, onDelete, getHotelName }: any) => (
  <Paper sx={{
    position: 'relative', // Needed for absolute positioning of the delete icon
    p: 2, 
    height: '100%', 
    border: '1px solid #FF5722', 
    boxShadow: '0 0 2px #FF5722',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Subtle background for cards
    color: '#FFFFFF',
  }}>
    <IconButton 
      aria-label="delete"
      onClick={() => onDelete(application.id)}
      sx={{
        position: 'absolute',
        top: 8,
        right: 8,
        color: 'grey.500',
      }}
    >
      <DeleteIcon />
    </IconButton>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, pr: 4 /* Make space for delete icon */ }}>
      <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'primary.main' }}>
        {application.candidate_name}
      </Typography>
      <Chip 
        label={application.status === 'empleado_creado' ? 'Empleado Creado' : application.status}
        color={applicationStatusColors[application.status] || 'default'}
        size="small"
        sx={{ textTransform: 'capitalize' }}
      />
    </Box>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
      Cargo: {application.role}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
      Hotel: {getHotelName(application.hotel_id)}
    </Typography>
    <Typography variant="caption" display="block" sx={{ mb: 1 }}>
      Creada: {new Date(application.created_at).toLocaleDateString()}
    </Typography>
    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
      <Button 
        variant={application.status === 'pendiente' ? 'contained' : 'outlined'} 
        onClick={() => onStatusChange(application.id, 'pendiente')}
        size="small"
        disabled={application.status === 'empleado_creado'}
      >
        Pendiente
      </Button>
      <Button 
        variant={application.status === 'completada' ? 'contained' : 'outlined'} 
        onClick={() => onStatusChange(application.id, 'completada')}
        size="small"
        disabled={application.status === 'empleado_creado'}
      >
        Completada
      </Button>
    </Box>
    {application.status === 'completada' && (
      <Button 
        variant="contained" 
        color="success" 
        size="small" 
        onClick={() => onAddEmployee(application)} 
        sx={{ mt: 1 }}
        disabled={application.status === 'empleado_creado'}
      >
        Añadir Empleado
      </Button>
    )}
  </Paper>
);

export default function ApplicationsPage() {
  const { applications, loading, updateApplicationStatus, deleteApplication, addApplication } = useApplications();
  const { hotels } = useHotels();
  const { employees, addEmployee } = useEmployees();

  // State for Modals and Snackbar
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState<Partial<Application> | null>(null);
  const [newEmployeeFormData, setNewEmployeeFormData] = useState<any>(null);
  const [newApplicationFormData, setNewApplicationFormData] = useState({ candidate_name: '', hotel_id: '', role: '' });
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: number | null }>({ open: false, id: null });

  // State for Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [hotelFilter, setHotelFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreated, setShowCreated] = useState(false); // State for the new toggle

  const handleStatusChange = async (id: number, newStatus: Application['status']) => {
    try {
      await updateApplicationStatus(id, newStatus);
      setSnackbar({ open: true, message: 'Estado de la aplicación actualizado', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al actualizar el estado', severity: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    setConfirmDelete({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete.id) {
      try {
        await deleteApplication(confirmDelete.id);
        setSnackbar({ open: true, message: 'Aplicación eliminada correctamente', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Error al eliminar la aplicación', severity: 'error' });
      }
    }
    setConfirmDelete({ open: false, id: null });
  };

  const handleOpenAddEmployeeModal = (application: Application) => {
    setCurrentCandidate(application);
    setNewEmployeeFormData({
      name: application.candidate_name,
      hotelId: application.hotel_id,
      role: application.role,
      isActive: true,
      isBlacklisted: false,
      payrollType: 'timesheet', // Default value
      employeeType: 'permanente', // Default value
    });
    setIsEmployeeModalOpen(true);
  };

  const handleCloseEmployeeModal = () => {
    setIsEmployeeModalOpen(false);
    setCurrentCandidate(null);
    setNewEmployeeFormData(null);
  };
  
  const handleOpenNewAppModal = () => {
    setNewApplicationFormData({ candidate_name: '', hotel_id: '', role: '' });
    setIsAppModalOpen(true);
  };

  const handleCloseNewAppModal = () => {
    setIsAppModalOpen(false);
  };

  const handleNewAppFormChange = (field: string, value: any) => {
    setNewApplicationFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveApplication = async () => {
    try {
      await addApplication(newApplicationFormData);
      setSnackbar({ open: true, message: 'Aplicación creada correctamente', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al crear la aplicación', severity: 'error' });
    }
    handleCloseNewAppModal();
  };

  const handleEmployeeFormChange = (field: string, value: any) => {
    setNewEmployeeFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEmployee = async () => {
    try {
      await addEmployee({
        name: newEmployeeFormData.name,
        hotelId: newEmployeeFormData.hotelId,
        role: newEmployeeFormData.role,
        payrollType: newEmployeeFormData.payrollType,
        employeeType: newEmployeeFormData.employeeType,
        isActive: newEmployeeFormData.isActive,
        isBlacklisted: newEmployeeFormData.isBlacklisted,
      });
      if (currentCandidate?.id) {
        await updateApplicationStatus(currentCandidate.id, 'empleado_creado');
      }
      setSnackbar({ open: true, message: 'Empleado creado correctamente', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al crear el empleado', severity: 'error' });
    }
    handleCloseEmployeeModal();
  };

  const getHotelName = (hotelId: string) => {
    return hotels.find(h => h.id === hotelId)?.name || 'Hotel no encontrado';
  };

  const hotelsWithEmployees = useMemo(() => {
    const employeeHotelIds = new Set(employees.map(emp => emp.hotelId));
    return hotels.filter(hotel => employeeHotelIds.has(hotel.id));
  }, [employees, hotels]);



  const filteredApplications = useMemo(() => {
    return applications
      .filter(app => {
        // Hotel filter
        if (hotelFilter !== 'all' && app.hotel_id !== hotelFilter) {
          return false;
        }
        
        // Status and toggle filter
        if (statusFilter === 'all') {
          return app.status !== 'empleado_creado' || showCreated;
        }
        return app.status === statusFilter;
      })
      .filter(app => app.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [applications, statusFilter, hotelFilter, searchTerm, showCreated]);

  const pendingApplications = filteredApplications.filter(app => app.status === 'pendiente');
  const completedApplications = filteredApplications.filter(app => app.status === 'completada' || app.status === 'empleado_creado');

  return (
    <Box>
      <Toolbar />
      <Box component="main" sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Seguimiento de Aplicaciones</Typography>

        {/* Filter Controls */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Buscar por Nombre de Candidato"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={statusFilter}
                  label="Estado"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos (sin creados)</MenuItem>
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="completada">Completada</MenuItem>
                  <MenuItem value="empleado_creado">Solo Empleados Creados</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Hotel</InputLabel>
                <Select
                  value={hotelFilter}
                  label="Hotel"
                  onChange={(e) => setHotelFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos los Hoteles</MenuItem>
                  {hotels.map(hotel => (
                    <MenuItem key={hotel.id} value={hotel.id}>{hotel.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button fullWidth variant="contained" onClick={handleOpenNewAppModal}>
                Nueva Aplicación
              </Button>
            </Grid>
          </Grid>
        </Paper>
        
        {/* ... Rest of the component, modals will be at the end */}
        
        {/* Modal for creating application */}
        <FormModal
          open={isAppModalOpen}
          onClose={handleCloseNewAppModal}
          onSave={handleSaveApplication}
          title="Crear Nueva Aplicación"
        >
          <ApplicationForm
            formData={newApplicationFormData}
            onFormChange={handleNewAppFormChange}
            hotels={hotelsWithEmployees}
            roles={EMPLOYEE_POSITIONS}
          />
        </FormModal>

        {/* Pending Applications */}
        <Box mb={4}>
          <Typography variant="h5" gutterBottom>Pendientes ({pendingApplications.length})</Typography>
          {loading ? (
            <Typography>Cargando...</Typography>
          ) : pendingApplications.length > 0 ? (
            <Grid container spacing={3}>
              {pendingApplications.map(app => (
                <Grid item key={app.id} xs={12} sm={6} md={4}>
                  <ApplicationCard 
                    application={app} 
                    onStatusChange={handleStatusChange} 
                    onAddEmployee={handleOpenAddEmployeeModal} 
                    onDelete={handleDelete}
                    getHotelName={getHotelName} 
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography>No hay aplicaciones pendientes.</Typography>
          )}
        </Box>

        {/* Completed Applications */}
        <Box>
          <Typography variant="h5" gutterBottom>Completadas ({completedApplications.length})</Typography>
          {loading ? (
            <Typography>Cargando...</Typography>
          ) : completedApplications.length > 0 ? (
            <Box sx={{ 
              maxHeight: 600, 
              overflowY: 'auto',
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
              <Grid container spacing={3}>
                {completedApplications.map(app => (
                  <Grid item key={app.id} xs={12} sm={6} md={4}>
                    <ApplicationCard 
                      application={app} 
                      onStatusChange={handleStatusChange} 
                      onAddEmployee={handleOpenAddEmployeeModal}
                      onDelete={handleDelete}
                      getHotelName={getHotelName} 
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            <Typography>No hay aplicaciones completadas.</Typography>
          )}
        </Box>

        {/* Modal for adding employee */}
        {currentCandidate && newEmployeeFormData && (
          <FormModal
            open={isEmployeeModalOpen}
            onClose={handleCloseEmployeeModal}
            onSave={handleSaveEmployee}
            title={`Añadir Nuevo Empleado: ${currentCandidate.candidate_name}`}
          >
            <EmployeeForm
              employeeData={newEmployeeFormData}
              onFormChange={handleEmployeeFormChange}
              hotels={hotels}
              onToggleBlacklist={() => {}}
            />
          </FormModal>
        )}

        <Snackbar open={snackbar?.open} autoHideDuration={6000} onClose={() => setSnackbar(null)}>
          <Alert onClose={() => setSnackbar(null)} severity={snackbar?.severity || 'success'} sx={{ width: '100%' }}>
            {snackbar?.message}
          </Alert>
        </Snackbar>

        <Dialog
          open={confirmDelete.open}
          onClose={() => setConfirmDelete({ open: false, id: null })}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {"¿Confirmar eliminación?"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              ¿Estás seguro de que quieres eliminar esta aplicación? Esta acción no se puede deshacer.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDelete({ open: false, id: null })}>Cancelar</Button>
            <Button onClick={handleConfirmDelete} autoFocus color="error">
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </Box>
  );
}