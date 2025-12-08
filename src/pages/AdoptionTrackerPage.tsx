import { useState, useMemo, useRef, createRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  ListItemButton
} from '@mui/material';
import { useAdoptionStats } from '../hooks/useAdoptionStats';
import { useHotels } from '../hooks/useHotels';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; // For "Modificación Menor"
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'; // For "Incumplimiento Parcial"
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt'; // For "Incumplimiento Total"
import type { Employee } from '../types';
import StatCard from '../components/dashboard/StatCard';
import PeopleIcon from '@mui/icons-material/People';
import PollIcon from '@mui/icons-material/Poll';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const COMPLIANCE_SCORES: { [key: string]: number } = {
  'cumplio': 100,
  'modificacion_menor': 75,
  'incumplimiento_parcial': 25,
  'incumplimiento_total': 0,
};

const AdoptionTrackerPage = () => {
  const { stats, loading, weekLabels, hotelRanking, refreshStats } = useAdoptionStats();
  const { hotels } = useHotels();

  const [nameFilter, setNameFilter] = useState('');
  const [hotelFilter, setHotelFilter] = useState('all');
  const [highlightedEmployeeId, setHighlightedEmployeeId] = useState<string | null>(null);
  const rowRefs = useRef<React.RefObject<HTMLTableRowElement>[]>([]);

  const filteredStats = useMemo(() => {
    const filtered = stats.filter(stat => {
      const nameMatch = stat.employee.name.toLowerCase().includes(nameFilter.toLowerCase());
      const hotelMatch = hotelFilter === 'all' || stat.employee.hotelId === hotelFilter;
      return nameMatch && hotelMatch;
    });
    // Create refs for each filtered row
    rowRefs.current = filtered.map((_, i) => rowRefs.current[i] || createRef());
    return filtered;
  }, [stats, nameFilter, hotelFilter]);

  const employeeRanking = useMemo(() => {
    return [...stats].sort((a, b) => a.compliancePercentage - b.compliancePercentage);
  }, [stats]);
  
  const overallCompliance = (filteredStats.reduce((acc, stat) => acc + stat.compliancePercentage, 0) / filteredStats.length) || 0;

  const handleHotelRankClick = (hotelId: string) => {
    setHotelFilter(hotelId);
    setNameFilter(''); // Clear name filter when clicking hotel rank
  };

  const handleEmployeeRankClick = (employee: Employee) => {
    // Filter to the employee's hotel and clear name filter to ensure they are visible
    setHotelFilter(employee.hotelId || 'all');
    setNameFilter(employee.name);
    setHighlightedEmployeeId(employee.id);

    const employeeIndex = filteredStats.findIndex(stat => stat.employee.id === employee.id);
    if (employeeIndex !== -1 && rowRefs.current[employeeIndex]) {
        setTimeout(() => {
            rowRefs.current[employeeIndex].current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }, 100); // Timeout to allow table to re-render
    }

    // Remove highlight after a few seconds
    setTimeout(() => {
        setHighlightedEmployeeId(null);
        setNameFilter('');
    }, 3000);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" gutterBottom>
                Seguimiento Workrecord
            </Typography>
            <Tooltip title="Refrescar Datos">
                <IconButton onClick={refreshStats} color="primary">
                    <RefreshIcon />
                </IconButton>
            </Tooltip>
        </Box>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6} lg={3}>
            <StatCard 
                title="Cumplimiento General (Filtrado)" 
                value={`${overallCompliance.toFixed(1)}%`} 
                icon={<PollIcon />} 
            />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
            <StatCard 
                title="Empleados Mostrados" 
                value={filteredStats.length} 
                icon={<PeopleIcon />} 
            />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Ranking Hoteles (Incumplimientos)</Typography>
                    <List dense>
                        {hotelRanking.slice(0, 3).map((hotel) => (
                            <ListItemButton key={hotel.hotelId} sx={{py: 0}} onClick={() => handleHotelRankClick(hotel.hotelId)}>
                                <ListItemIcon sx={{minWidth: 'auto', mr: 1}}>
                                    <Badge badgeContent={hotel.nonComplianceCount} color="error" />
                                </ListItemIcon>
                                <ListItemText primary={hotel.hotelName} primaryTypographyProps={{ variant: 'body2' }}/>
                            </ListItemButton>
                        ))}
                    </List>
                </CardContent>
            </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Ranking Empleados (Peor Cumplimiento)</Typography>
                     <List dense>
                        {employeeRanking.slice(0, 3).map((stat) => (
                            <ListItemButton key={stat.employee.id} sx={{py: 0}} onClick={() => handleEmployeeRankClick(stat.employee)}>
                               <ListItemIcon sx={{minWidth: 'auto', mr: 1}}>
                                    <TrendingDownIcon color="error"/>
                                </ListItemIcon>
                                <ListItemText 
                                    primary={stat.employee.name} 
                                    secondary={`${stat.compliancePercentage.toFixed(0)}% Cumplimiento`}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                />
                            </ListItemButton>
                        ))}
                    </List>
                </CardContent>
            </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <TextField
                    fullWidth
                    label="Buscar por nombre"
                    variant="outlined"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                    <InputLabel>Filtrar por Hotel</InputLabel>
                    <Select value={hotelFilter} label="Filtrar por Hotel" onChange={(e) => setHotelFilter(e.target.value)}>
                    <MenuItem value="all">Todos los Hoteles</MenuItem>
                    {hotels.map(hotel => <MenuItem key={hotel.id} value={hotel.id}>{hotel.name}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="adoption stats table">
          <TableHead>
            <TableRow>
              <TableCell>Empleado</TableCell>
              <TableCell align="center">Cumplimiento</TableCell>
              <TableCell align="center">Tendencia (6 Semanas)</TableCell>
              {weekLabels.map(label => (
                <TableCell key={label} align="center">{label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStats.map(({ employee, complianceHistory, compliancePercentage }, index) => {
              const sparklineData = complianceHistory.map(record => ({
                score: COMPLIANCE_SCORES[record.compliance_status] || 0
              })).reverse(); // reverse to show oldest first

              return (
              <TableRow
                key={employee.id}
                ref={rowRefs.current[index]}
                sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    transition: 'background-color 0.5s ease',
                    backgroundColor: highlightedEmployeeId === employee.id ? 'rgba(255, 152, 0, 0.2)' : 'transparent',
                }}
              >
                <TableCell component="th" scope="row">
                  {employee.name}
                </TableCell>
                <TableCell align="center">
                    <Typography 
                        variant="body2" 
                        color={compliancePercentage > 75 ? 'green' : compliancePercentage > 50 ? 'orange' : 'red'}
                    >
                        {compliancePercentage.toFixed(0)}%
                    </Typography>
                </TableCell>
                <TableCell align="center">
                  {sparklineData.length > 1 && (
                    <ResponsiveContainer width={100} height={30}>
                      <LineChart data={sparklineData}>
                        <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </TableCell>
                {weekLabels.map((label, index) => {
                  const weekNum = parseInt(label.split(" ")[1]);
                  const record = complianceHistory.find(h => h.week_of_year === weekNum);
                  
                  let icon = null;
                  let tooltipTitle = 'No hay datos para esta semana';
                  let iconColor: "inherit" | "action" | "disabled" | "primary" | "secondary" | "error" | "info" | "success" | "warning" | undefined = 'disabled';

                  if (record) {
                    tooltipTitle = `Estado: ${record.compliance_status}`;
                    if (record.reason) {
                        tooltipTitle += `\nMotivo: ${record.reason}`;
                    }

                    switch (record.compliance_status) {
                        case 'cumplio':
                            icon = <CheckCircleIcon />;
                            iconColor = 'success';
                            break;
                        case 'modificacion_menor':
                            icon = <ErrorOutlineIcon />;
                            iconColor = 'warning';
                            break;
                        case 'incumplimiento_parcial':
                            icon = <HelpOutlineIcon />;
                            iconColor = 'error';
                            break;
                        case 'incumplimiento_total':
                            icon = <DoNotDisturbAltIcon />;
                            iconColor = 'error';
                            break;
                        default:
                            icon = null;
                            break;
                    }
                  }

                  return (
                    <TableCell key={index} align="center">
                      {icon ? (
                        <Tooltip title={tooltipTitle} placement="top">
                            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', color: `${iconColor}.main` }}>
                                {icon}
                            </Box>
                        </Tooltip>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdoptionTrackerPage;