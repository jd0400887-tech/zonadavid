import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Chip, Box, Avatar } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import type { Employee, Hotel } from '../../types';
import { getInitials } from '../../utils/stringUtils';

interface EmployeeTableProps {
  employees: Employee[];
  hotels: Hotel[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

export default function EmployeeTable({ employees, hotels, onEdit, onDelete }: EmployeeTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Empleado</TableCell>
            <TableCell>Cargo</TableCell>
            <TableCell>Hotel</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Documentación</TableCell>
            <TableCell>Tipo Nómina</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {employees.map((employee) => {
            const hotel = hotels.find(h => h.id === employee.hotelId);
            return (
              <TableRow key={employee.id}>
                <TableCell component="th" scope="row">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 1.5, width: 32, height: 32, fontSize: '0.875rem' }}>
                      {getInitials(employee.name)}
                    </Avatar>
                    {employee.name}
                  </Box>
                </TableCell>
                <TableCell>{employee.role}</TableCell>
                <TableCell>{hotel?.name || 'N/A'}</TableCell>
                <TableCell>
                  <Chip
                    label={employee.isActive ? 'Activo' : 'Inactivo'}
                    color={employee.isActive ? 'success' : 'error'}
                    size="small"
                  />
                  {employee.isBlacklisted && (
                    <Chip
                      label="Lista Negra"
                      size="small"
                      sx={{ ml: 1, bgcolor: 'black', color: 'white' }}
                    />
                  )}
                </TableCell>
                <TableCell> {/* Nueva celda para Documentación */}
                  {employee.documentacion_completa ? (
                    <Chip label="Completa" color="success" size="small" icon={<CheckCircleOutlineIcon />} />
                  ) : (
                    <Chip label="Incompleta" color="error" size="small" icon={<HighlightOffIcon />} />
                  )}
                </TableCell>
                <TableCell>
                  <Chip label={employee.payrollType} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => onEdit(employee)}><EditIcon /></IconButton>
                  <IconButton onClick={() => onDelete(employee.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}