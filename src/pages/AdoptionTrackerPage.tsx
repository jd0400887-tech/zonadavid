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
import * as XLSX from 'xlsx';
import { useAdoptionStats } from '../hooks/useAdoptionStats';
import { useHotels } from '../hooks/useHotels';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; // For "Modificación Menor"
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'; // For "Incumplimiento Parcial"
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt'; // For "Incumplimiento Total"
import type { Employee } from '../types';
import StatCard from '../components/dashboard/StatCard';
import PeopleIcon from '@mui/icons-material/People';
import PollIcon from '@mui/icons-material/Poll';
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip } from 'recharts';

const COMPLIANCE_SCORES: { [key: string]: number } = {
  'cumplio': 100,
  'modificacion_menor': 75,
  'incumplimiento_parcial': 25,
  'incumplimiento_total': 0,
};

const COLORS = {
  'cumplio': '#4caf50',
  'modificacion_menor': '#ff9800',
  'incumplimiento_parcial': '#f44336',
  'incumplimiento_total': '#b71c1c',
};


const cardStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  border: '1px solid',
  borderColor: 'primary.main',
  boxShadow: `0 0 5px #FF5722, 0 0 10px #FF5722`,
  height: '100%' 
};

const AdoptionTrackerPage = () => {
  const { stats, loading, weekLabels, hotelRanking, refreshStats } = useAdoptionStats();
  const { hotels } = useHotels();

  const [nameFilter, setNameFilter] = useState('');
  const [hotelFilter, setHotelFilter] = useState('all');
  const [complianceStatusFilter, setComplianceStatusFilter] = useState('all');
  const [highlightedEmployeeId, setHighlightedEmployeeId] = useState<string | null>(null);
  const rowRefs = useRef<React.RefObject<HTMLTableRowElement>[]>([]);

  const filteredStats = useMemo(() => {
    const latestWeekNum = weekLabels.length > 0 ? parseInt(weekLabels[weekLabels.length - 1].split(" ")[1]) : 0;

    const filtered = stats.filter(stat => {
      const nameMatch = stat.employee.name.toLowerCase().includes(nameFilter.toLowerCase());
      const hotelMatch = hotelFilter === 'all' || stat.employee.hotelId === hotelFilter;
      
      const statusMatch = complianceStatusFilter === 'all' || 
        stat.complianceHistory.some(record => 
          record.week_of_year === latestWeekNum && 
          record.compliance_status === complianceStatusFilter
        );

      return nameMatch && hotelMatch && statusMatch;
    });
    // Create refs for each filtered row
    rowRefs.current = filtered.map((_, i) => rowRefs.current[i] || createRef());
    return filtered;
  }, [stats, nameFilter, hotelFilter, complianceStatusFilter, weekLabels]);

  const employeeRanking = useMemo(() => {
    return [...stats].sort((a, b) => a.compliancePercentage - b.compliancePercentage);
  }, [stats]);

  const hotelComplianceAverage = useMemo(() => {
    const hotelData: { [key: string]: { total: number; count: number } } = {};

    stats.forEach(stat => {
      if (!stat.employee.hotelId) return;
      if (!hotelData[stat.employee.hotelId]) {
        hotelData[stat.employee.hotelId] = { total: 0, count: 0 };
      }
      hotelData[stat.employee.hotelId].total += stat.compliancePercentage;
      hotelData[stat.employee.hotelId].count++;
    });

    return Object.entries(hotelData)
      .map(([hotelId, data]) => ({
        hotelId,
        hotelName: hotels.find(h => h.id === hotelId)?.name || 'Unknown',
        average: data.total / data.count,
      }))
      .sort((a, b) => a.average - b.average);
  }, [stats, hotels]);

  const complianceDistribution = useMemo(() => {
    const distribution = {
      'cumplio': 0,
      'modificacion_menor': 0,
      'incumplimiento_parcial': 0,
      'incumplimiento_total': 0,
    };

    filteredStats.forEach(stat => {
      stat.complianceHistory.forEach(record => {
        if (distribution[record.compliance_status] !== undefined) {
          distribution[record.compliance_status]++;
        }
      });
    });

    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [filteredStats]);

  const previousWeekCompliance = useMemo(() => {
    const lastWeekLabel = weekLabels[weekLabels.length - 2];
    if (!lastWeekLabel) return null;

    const lastWeekNum = parseInt(lastWeekLabel.split(" ")[1]);
    const lastWeekScores = filteredStats
      .flatMap(stat => stat.complianceHistory)
      .filter(record => record.week_of_year === lastWeekNum)
      .map(record => COMPLIANCE_SCORES[record.compliance_status] || 0);

    if (lastWeekScores.length === 0) return null;

    return lastWeekScores.reduce((acc, score) => acc + score, 0) / lastWeekScores.length;
  }, [filteredStats, weekLabels]);


  
  
  const overallCompliance = (filteredStats.reduce((acc, stat) => acc + stat.compliancePercentage, 0) / filteredStats.length) || 0;

  const workrecordHotels = useMemo(() => {
    const workrecordHotelIds = new Set(stats.map(stat => stat.employee.hotelId));
    return hotels.filter(hotel => workrecordHotelIds.has(hotel.id));
  }, [stats, hotels]);

  const handleHotelRankClick = (hotelId: string) => {
    setHotelFilter(hotelId);
    setNameFilter(''); // Clear name filter when clicking hotel rank
  };

  const handleExport = () => {
    const dataToExport = filteredStats.map(stat => {
      const row: any = {
        'Empleado': stat.employee.name,
        'Hotel': hotels.find(h => h.id === stat.employee.hotelId)?.name || 'N/A',
        'Cumplimiento (%)': stat.compliancePercentage.toFixed(0),
      };
      weekLabels.forEach(label => {
        const weekNum = parseInt(label.split(" ")[1]);
        const record = stat.complianceHistory.find(h => h.week_of_year === weekNum);
        row[label] = record ? record.compliance_status : 'N/A';
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Seguimiento');
    XLSX.writeFile(workbook, 'seguimiento_workrecord.xlsx');
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

  const checkForNegativeStreak = (complianceHistory: any[]) => {
    if (complianceHistory.length < 2) return false;

    const sortedHistory = [...complianceHistory].sort((a, b) => a.week_of_year - b.week_of_year);

    for (let i = 0; i < sortedHistory.length - 1; i++) {
      const currentWeek = sortedHistory[i];
      const nextWeek = sortedHistory[i + 1];

      const isCurrentNonCompliant = currentWeek.compliance_status === 'incumplimiento_parcial' || currentWeek.compliance_status === 'incumplimiento_total';
      const isNextNonCompliant = nextWeek.compliance_status === 'incumplimiento_parcial' || nextWeek.compliance_status === 'incumplimiento_total';
      
      if (isCurrentNonCompliant && isNextNonCompliant && (nextWeek.week_of_year === currentWeek.week_of_year + 1)) {
        return true;
      }
    }

    return false;
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
            <Box>
                <Tooltip title="Refrescar Datos">
                    <IconButton onClick={refreshStats} color="primary">
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Exportar a Excel">
                    <IconButton onClick={handleExport} color="primary">
                        <FileDownloadIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
            <StatCard 
                title="Cumplimiento General (Filtrado)" 
                value={`${overallCompliance.toFixed(1)}%`} 
                icon={<PollIcon />} 
                trend={previousWeekCompliance !== null ? overallCompliance - previousWeekCompliance : null}
            />
        </Grid>
        <Grid item xs={12} md={4}>
            <StatCard 
                title="Empleados Mostrados" 
                value={filteredStats.length} 
                icon={<PeopleIcon />} 
            />
        </Grid>
        <Grid item xs={12} md={4}>
            <Card sx={cardStyle}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Distribución de Cumplimiento</Typography>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie
                                data={complianceDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={60}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                            >
                                {complianceDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                                ))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
            <Card sx={cardStyle}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Ranking Hoteles (Incumplimientos)</Typography>
                    <List dense>
                        {hotelRanking.slice(0, 4).map((hotel) => (
                            <ListItemButton key={hotel.hotelId} sx={{py: 0}} onClick={() => handleHotelRankClick(hotel.hotelId)}>
                                <ListItemIcon sx={{minWidth: 'auto', mr: 2}}>
                                    <Badge badgeContent={hotel.nonComplianceCount} color="error" />
                                </ListItemIcon>
                                <ListItemText primary={hotel.hotelName} primaryTypographyProps={{ variant: 'body2' }}/>
                            </ListItemButton>
                        ))}
                    </List>
                </CardContent>
            </Card>
        </Grid>
        <Grid item xs={12} md={4}>
            <Card sx={cardStyle}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Promedio Cumplimiento por Hotel</Typography>
                    <List dense>
                        {hotelComplianceAverage.slice(0, 4).map((hotel) => (
                            <ListItemButton key={hotel.hotelId} sx={{py: 0}} onClick={() => handleHotelRankClick(hotel.hotelId)}>
                                <ListItemIcon sx={{minWidth: 'auto', mr: 1}}>
                                    <TrendingDownIcon color="error"/>
                                </ListItemIcon>
                                <ListItemText 
                                    primary={hotel.hotelName} 
                                    secondary={`${hotel.average.toFixed(0)}% Cumplimiento`}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                />
                            </ListItemButton>
                        ))}
                    </List>
                </CardContent>
            </Card>
        </Grid>
        <Grid item xs={12} md={4}>
            <Card sx={cardStyle}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Ranking Empleados (Peor Cumplimiento)</Typography>
                     <List dense>
                        {employeeRanking.slice(0, 5).map((stat) => (
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
            <Grid item xs={12} sm={4}>
                <TextField
                    fullWidth
                    label="Buscar por nombre"
                    variant="outlined"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                />
            </Grid>
            <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                    <InputLabel>Filtrar por Hotel</InputLabel>
                    <Select value={hotelFilter} label="Filtrar por Hotel" onChange={(e) => setHotelFilter(e.target.value)}>
                    <MenuItem value="all">Todos los Hoteles</MenuItem>
                    {workrecordHotels.map(hotel => <MenuItem key={hotel.id} value={hotel.id}>{hotel.name}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                    <InputLabel>Filtrar por Estado (Últ. Sem.)</InputLabel>
                    <Select value={complianceStatusFilter} label="Filtrar por Estado (Últ. Sem.)" onChange={(e) => setComplianceStatusFilter(e.target.value)}>
                        <MenuItem value="all">Todos</MenuItem>
                        <MenuItem value="cumplio">Cumplió</MenuItem>
                        <MenuItem value="modificacion_menor">Modificación Menor</MenuItem>
                        <MenuItem value="incumplimiento_parcial">Incumplimiento Parcial</MenuItem>
                        <MenuItem value="incumplimiento_total">Incumplimiento Total</MenuItem>
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
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {checkForNegativeStreak(complianceHistory) && (
                      <Tooltip title="Racha de Incumplimiento" placement="top">
                        <WarningIcon color="error" sx={{ mr: 1 }} />
                      </Tooltip>
                    )}
                    {employee.name}
                  </Box>
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
                    <LineChart width={100} height={30} data={sparklineData}>
                      <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} dot={false} />
                    </LineChart>
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