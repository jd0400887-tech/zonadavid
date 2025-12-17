import { Card, CardContent, Box, Avatar, Typography, Stack, Chip, CardActions, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import type { Employee, Hotel } from '../../types';
import { getInitials } from '../../utils/stringUtils';

interface EmployeeCardProps {
  employee: Employee;
  hotel?: Hotel;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

export default function EmployeeCard({ employee, hotel, onEdit, onDelete }: EmployeeCardProps) {
  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            {getInitials(employee.name)}
          </Avatar>
          <Box>
            <Typography variant="h6" component="div" sx={{ overflowWrap: 'break-word' }}>
              {employee.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nº: {employee.employeeNumber}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {employee.role} en {hotel?.name || 'Sin hotel'}
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip
            label={employee.isActive ? 'Activo' : 'Inactivo'}
            color={employee.isActive ? 'success' : 'error'}
            size="small"
          />
          <Chip
            icon={employee.documentacion_completa ? <CheckCircleOutlineIcon /> : <HighlightOffIcon />}
            label={employee.documentacion_completa ? 'Completa' : 'Incompleta'}
            color={employee.documentacion_completa ? 'success' : 'error'}
            size="small"
          />
          {employee.isBlacklisted && (
            <Chip
              label="En Lista Negra"
              color="default"
              size="small"
              sx={{ bgcolor: 'black', color: 'white' }}
            />
          )}
          <Chip
            label={employee.payrollType}
            size="small"
            variant="outlined"
          />
        </Stack>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <IconButton aria-label="edit" onClick={() => onEdit(employee)}>
          <EditIcon />
        </IconButton>
        <IconButton aria-label="delete" onClick={() => onDelete(employee.id)}>
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
}