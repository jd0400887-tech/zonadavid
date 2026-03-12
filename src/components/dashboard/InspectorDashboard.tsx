import { Box, Typography, Grid, Paper } from '@mui/material';

interface InspectorDashboardProps {
  stats: any;
  zone: string | null;
}

export default function InspectorDashboard({ stats, zone }: InspectorDashboardProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
        Panel de Inspección - Zona {zone || 'No asignada'}
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 5, 
            textAlign: 'center', 
            border: '2px dashed rgba(255, 87, 34, 0.2)',
            backgroundColor: 'rgba(255, 87, 34, 0.02)',
            borderRadius: '16px'
          }}>
            <Typography variant="h6" color="text.secondary">
              Espacio reservado para métricas de inspección.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aquí aparecerá la información específica que definamos para la zona {zone}.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
