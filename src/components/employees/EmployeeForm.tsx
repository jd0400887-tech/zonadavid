import { 
  TextField, Select, MenuItem, FormControl, InputLabel, FormControlLabel, 
  Switch, Box, Divider, Typography, Button, Grid, InputAdornment, Stack,
  Paper, Avatar
} from '@mui/material';

// Iconos
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import WorkIcon from '@mui/icons-material/Work';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PaymentsIcon from '@mui/icons-material/Payments';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { useAuth } from '../../hooks/useAuth';
import type { Employee, Hotel } from '../../types';
import { EMPLOYEE_POSITIONS } from '../../data/constants';

interface EmployeeFormProps {
  employeeData: Partial<Employee>;
  onFormChange: (field: keyof Employee, value: any) => void;
  hotels: Hotel[];
  onToggleBlacklist: () => void;
}

export default function EmployeeForm({ employeeData, onFormChange, hotels, onToggleBlacklist }: EmployeeFormProps) {
  const { profile } = useAuth();
  const isInspector = profile?.role === 'INSPECTOR';
  const isBlacklisted = employeeData.isBlacklisted ?? false;

  // Filtro de seguridad: Si es inspector, solo mostrar hoteles de su zona
  const filteredHotels = hotels.filter(hotel => {
    if (isInspector && profile?.assigned_zone) {
      return hotel.zone === profile.assigned_zone;
    }
    return true;
  });

  const validHotelId = employeeData.hotelId && filteredHotels.some(hotel => hotel.id === employeeData.hotelId)
    ? employeeData.hotelId
    : '';

  return (
    <Box sx={{ mt: 1 }}>
      <Grid container spacing={3}>
        {/* --- SECCIÓN 1: INFORMACIÓN PERSONAL --- */}
        <Grid item xs={12}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <PersonIcon fontSize="small" />
            </Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Información del Empleado
            </Typography>
          </Stack>
          <Divider sx={{ mt: 1, mb: 2, opacity: 0.1 }} />
        </Grid>

        <Grid item xs={12} sm={8}>
          <TextField
            autoFocus
            label="Nombre Completo"
            fullWidth
            variant="outlined"
            size="small"
            value={employeeData.name || ''}
            onChange={(e) => onFormChange('name', e.target.value)}
            required
            disabled={isBlacklisted}
            InputProps={{
              startAdornment: <InputAdornment position="start"><PersonIcon color="primary" fontSize="small" /></InputAdornment>,
              sx: { borderRadius: 2 }
            }}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            label="Nº de Empleado"
            fullWidth
            variant="outlined"
            size="small"
            value={employeeData.employeeNumber || ''}
            onChange={(e) => onFormChange('employeeNumber', e.target.value)}
            disabled={isBlacklisted}
            InputProps={{
              startAdornment: <InputAdornment position="start"><BadgeIcon color="primary" fontSize="small" /></InputAdornment>,
              sx: { borderRadius: 2 }
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" required disabled={isBlacklisted}>
            <InputLabel>Cargo / Posición</InputLabel>
            <Select
              value={employeeData.role || ''}
              label="Cargo / Posición"
              onChange={(e) => onFormChange('role', e.target.value)}
              startAdornment={<InputAdornment position="start"><WorkIcon color="primary" fontSize="small" /></InputAdornment>}
              sx={{ borderRadius: 2 }}
            >
              {EMPLOYEE_POSITIONS.map((position) => (
                <MenuItem key={position} value={position}>{position}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* --- SECCIÓN 2: ASIGNACIÓN Y NÓMINA --- */}
        <Grid item xs={12} sx={{ mt: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <ApartmentIcon fontSize="small" />
            </Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Asignación Operativa
            </Typography>
          </Stack>
          <Divider sx={{ mt: 1, mb: 2, opacity: 0.1 }} />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" required disabled={isBlacklisted}>
            <InputLabel>Hotel Asignado</InputLabel>
            <Select
              value={validHotelId}
              label="Hotel Asignado"
              onChange={(e) => onFormChange('hotelId', e.target.value)}
              startAdornment={<InputAdornment position="start"><ApartmentIcon color="primary" fontSize="small" /></InputAdornment>}
              sx={{ borderRadius: 2 }}
            >
              {filteredHotels.map((hotel) => (
                <MenuItem key={hotel.id} value={hotel.id}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body2">{hotel.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{hotel.zone}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" required disabled={isBlacklisted}>
            <InputLabel>Tipo de Nómina</InputLabel>
            <Select
              value={employeeData.payrollType || 'timesheet'}
              label="Tipo de Nómina"
              onChange={(e) => onFormChange('payrollType', e.target.value)}
              startAdornment={<InputAdornment position="start"><PaymentsIcon color="primary" fontSize="small" /></InputAdornment>}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="timesheet">Timesheet (Horas)</MenuItem>
              <MenuItem value="Workrecord">Workrecord (Producción)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" required disabled={isBlacklisted}>
            <InputLabel>Tipo de Empleado</InputLabel>
            <Select
              value={employeeData.employeeType || 'permanente'}
              label="Tipo de Empleado"
              onChange={(e) => onFormChange('employeeType', e.target.value)}
              startAdornment={<InputAdornment position="start"><AssignmentIndIcon color="primary" fontSize="small" /></InputAdornment>}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="permanente">Permanente</MenuItem>
              <MenuItem value="temporal">Temporal</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={employeeData.isActive ?? true}
                      onChange={(e) => onFormChange('isActive', e.target.checked)}
                      color="success"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon fontSize="small" color={employeeData.isActive ? "success" : "disabled"} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Empleado Activo</Typography>
                    </Box>
                  }
                  disabled={isBlacklisted}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={employeeData.documentacion_completa ?? false}
                      onChange={(e) => onFormChange('documentacion_completa', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VerifiedUserIcon fontSize="small" color={employeeData.documentacion_completa ? "primary" : "disabled"} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Documentación Completa</Typography>
                    </Box>
                  }
                  disabled={isBlacklisted}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* --- ZONA DE PELIGRO --- */}
        {employeeData.id && (
          <Grid item xs={12}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                mt: 2, 
                borderRadius: 3, 
                border: '1px solid rgba(244, 67, 54, 0.2)',
                backgroundColor: 'rgba(244, 67, 54, 0.02)' 
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" flexWrap="wrap">
                <Box>
                  <Typography variant="subtitle2" color="error" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BlockIcon fontSize="small" /> Gestión de Lista Negra
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ maxWidth: '300px', display: 'block' }}>
                    {isBlacklisted 
                      ? "Este empleado está restringido. Quítalo de la lista para permitir ediciones." 
                      : "Al añadir a la lista negra, el empleado no podrá ser modificado ni asignado."}
                  </Typography>
                </Box>
                <Button
                  variant={isBlacklisted ? "contained" : "outlined"}
                  color={isBlacklisted ? "success" : "error"}
                  onClick={onToggleBlacklist}
                  startIcon={isBlacklisted ? <CheckCircleIcon /> : <WarningAmberIcon />}
                  sx={{ borderRadius: 2, fontWeight: 'bold', minWidth: '180px' }}
                >
                  {isBlacklisted ? "Activar Empleado" : "Mandar a Lista Negra"}
                </Button>
              </Stack>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
