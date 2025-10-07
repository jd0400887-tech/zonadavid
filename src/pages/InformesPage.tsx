import { useLocation } from 'react-router-dom';
import { Box, Typography, Paper } from '@mui/material';

function InformesPage() {
  const location = useLocation();
  const { title, startDate, endDate } = location.state || {};

  const formattedStartDate = startDate ? new Date(startDate).toLocaleDateString() : 'N/A';
  const formattedEndDate = endDate ? new Date(endDate).toLocaleDateString() : 'N/A';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {title || 'Informe Personalizado'}
      </Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">
          Período del Informe
        </Typography>
        <Typography>
          Desde: {formattedStartDate} - Hasta: {formattedEndDate}
        </Typography>
      </Paper>
      
      <Typography variant="body1">
        Aquí se mostrará el análisis de datos para el período seleccionado.
      </Typography>
      {/* Próximamente: Gráficos y tablas con los datos del informe */}
    </Box>
  );
}

export default InformesPage;
