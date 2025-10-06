import { TextField, Select, MenuItem, FormControl, InputLabel, FormControlLabel, Switch, Box, Divider, Typography, Button } from '@mui/material';
import type { Employee, Hotel } from '../../types';
import { EMPLOYEE_POSITIONS } from '../../data/constants';

interface EmployeeFormProps {
  employeeData: Partial<Employee>;
  onFormChange: (field: keyof Employee, value: any) => void;
  hotels: Hotel[];
  onToggleBlacklist: () => void;
}

export default function EmployeeForm({ employeeData, onFormChange, hotels, onToggleBlacklist }: EmployeeFormProps) {
  const isBlacklisted = employeeData.isBlacklisted ?? false;

  const validHotelId = employeeData.hotelId && hotels.some(hotel => hotel.id === employeeData.hotelId)
    ? employeeData.hotelId
    : '';

  return (
    <>
      <TextField
        autoFocus
        margin="dense"
        id="name"
        label="Nombre Completo"
        type="text"
        fullWidth
        variant="outlined"
        value={employeeData.name || ''}
        onChange={(e) => onFormChange('name', e.target.value)}
        required
        disabled={isBlacklisted}
      />
      <FormControl fullWidth margin="dense" required disabled={isBlacklisted}>
        <InputLabel id="role-select-label">Cargo</InputLabel>
        <Select
          labelId="role-select-label"
          id="role"
          value={employeeData.role || ''}
          label="Cargo"
          onChange={(e) => onFormChange('role', e.target.value)}
        >
          {EMPLOYEE_POSITIONS.map((position) => (
            <MenuItem key={position} value={position}>
              {position}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth margin="dense" required disabled={isBlacklisted}>
        <InputLabel id="payroll-type-select-label">Tipo de Nómina</InputLabel>
        <Select
          labelId="payroll-type-select-label"
          id="payrollType"
          value={employeeData.payrollType || 'timesheet'}
          label="Tipo de Nómina"
          onChange={(e) => onFormChange('payrollType', e.target.value)}
        >
          <MenuItem value="timesheet">Timesheet</MenuItem>
          <MenuItem value="Workrecord">Workrecord</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth margin="dense" required disabled={isBlacklisted}>
        <InputLabel id="hotel-select-label">Hotel</InputLabel>
        <Select
          labelId="hotel-select-label"
          id="hotelId"
          value={validHotelId}
          label="Hotel"
          onChange={(e) => onFormChange('hotelId', e.target.value)}
        >
          {hotels.map((hotel) => (
            <MenuItem key={hotel.id} value={hotel.id}>
              {hotel.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControlLabel
        control={
          <Switch
            checked={employeeData.isActive ?? true}
            onChange={(e) => onFormChange('isActive', e.target.checked)}
            name="isActive"
            color="primary"
          />
        }
        label="Empleado Activo"
        sx={{ mt: 1 }}
        disabled={isBlacklisted}
      />

      {employeeData.id && (
        <Box sx={{ mt: 4 }}>
          <Divider />
          <Typography variant="h6" color="error" sx={{ mt: 2 }}>
            Zona de Peligro
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              color={isBlacklisted ? "success" : "error"}
              onClick={onToggleBlacklist}
            >
              {isBlacklisted ? "Quitar de Lista Negra" : "Añadir a Lista Negra"}
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              {isBlacklisted 
                ? "Esto permitirá que el empleado vuelva a ser editable." 
                : "Al añadir a la lista negra, el empleado no podrá ser modificado."}
            </Typography>
          </Box>
        </Box>
      )}
    </>
  );
}
