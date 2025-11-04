import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

interface OvertimeDetailsTableProps {
  details: any[];
  employees: any[];
  hotels: any[];
}

export default function OvertimeDetailsTable({ details, employees, hotels }: OvertimeDetailsTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Empleado</TableCell>
            <TableCell>Hotel</TableCell>
            <TableCell align="right">Horas Overtime</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {details.map((item: any) => {
            const employee = employees.find(e => e.id === item.employee_id);
            const hotel = hotels.find(h => h.id === employee?.hotelId);
            return (
              <TableRow key={item.id}>
                <TableCell>{employee?.name || 'Empleado desconocido'}</TableCell>
                <TableCell>{hotel?.name || 'Hotel desconocido'}</TableCell>
                <TableCell align="right">{item.overtime_hours}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
