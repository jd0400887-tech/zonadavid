import { Handler } from '@netlify/functions';
const jsPDF = require('jspdf');
require('jspdf-autotable');

const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  const { data, reportTitle, charts } = JSON.parse(event.body || '{}');

  if (!data) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing data' }),
    };
  }

  const doc = new jsPDF();
  let startY = 20;

  // Add report title
  doc.text(reportTitle, 14, startY);
  startY += 10;

  // Add summary data
  doc.text('Resumen', 14, startY);
  startY += 10;

  const summaryData = data['Resumen'].map((item: any) => [item['Métrica'], item['Valor']]);

  (doc as any).autoTable({
    startY,
    head: [['Métrica', 'Valor']],
    body: summaryData,
  });

  startY = (doc as any).autoTable.previous.finalY + 10;

  // Add turnover chart
  if (charts?.turnover) {
    doc.text('Tasa de Rotación por Hotel (%)', 14, startY);
    startY += 10;
    doc.addImage(charts.turnover, 'PNG', 14, startY, 180, 100);
    startY += 110;
  }

  // Add other tables
  for (const key in data) {
    if (key !== 'Resumen' && data[key] && data[key].length > 0) {
      doc.text(key, 14, startY);
      startY += 10;

      const tableData = data[key].map((item: any) => Object.values(item));
      const tableHeaders = Object.keys(data[key][0]);

      (doc as any).autoTable({
        startY,
        head: [tableHeaders],
        body: tableData,
      });

      startY = (doc as any).autoTable.previous.finalY + 10;
    }
  }

  const pdfOutput = doc.output('datauristring');

  return {
    statusCode: 200,
    body: JSON.stringify({ pdf: pdfOutput }),
  };
};

export { handler };
