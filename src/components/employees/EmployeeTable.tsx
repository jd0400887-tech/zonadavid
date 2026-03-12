import { 
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  IconButton, Chip, Box, Avatar, Typography, Tooltip, Stack, useTheme 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import BadgeIcon from '@mui/icons-material/Badge';
import ApartmentIcon from '@mui/icons-material/Apartment';

import type { Employee, Hotel } from '../../types';
import { getInitials } from '../../utils/stringUtils';

interface EmployeeTableProps {
  employees: Employee[];
  hotels: Hotel[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

const roleColors: { [key: string]: string } = {
  'Housekeeper': '#FF5722',
  'Housekeeping Runner': '#FF9800',
  'Laundry Attendant': '#2196F3',
  'General Worker': '#4CAF50',
  'Supervisor': '#9C27B0',
};

export default function EmployeeTable({ employees, hotels, onEdit, onDelete }: EmployeeTableProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  return (
    <TableContainer 
      component={Paper} 
      sx={{ 
        borderRadius: 3,
        border: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.02)',
        overflow: 'hidden',
        boxShadow: isLight ? '0 4px 6px rgba(0,0,0,0.05)' : 'none'
      }}
    >
      <Table sx={{ minWidth: 650 }} stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', backgroundColor: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.05)' }}>Empleado</TableCell>
            <TableCell sx={{ fontWeight: 'bold', backgroundColor: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.05)' }}>Cargo</TableCell>
            <TableCell sx={{ fontWeight: 'bold', backgroundColor: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.05)' }}>Hotel y Zona</TableCell>
            <TableCell sx={{ fontWeight: 'bold', backgroundColor: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.05)', textAlign: 'center' }}>Estado</TableCell>
            <TableCell sx={{ fontWeight: 'bold', backgroundColor: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.05)', textAlign: 'center' }}>Documentación</TableCell>
            <TableCell sx={{ fontWeight: 'bold', backgroundColor: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.05)', textAlign: 'center' }}>Nómina</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.05)' }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {employees.map((employee) => {
            const hotel = hotels.find(h => h.id === employee.hotelId);
            const rColor = roleColors[employee.role] || theme.palette.primary.main;
            
            return (
              <TableRow 
                key={employee.id}
                hover
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 },
                  transition: 'background-color 0.2s',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)' }
                }}
                onClick={() => onEdit(employee)}
              >
                <TableCell component="th" scope="row">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: rColor, 
                        width: 36, 
                        height: 36, 
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        boxShadow: `0 2px 8px ${rColor}33`
                      }}
                    >
                      {getInitials(employee.name)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{employee.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <BadgeIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">ID: {employee.employeeNumber}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.role}</Typography>
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ApartmentIcon sx={{ fontSize: 16, color: 'primary.main', opacity: 0.7 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{hotel?.name || 'No Asignado'}</Typography>
                      {hotel?.zone && (
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                          {hotel.zone}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                    <Chip
                      label={employee.isActive ? 'Activo' : 'Inactivo'}
                      color={employee.isActive ? 'success' : 'default'}
                      size="small"
                      variant={employee.isActive ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 'bold', fontSize: '0.7rem', height: 20 }}
                    />
                    {employee.isBlacklisted && (
                      <Chip
                        label="Restringido"
                        size="small"
                        color="error"
                        sx={{ fontWeight: 'bold', fontSize: '0.7rem', height: 20 }}
                      />
                    )}
                  </Stack>
                </TableCell>
                
                <TableCell align="center">
                  <Tooltip title={employee.documentacion_completa ? "Todo en orden" : "Pendiente de documentos"}>
                    <Chip 
                      label={employee.documentacion_completa ? "Completa" : "Incompleta"} 
                      color={employee.documentacion_completa ? "success" : "error"} 
                      size="small" 
                      variant="outlined"
                      icon={employee.documentacion_completa ? <CheckCircleOutlineIcon /> : <HighlightOffIcon />}
                      sx={{ fontWeight: 'bold', fontSize: '0.7rem', height: 24 }}
                    />
                  </Tooltip>
                </TableCell>
                
                <TableCell align="center">
                  <Chip 
                    label={employee.payrollType.toUpperCase()} 
                    size="small" 
                    variant="outlined"
                    sx={{ fontWeight: 'bold', fontSize: '0.65rem', border: '1px solid rgba(255,255,255,0.1)' }} 
                  />
                </TableCell>
                
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title="Editar">
                      <IconButton 
                        size="small" 
                        onClick={(e) => { e.stopPropagation(); onEdit(employee); }}
                        sx={{ '&:hover': { color: 'primary.main', backgroundColor: 'rgba(255, 87, 34, 0.1)' } }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton 
                        size="small" 
                        onClick={(e) => { e.stopPropagation(); onDelete(employee.id); }}
                        sx={{ '&:hover': { color: 'error.main', backgroundColor: 'rgba(244, 67, 54, 0.1)' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}