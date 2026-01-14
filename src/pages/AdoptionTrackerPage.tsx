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
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; // For "Modificación Menor"
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'; // For "Incumplimiento Parcial"
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt'; // For "Incumplimiento Total"
import BlockIcon from '@mui/icons-material/Block'; // For "No Aplica"
import type { Employee } from '../types';
import StatCard from '../components/dashboard/StatCard';
import PeopleIcon from '@mui/icons-material/People';
import PollIcon from '@mui/icons-material/Poll';
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

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
  'no_aplica': '#9e9e9e',
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
  
  // Modal State
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

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

  // Data for Stacked Bar Chart (Weekly Evolution)
  const weeklyEvolutionData = useMemo(() => {
    if (weekLabels.length === 0) return [];

    return weekLabels.map(label => {
        const weekNum = parseInt(label.split(" ")[1]);
        const dataPoint: any = { name: label };
        
        // Initialize counts
        Object.keys(COLORS).forEach(key => dataPoint[key] = 0);

        filteredStats.forEach(stat => {
            const record = stat.complianceHistory.find(h => h.week_of_year === weekNum);
            if (record && COLORS[record.compliance_status as keyof typeof COLORS]) {
                dataPoint[record.compliance_status]++;
            } else {
                // If no record or invalid status, count as unknown or ignore? 
                // For now, we only count known statuses.
            }
        });
        return dataPoint;
    });
  }, [filteredStats, weekLabels]);

  const handleOpenDetailModal = (stat: any) => {
    setSelectedEmployeeForDetail(stat);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedEmployeeForDetail(null);
  };

  const employeeRanking = useMemo(() => {
    return [...stats].sort((a, b) => a.compliancePercentage - b.compliancePercentage);
  }, [stats]);

  const hotelComplianceAverage = useMemo(() => {
    const hotelData: { [key: string]: { 
        total: number; 
        count: number;
        lastWeekTotal: number;
        lastWeekCount: number;
        prevWeekTotal: number;
        prevWeekCount: number;
    } } = {};

    // Get week numbers for trend calculation
    const hasTrendData = weekLabels.length >= 2;
    const lastWeekNum = hasTrendData ? parseInt(weekLabels[weekLabels.length - 1].split(" ")[1]) : -1;
    const prevWeekNum = hasTrendData ? parseInt(weekLabels[weekLabels.length - 2].split(" ")[1]) : -1;

    stats.forEach(stat => {
      if (!stat.employee.hotelId) return;
      if (!hotelData[stat.employee.hotelId]) {
        hotelData[stat.employee.hotelId] = { 
            total: 0, count: 0,
            lastWeekTotal: 0, lastWeekCount: 0,
            prevWeekTotal: 0, prevWeekCount: 0
        };
      }
      hotelData[stat.employee.hotelId].total += stat.compliancePercentage;
      hotelData[stat.employee.hotelId].count++;

      if (hasTrendData) {
        const lastWeekRecord = stat.complianceHistory.find(h => h.week_of_year === lastWeekNum);
        const prevWeekRecord = stat.complianceHistory.find(h => h.week_of_year === prevWeekNum);

        if (lastWeekRecord) {
            hotelData[stat.employee.hotelId].lastWeekTotal += COMPLIANCE_SCORES[lastWeekRecord.compliance_status] || 0;
            hotelData[stat.employee.hotelId].lastWeekCount++;
        }
        if (prevWeekRecord) {
            hotelData[stat.employee.hotelId].prevWeekTotal += COMPLIANCE_SCORES[prevWeekRecord.compliance_status] || 0;
            hotelData[stat.employee.hotelId].prevWeekCount++;
        }
      }
    });

    return Object.entries(hotelData)
      .map(([hotelId, data]) => {
        const avgOverall = data.count > 0 ? data.total / data.count : 0;
        let trend = 0;
        
        if (hasTrendData && data.lastWeekCount > 0 && data.prevWeekCount > 0) {
            const avgLast = data.lastWeekTotal / data.lastWeekCount;
            const avgPrev = data.prevWeekTotal / data.prevWeekCount;
            trend = avgLast - avgPrev;
        }

        return {
            hotelId,
            hotelName: hotels.find(h => h.id === hotelId)?.name || 'Unknown',
            average: avgOverall,
            trend,
        };
      })
      .sort((a, b) => a.average - b.average);
  }, [stats, hotels, weekLabels]);

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

  // Generate Smart Insights (Diagnostic Level)
  const insights = useMemo(() => {
      const messages = [];
      const latestWeekNum = weekLabels.length > 0 ? parseInt(weekLabels[weekLabels.length - 1].split(" ")[1]) : 0;
      
      // 1. Trend Insight (General)
      if (previousWeekCompliance !== null) {
          const diff = overallCompliance - previousWeekCompliance;
          if (Math.abs(diff) >= 2) {
              messages.push({
                  type: diff > 0 ? 'positive' : 'negative',
                  text: `Tendencia Global: El cumplimiento ${diff > 0 ? 'mejoró' : 'cayó'} un ${Math.abs(diff).toFixed(1)}% vs. semana anterior.`
              });
          }
      }

      // 2. Anomaly Detection (Sudden Drops in Hotels)
      const crashingHotels = hotelComplianceAverage.filter(h => h.trend <= -15);
      if (crashingHotels.length > 0) {
          const hotelNames = crashingHotels.map(h => h.hotelName).join(", ");
          messages.push({
              type: 'warning',
              text: `Alerta de Caída: ${hotelNames} ${crashingHotels.length > 1 ? 'cayeron' : 'cayó'} drásticamente (>15%) esta semana.`
          });
      }

      // 3. Role Bottleneck Analysis
      const roleStats: Record<string, { total: number; count: number }> = {};
      stats.forEach(stat => {
          const role = stat.employee.role || 'Sin Rol';
          if (!roleStats[role]) roleStats[role] = { total: 0, count: 0 };
          roleStats[role].total += stat.compliancePercentage;
          roleStats[role].count++;
      });
      
      const worstRoleEntry = Object.entries(roleStats)
          .filter(([_, data]) => data.count >= 3) // Ignore roles with very few people
          .sort((a, b) => (a[1].total / a[1].count) - (b[1].total / b[1].count))[0];

      if (worstRoleEntry) {
          const worstRoleName = worstRoleEntry[0];
          const worstRoleAvg = worstRoleEntry[1].total / worstRoleEntry[1].count;
          if (worstRoleAvg < overallCompliance - 10) { // If significantly below average
               messages.push({
                  type: 'warning',
                  text: `Cuello de Botella: El rol de "${worstRoleName}" tiene el rendimiento más bajo (${worstRoleAvg.toFixed(0)}%), afectando el promedio.`
              });
          }
      }

      // 4. Chronic Offenders (3+ weeks of non-compliance)
      const chronicOffenders = stats.filter(stat => {
          // Get last 3 records
          const recentHistory = stat.complianceHistory
            .filter(h => h.week_of_year <= latestWeekNum)
            .sort((a, b) => b.week_of_year - a.week_of_year)
            .slice(0, 3);
          
          if (recentHistory.length < 3) return false;
          // Check if all are partial or total non-compliance
          return recentHistory.every(h => h.compliance_status === 'incumplimiento_parcial' || h.compliance_status === 'incumplimiento_total');
      }).length;

      if (chronicOffenders > 0) {
           messages.push({
              type: 'negative',
              text: `Riesgo: ${chronicOffenders} empleados son "Reincidentes Crónicos" (3+ semanas consecutivas sin cumplir).`
          });
      }

      // 5. High "No Aplica" Rate
      const currentWeekRecords = filteredStats
        .map(s => s.complianceHistory.find(h => h.week_of_year === latestWeekNum))
        .filter(r => r !== undefined);
      
      const noAplicaCount = currentWeekRecords.filter(r => r?.compliance_status === 'no_aplica').length;
      if (currentWeekRecords.length > 0 && (noAplicaCount / currentWeekRecords.length) > 0.15) {
           messages.push({
              type: 'neutral',
              text: `Datos: Alto volumen de "No Aplica" (${((noAplicaCount / currentWeekRecords.length)*100).toFixed(0)}%) esta semana. Verificar motivos.`
          });
      }

      // 6. Root Cause Analysis (Common Reason Mining)
      const recentNonCompliance = stats.flatMap(s => s.complianceHistory)
        .filter(h => h.week_of_year === latestWeekNum && (h.compliance_status === 'incumplimiento_total' || h.compliance_status === 'incumplimiento_parcial'))
        .map(h => h.reason?.toLowerCase() || '');

      if (recentNonCompliance.length > 0) {
          const keywords = ['firma', 'horario', 'uniforme', 'retraso', 'asistencia', 'documento'];
          const counts: Record<string, number> = {};
          
          recentNonCompliance.forEach(reason => {
              keywords.forEach(word => {
                  if (reason.includes(word)) {
                      counts[word] = (counts[word] || 0) + 1;
                  }
              });
          });

          const topReasonEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
          
          if (topReasonEntry && topReasonEntry[1] > 2) { // Minimum threshold to be relevant
              const percentage = ((topReasonEntry[1] / recentNonCompliance.length) * 100).toFixed(0);
              messages.push({
                  type: 'warning',
                  text: `Causa Raíz: El problema más frecuente esta semana está relacionado con "${topReasonEntry[0].toUpperCase()}" (${percentage}% de los casos).`
              });
          }
      }

      // 7. Top Performer (Fallback if no negatives)
      if (messages.length < 2) {
        const bestHotel = hotelComplianceAverage.length > 0 ? hotelComplianceAverage[hotelComplianceAverage.length - 1] : null;
        if (bestHotel && bestHotel.average > 90) {
            messages.push({
                type: 'positive',
                text: `Destacado: ${bestHotel.hotelName} lidera con un ${bestHotel.average.toFixed(0)}% de cumplimiento promedio.`
            });
        }
      }
      
      return messages.slice(0, 5); // Limit to top 5 insights
  }, [overallCompliance, previousWeekCompliance, hotelRanking, hotelComplianceAverage, stats, filteredStats, weekLabels]);

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

      {/* Smart Insights Section */}
      {insights.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, background: 'linear-gradient(90deg, rgba(25,118,210,0.1) 0%, rgba(25,118,210,0.05) 100%)', borderLeft: '4px solid #1976d2' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AutoAwesomeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" color="primary">Resumen Inteligente</Typography>
            </Box>
            <Grid container spacing={2}>
                {insights.map((insight, index) => (
                    <Grid item xs={12} md={4} key={index}>
                         <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <LightbulbIcon 
                                sx={{ 
                                    mr: 1, 
                                    fontSize: 20, 
                                    mt: 0.3,
                                    color: insight.type === 'positive' ? 'success.main' : 
                                           insight.type === 'negative' || insight.type === 'warning' ? 'error.main' : 'text.secondary'
                                }} 
                            />
                            <Typography variant="body2">{insight.text}</Typography>
                         </Box>
                    </Grid>
                ))}
            </Grid>
        </Paper>
      )}
      
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
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
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
                                    {hotel.trend > 0 ? (
                                        <ArrowUpwardIcon color="success"/>
                                    ) : hotel.trend < 0 ? (
                                        <ArrowDownwardIcon color="error"/>
                                    ) : (
                                        <TrendingFlatIcon color="action" />
                                    )}
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

      {/* Weekly Evolution Chart */}
      <Card sx={{ ...cardStyle, mb: 3 }}>
        <CardContent>
            <Typography variant="h6" gutterBottom>Evolución Semanal (Cantidad de Empleados por Estado)</Typography>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    data={weeklyEvolutionData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <defs>
                        <linearGradient id="colorCumplio" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS['cumplio']} stopOpacity={0.9}/>
                            <stop offset="95%" stopColor={COLORS['cumplio']} stopOpacity={0.6}/>
                        </linearGradient>
                        <linearGradient id="colorModificacion" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS['modificacion_menor']} stopOpacity={0.9}/>
                            <stop offset="95%" stopColor={COLORS['modificacion_menor']} stopOpacity={0.6}/>
                        </linearGradient>
                        <linearGradient id="colorParcial" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS['incumplimiento_parcial']} stopOpacity={0.9}/>
                            <stop offset="95%" stopColor={COLORS['incumplimiento_parcial']} stopOpacity={0.6}/>
                        </linearGradient>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS['incumplimiento_total']} stopOpacity={0.9}/>
                            <stop offset="95%" stopColor={COLORS['incumplimiento_total']} stopOpacity={0.6}/>
                        </linearGradient>
                         <linearGradient id="colorNoAplica" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS['no_aplica']} stopOpacity={0.9}/>
                            <stop offset="95%" stopColor={COLORS['no_aplica']} stopOpacity={0.6}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                        dataKey="name" 
                        stroke="rgba(255,255,255,0.5)" 
                        tick={{fill: 'rgba(255,255,255,0.7)', fontSize: 12}}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    />
                    <YAxis 
                        stroke="rgba(255,255,255,0.5)" 
                        tick={{fill: 'rgba(255,255,255,0.7)', fontSize: 12}}
                        tickLine={false}
                        axisLine={false}
                    />
                    <RechartsTooltip 
                        contentStyle={{ 
                            backgroundColor: 'rgba(20, 20, 20, 0.9)', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                        }}
                        itemStyle={{ color: '#fff', fontSize: '13px', padding: '2px 0' }}
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }}/>
                    <Bar dataKey="cumplio" name="Cumplió" stackId="a" fill="url(#colorCumplio)" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="modificacion_menor" name="Modificación Menor" stackId="a" fill="url(#colorModificacion)" />
                    <Bar dataKey="incumplimiento_parcial" name="Incumplimiento Parcial" stackId="a" fill="url(#colorParcial)" />
                    <Bar dataKey="incumplimiento_total" name="Incumplimiento Total" stackId="a" fill="url(#colorTotal)" />
                    <Bar dataKey="no_aplica" name="No Aplica" stackId="a" fill="url(#colorNoAplica)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>


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
                  <Box 
                    sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(255, 255, 255, 0.4)' }}
                    onClick={() => handleOpenDetailModal({ employee, complianceHistory })}
                  >
                    {checkForNegativeStreak(complianceHistory) && (
                      <Tooltip title="Racha de Incumplimiento" placement="top">
                        <WarningIcon color="error" sx={{ mr: 1 }} />
                      </Tooltip>
                    )}
                    {employee.name}
                    <InfoIcon sx={{ ml: 1, fontSize: 16, color: 'text.secondary', opacity: 0.7 }} />
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
                        case 'no_aplica':
                            icon = <BlockIcon />;
                            iconColor = 'action';
                            tooltipTitle = `No Aplica: ${record.reason || 'Sin motivo especificado'}`;
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

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onClose={handleCloseDetailModal} maxWidth="md" fullWidth>
        {selectedEmployeeForDetail && (
            <>
                <DialogTitle>
                    Historial Detallado: {selectedEmployeeForDetail.employee.name}
                    <Typography variant="subtitle2" color="text.secondary">
                        {hotels.find(h => h.id === selectedEmployeeForDetail.employee.hotelId)?.name || 'Hotel desconocido'}
                    </Typography>
                </DialogTitle>
                <DialogContent dividers>
                    <List>
                        {weekLabels.map((label, index) => {
                             const weekNum = parseInt(label.split(" ")[1]);
                             const record = selectedEmployeeForDetail.complianceHistory.find((h: any) => h.week_of_year === weekNum);
                             
                             if (!record) return null;

                             const statusColor = COLORS[record.compliance_status as keyof typeof COLORS] || '#grey';
                             
                             return (
                                <ListItem key={label} sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Grid container alignItems="center">
                                        <Grid item xs={2}>
                                            <Typography variant="subtitle2">{label}</Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                             <Box sx={{ display: 'flex', alignItems: 'center', color: statusColor }}>
                                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: statusColor, mr: 1 }} />
                                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                    {record.compliance_status.replace(/_/g, ' ')}
                                                </Typography>
                                             </Box>
                                        </Grid>
                                        <Grid item xs={7}>
                                            <Typography variant="body2" color="text.secondary">
                                                {record.reason || 'Sin observaciones'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </ListItem>
                             );
                        })}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDetailModal}>Cerrar</Button>
                </DialogActions>
            </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdoptionTrackerPage;