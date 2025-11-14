import * as XLSX from 'xlsx';

export const exportToExcel = (data: { [key: string]: any[] }, reportTitle: string) => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([]); // Create an empty sheet

  let rowIndex = 0;

  // Add report title
  XLSX.utils.sheet_add_aoa(ws, [[reportTitle]], { origin: `A${rowIndex + 1}` });
  rowIndex += 2;

  for (const key in data) {
    if (data[key] && data[key].length > 0) {
      // Add section title
      XLSX.utils.sheet_add_aoa(ws, [[key]], { origin: `A${rowIndex + 1}` });
      rowIndex++;

      // Add data
      XLSX.utils.sheet_add_json(ws, data[key], { origin: `A${rowIndex + 1}` });
      rowIndex += data[key].length + 2; // Add some space between sections
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, "Reporte");

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `${reportTitle.replace(/ /g, '_')}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
