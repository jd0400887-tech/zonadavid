import * as XLSX from 'xlsx';

// This function takes different slices of data to create multiple sheets.
export const exportToExcel = ({
  hotelData,
  roleData,
  cityData,
  employeesByHotelData,
  attendanceByEmployeeData,
  newEmployeesData,
  blacklistedEmployeesData,
  summaryData,
  reportTitle
}: {
  hotelData: any[];
  roleData: any[];
  cityData: any[];
  employeesByHotelData: any[];
  attendanceByEmployeeData: any[];
  newEmployeesData: any[];
  blacklistedEmployeesData: any[];
  summaryData: any[];
  reportTitle: string;
}) => {

  // 1. Hotel Ranking Worksheet
  const hotelWs = XLSX.utils.json_to_sheet(hotelData);

  // 2. Active Employees by Role Worksheet
  const roleWs = XLSX.utils.json_to_sheet(roleData);
  
  // 3. Visits by City Worksheet
  const cityWs = XLSX.utils.json_to_sheet(cityData);

  // 4. Employees by Hotel Worksheet
  const employeesByHotelWs = XLSX.utils.json_to_sheet(employeesByHotelData);

  // 5. Attendance by Employee Worksheet
  const attendanceByEmployeeWs = XLSX.utils.json_to_sheet(attendanceByEmployeeData);

  // 6. New Employees Worksheet
  const newEmployeesWs = XLSX.utils.json_to_sheet(newEmployeesData);

  // 7. Blacklisted Employees Worksheet
  const blacklistedEmployeesWs = XLSX.utils.json_to_sheet(blacklistedEmployeesData);

  // 8. Summary Worksheet
  const summaryWs = XLSX.utils.json_to_sheet(summaryData);

  // Create workbook and add sheets
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, summaryWs, "Resumen");
  XLSX.utils.book_append_sheet(wb, hotelWs, "Ranking de Hoteles");
  XLSX.utils.book_append_sheet(wb, roleWs, "Personal por Cargo");
  XLSX.utils.book_append_sheet(wb, cityWs, "Visitas por Ciudad");
  XLSX.utils.book_append_sheet(wb, employeesByHotelWs, "Empleados por Hotel");
  XLSX.utils.book_append_sheet(wb, attendanceByEmployeeWs, "Asistencia por Empleado");
  XLSX.utils.book_append_sheet(wb, newEmployeesWs, "Nuevos Empleados");
  XLSX.utils.book_append_sheet(wb, blacklistedEmployeesWs, "Empleados en Lista Negra");

  // Generate and download the file
  // We use a simple date string for the filename
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `${reportTitle.replace(/ /g, '_')}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
