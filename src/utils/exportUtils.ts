import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Employee, Hotel, AttendanceRecord } from '../types';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export const exportEmployeesToPDF = (employees: Employee[], hotels: Hotel[]) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  doc.text("Reporte de Empleados", 14, 15);

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

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 20,
  });

  doc.save("reporte_empleados.pdf");
};

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
  const tableColumn = ['Nombre', 'Ciudad', 'Dirección', 'Teléfono', 'Email'];
  const tableRows: any[] = [];

  hotels.forEach(hotel => {
    const hotelData = [
      hotel.name,
      hotel.city,
      hotel.address,
      hotel.phone,
      hotel.email,
    ];
    tableRows.push(hotelData);
  });

  const ws = XLSX.utils.aoa_to_sheet([tableColumn, ...tableRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hoteles");
  XLSX.writeFile(wb, "reporte_hoteles.xlsx");
};

export const exportAttendanceToPDF = (records: AttendanceRecord[], hotels: Hotel[]) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  doc.text("Reporte de Visitas a Hoteles", 14, 15);

  const tableColumn = ["Hotel", "Ciudad", "Fecha y Hora de la Visita"];
  const tableRows: any[] = [];

  records.forEach(record => {
    const hotel = hotels.find(h => h.id === record.hotelId);
    const recordData = [
      hotel ? hotel.name : "N/A",
      hotel ? hotel.city : "N/A",
      new Date(record.timestamp).toLocaleString('es-ES'),
    ];
    tableRows.push(recordData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 20,
  });

  doc.save("reporte_visitas.pdf");
};