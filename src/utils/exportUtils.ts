import * as XLSX from 'xlsx';
import type { Employee, Hotel } from '../types';

export const exportEmployeesToExcel = (employees: Employee[], hotels: Hotel[]) => {
  const tableColumn = ['Nº Empleado', 'Nombre', 'Cargo', 'Tipo Nómina', 'Hotel', 'Ciudad', 'Estado', 'Lista Negra'];
  const tableRows: any[] = [];

  employees.forEach(employee => {
    const hotel = hotels.find(h => h.id === employee.hotelId);
    const employeeData = [
      employee.employeeNumber,
      employee.name,
      employee.role,
      employee.payrollType,
      hotel ? hotel.name : "N/A",
      hotel ? hotel.city : "N/A",
      employee.isActive ? 'Activo' : 'Inactivo',
      employee.isBlacklisted ? 'Sí' : 'No',
    ];
    tableRows.push(employeeData);
  });

  const ws = XLSX.utils.aoa_to_sheet([tableColumn, ...tableRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Empleados");
  XLSX.writeFile(wb, "reporte_empleados.xlsx");
};

export const exportHotelsToExcel = (hotels: Hotel[]) => {
  const tableColumn = ['Nombre', 'Ciudad', 'Dirección'];
  const tableRows: any[] = [];

  hotels.forEach(hotel => {
    const hotelData = [
      hotel.name,
      hotel.city,
      hotel.address,
    ];
    tableRows.push(hotelData);
  });

  const ws = XLSX.utils.aoa_to_sheet([tableColumn, ...tableRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hoteles");
  XLSX.writeFile(wb, "reporte_hoteles.xlsx");
};