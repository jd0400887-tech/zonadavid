import React, { useState, useMemo } from 'react';
import { Box, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Divider, Paper, CircularProgress, Alert, Grid, Drawer, Fab, IconButton } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { LineChart } from '@mui/x-charts/LineChart';
import StatCard from '../components/dashboard/StatCard';
import InfoIcon from '@mui/icons-material/Info';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PeopleIcon from '@mui/icons-material/People'; // Talent
import AssignmentIcon from '@mui/icons-material/Assignment'; // Demand
import HailIcon from '@mui/icons-material/Hail'; // Supply
import TrendingUpIcon from '@mui/icons-material/TrendingUp'; // Visits
import FactCheckIcon from '@mui/icons-material/FactCheck'; // Workrecord

// Custom hook
import { useHistoricalAnalysis, HistoricalPillarData } from '../hooks/useHistoricalAnalysis';

const drawerWidth = 280;

const pillars = [
  { id: 'talent', name: 'Talento y Estabilidad', icon: <PeopleIcon /> },
  { id: 'demand', name: 'Demanda y Fricción', icon: <AssignmentIcon /> },
  { id: 'supply', name: 'Oferta (Ingresos)', icon: <HailIcon /> },
  { id: 'visits', name: 'Supervisión (Visitas)', icon: <TrendingUpIcon /> },
  { id: 'workrecord', name: 'Disciplina Workrecord', icon: <FactCheckIcon /> },
];

const PillarContent = ({ data }: { data: HistoricalPillarData }) => {
  if (!data || Object.keys(data).length === 0) {
    return <Typography>Este pilar aún no tiene datos para analizar.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        {data.title}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {data.metrics.map((metric, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <StatCard title={metric.label} value={metric.value} />
          </Grid>
        ))}
      </Grid>
      
      {data.insights && data.insights.length > 0 && (
        <Box sx={{ my: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
            <InfoIcon sx={{ mr: 1 }} /> Conclusiones Clave
          </Typography>
          <Grid container spacing={2}>
            {data.insights.map((insight, idx) => (
              <Grid item xs={12} md={6} key={idx}>
                <Paper sx={{ p: 2, height: '100%', bgcolor: insight.type === 'negative' ? 'rgba(211, 47, 47, 0.1)' : insight.type === 'warning' ? 'rgba(237, 108, 2, 0.1)' : 'rgba(76, 175, 80, 0.1)', borderLeft: '4px solid', borderColor: insight.type === 'negative' ? '#d32f2f' : insight.type === 'warning' ? '#ed6c02' : '#4caf50' }}>
                  <Typography variant="body1">{insight.text}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {data.charts && data.charts.map((chart, idx) => (
        <Paper key={idx} sx={{ p: 3, mb: 4, height: 350, backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <Typography variant="h6" gutterBottom>{chart.title}</Typography>
          <LineChart
            series={chart.series.map(s => {
              const seriesType = s.label.includes('Balance') ? 'bar' : 'line';
              const color = s.label.includes('Positivo') ? '#2e7d32' : 
                            s.label.includes('Negativo') ? '#d32f2f' :
                            s.label.includes('Ingresos') ? '#4caf50' : '#f44336';
              return {
                data: s.data.map(d => d.value),
                label: s.label,
                type: seriesType,
                color: color,
                area: seriesType === 'line',
                stack: s.label.includes('Balance') ? 'balance' : undefined,
              };
            })}
            xAxis={[{ scaleType: 'point', data: chart.series[0]?.data.map(d => d.date) || [], label: 'Meses' }]}
            height={250}
            margin={{ left: 50, right: 20, top: 40, bottom: 30 }}
            slotProps={{ legend: { direction: 'row', position: { vertical: 'top', horizontal: 'middle' }, padding: 0 } }}
            sx={{ '.MuiAreaElement-root': { opacity: 0.2 } }}
          />
        </Paper>
      ))}
    </Box>
  );
};

export default function HistoricalReportPage() {
  const location = useLocation();
  const { startDate: rawStartDate, endDate: rawEndDate } = (location.state || {}) as { startDate: string, endDate: string };
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const startDate = useMemo(() => rawStartDate ? new Date(rawStartDate) : new Date(0), [rawStartDate]);
  const endDate = useMemo(() => rawEndDate ? new Date(rawEndDate) : new Date(), [rawEndDate]);

  const [selectedPillar, setSelectedPillar] = useState<string>('talent');
  const { talent, demand, supply, visits, workrecord, loading, error } = useHistoricalAnalysis(startDate, endDate);

  const formattedStartDate = rawStartDate ? format(startDate, 'dd/MM/yyyy') : 'Inicio de Datos';
  const formattedEndDate = rawEndDate ? format(endDate, 'dd/MM/yyyy') : 'Hoy';

  const handlePillarSelect = (pillarId: string) => {
    setSelectedPillar(pillarId);
    setIsDrawerOpen(false);
  };

  let currentPillarData: HistoricalPillarData | undefined;
  switch (selectedPillar) {
    case 'talent': currentPillarData = talent; break;
    case 'demand': currentPillarData = demand; break;
    case 'supply': currentPillarData = supply; break;
    case 'visits': currentPillarData = visits; break;
    case 'workrecord': currentPillarData = workrecord; break;
    default: currentPillarData = undefined;
  }

  return (
    <>
      <Drawer
        variant="temporary"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
      >
        <Toolbar />
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" gutterBottom>Informe Gerencial</Typography>
            <Typography variant="subtitle2" color="text.secondary">Período: {formattedStartDate} - {formattedEndDate}</Typography>
          </Box>
          <IconButton onClick={() => setIsDrawerOpen(false)}>
            <ChevronLeftIcon />
          </IconButton>
        </Box>
        <Divider />
        <List>
          {pillars.map((pillar) => (
            <ListItem key={pillar.id} disablePadding>
              <ListItemButton selected={selectedPillar === pillar.id} onClick={() => handlePillarSelect(pillar.id)}>
                <ListItemIcon>{pillar.icon}</ListItemIcon>
                <ListItemText primary={pillar.name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => setIsDrawerOpen(true)} color="primary" aria-label="open drawer" sx={{ mr: 2 }}>
                <MenuIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Análisis Histórico
            </Typography>
        </Box>

        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /><Typography sx={{ ml: 2 }}>Cargando análisis histórico...</Typography></Box>}
        {error && <Alert severity="error" sx={{ mt: 4 }}>Error al cargar el informe: {error}</Alert>}
        
        {!loading && !error && currentPillarData && <PillarContent data={currentPillarData} />}
        {!loading && !error && !currentPillarData && (
          <Typography variant="h5" sx={{ mt: 4, textAlign: 'center' }}>
            Selecciona un pilar del menú para ver su análisis.
          </Typography>
        )}
      </Box>
    </>
  );
}