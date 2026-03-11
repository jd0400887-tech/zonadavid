import { Box, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, ToggleButtonGroup, ToggleButton, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import StatCard from './StatCard';
import DashboardPieChart from './DashboardPieChart';
import { DashboardBarChart } from './DashboardBarChart';

// Icons
import PeopleIcon from '@mui/icons-material/People';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningIcon from '@mui/icons-material/Warning';
import PublicIcon from '@mui/icons-material/Public';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface RecruiterDashboardProps {
  stats: any;
  selectedZone: string;
  onZoneChange: (zone: 'Todas' | 'Centro' | 'Norte' | 'Noroeste') => void;
}

export default function RecruiterDashboard({ stats, selectedZone, onZoneChange }: RecruiterDashboardProps) {
  const navigate = useNavigate();
  const theme = useTheme();

  const recruitmentStats = [
    { title: "Solicitudes Activas", value: stats.activeRequestsCount, icon: <AssignmentIcon />, color: 'primary.main' },
    { title: "Sin Gestionar", value: stats.pendingRequests, icon: <PendingActionsIcon />, color: '#ff9800' },
    { title: "Inician Hoy/Mañ", value: stats.urgentStarts, icon: <WarningIcon />, color: '#f44336' },
    { title: "% Cobertura", value: `${stats.coverageRate}%`, icon: <PeopleIcon />, color: '#4caf50' },
  ];

  const complianceData = [
    { name: 'A Tiempo (<24h)', value: stats.compliance72h.onTime, color: '#4caf50' },
    { name: 'En Riesgo (>48h)', value: stats.compliance72h.critical, color: '#ff9800' },
    { name: 'Vencidas (>72h)', value: stats.compliance72h.overdue, color: '#f44336' },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', textShadow: '0 0 10px rgba(255, 87, 34, 0.3)' }}>
          Panel de Reclutamiento
        </Typography>

        {/* Switcher Minimalista (Opción 1) */}
        <Paper sx={{ 
          p: 0.5, 
          display: 'flex', 
          backgroundColor: 'rgba(0, 0, 0, 0.4)', 
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'rgba(255, 87, 34, 0.3)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          <ToggleButtonGroup
            value={selectedZone}
            exclusive
            onChange={(_e, val) => val && onZoneChange(val)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: '8px',
                color: 'text.secondary',
                px: 3,
                py: 0.5,
                mx: 0.5,
                transition: 'all 0.3s ease',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  boxShadow: '0 0 15px rgba(255, 87, 34, 0.5)',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  }
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'primary.light'
                }
              }
            }}
          >
            <ToggleButton value="Todas">Todas</ToggleButton>
            <ToggleButton value="Centro">Centro</ToggleButton>
            <ToggleButton value="Norte">Norte</ToggleButton>
            <ToggleButton value="Noroeste">Noroeste</ToggleButton>
          </ToggleButtonGroup>
        </Paper>
      </Box>

      {/* Fila de KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {recruitmentStats.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard 
              title={item.title} 
              value={item.value} 
              icon={item.icon} 
              color={item.color}
              onClick={item.title.includes('Solicitudes') || item.title.includes('Gestionar') ? () => navigate('/solicitudes') : undefined}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Gráfico 72h */}
        <Grid item xs={12} md={6}>
          <DashboardPieChart 
            title="Cumplimiento Estándar 72h" 
            data={complianceData.filter(d => d.value > 0)} 
          />
        </Grid>

        {/* Gráfico por Zonas */}
        <Grid item xs={12} md={6}>
          <DashboardBarChart 
            title="Solicitudes por Zona" 
            data={stats.requestsByZone} 
          />
        </Grid>

        {/* Lista de Urgencias */}
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 2, 
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid',
            borderColor: 'primary.main',
            boxShadow: `0 0 5px #FF5722, 0 0 10px #FF5722`
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: 'text.primary' }}>Solicitudes Críticas (Sin cubrir totalmente)</Typography>
              <Button variant="outlined" size="small" onClick={() => navigate('/solicitudes')}>Gestionar Todo</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Hotel</TableCell>
                    <TableCell>Cargo</TableCell>
                    <TableCell>Fecha Inicio</TableCell>
                    <TableCell align="center">Progreso</TableCell>
                    <TableCell align="right">Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.unfulfilledRequests.slice(0, 5).map((req: any) => (
                    <TableRow key={req.id}>
                      <TableCell>{req.hotelName}</TableCell>
                      <TableCell>{req.role}</TableCell>
                      <TableCell>
                        {req.start_date ? new Date(req.start_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={`${req.candidate_count} / ${req.num_of_people}`} 
                          size="small" 
                          color={req.candidate_count === 0 ? "error" : "warning"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => navigate('/solicitudes')}>Ver</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
