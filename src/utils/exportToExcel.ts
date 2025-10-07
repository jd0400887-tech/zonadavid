import * as XLSX from 'xlsx';

// This function takes different slices of data to create multiple sheets.
export const exportToExcel = ({
  hotelData,
  roleData,
  cityData,
  reportTitle
}: {
  hotelData: any[];
  roleData: any[];
  cityData: any[];
  reportTitle: string;
}) => {

  // 1. Hotel Ranking Worksheet
  const hotelWs = XLSX.utils.json_to_sheet(hotelData);

  // 2. Active Employees by Role Worksheet
  const roleWs = XLSX.utils.json_to_sheet(roleData);
  
  // 3. Visits by City Worksheet
  const cityWs = XLSX.utils.json_to_sheet(cityData);

  // Create workbook and add sheets
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, hotelWs, "Ranking de Hoteles");
  XLSX.utils.book_append_sheet(wb, roleWs, "Personal por Cargo");
  XLSX.utils.book_append_sheet(wb, cityWs, "Visitas por Ciudad");

  // Generate and download the file
  // We use a simple date string for the filename
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `${reportTitle.replace(/ /g, '_')}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
