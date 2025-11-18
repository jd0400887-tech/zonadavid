import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, Grid, List, ListItem, ListItemText, TextField, Card, CardContent, LinearProgress } from '@mui/material';
import { useMemo, useState } from 'react';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { getDistanceInMiles } from '../../utils/geolocation';
import type { AttendanceRecord, Hotel } from '../../types';

interface MileageReportProps {
  records: (AttendanceRecord & { hotel: Hotel | undefined })[];
  homeLocation: { lat: number; lng: number } | null;
}

const groupRecordsByDay = (records: (AttendanceRecord & { hotel: Hotel | undefined })[]) => {
  return records.reduce((acc, record) => {
    const day = format(parseISO(record.timestamp), 'yyyy-MM-dd');
    if (!acc[day]) { acc[day] = []; }
    acc[day].push(record);
    return acc;
  }, {} as Record<string, (AttendanceRecord & { hotel: Hotel | undefined })[]>);
};

export default function MileageReport({ records, homeLocation }: MileageReportProps) {
  // State for calculator
  const [bonusAmount, setBonusAmount] = useState('');
  const [costPerMile, setCostPerMile] = useState('0.67'); // IRS rate for 2024 as default
  const [circuityFactor, setCircuityFactor] = useState('1.1');

  const dailyMileage = useMemo(() => {
    if (!homeLocation || records.length === 0) return [];
    const groupedRecords = groupRecordsByDay(records);
    const factor = parseFloat(circuityFactor) || 1.0;

    return Object.entries(groupedRecords).map(([day, dayRecords]) => {
      const sortedRecords = dayRecords.sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
      let totalMiles = 0;
      const firstHotel = sortedRecords[0].hotel;
      if (firstHotel?.latitude && firstHotel?.longitude) {
        totalMiles += getDistanceInMiles(homeLocation.lat, homeLocation.lng, firstHotel.latitude, firstHotel.longitude);
      }
      for (let i = 0; i < sortedRecords.length - 1; i++) {
        const currentHotel = sortedRecords[i].hotel;
        const nextHotel = sortedRecords[i + 1].hotel;
        if (currentHotel?.latitude && currentHotel?.longitude && nextHotel?.latitude && nextHotel?.longitude) {
          totalMiles += getDistanceInMiles(currentHotel.latitude, currentHotel.longitude, nextHotel.latitude, nextHotel.longitude);
        }
      }
      const lastHotel = sortedRecords[sortedRecords.length - 1].hotel;
      if (lastHotel?.latitude && lastHotel?.longitude) {
        totalMiles += getDistanceInMiles(lastHotel.latitude, lastHotel.longitude, homeLocation.lat, homeLocation.lng);
      }
      return { date: day, miles: totalMiles * factor };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, homeLocation, circuityFactor]);

  const grandTotal = useMemo(() => dailyMileage.reduce((sum, day) => sum + day.miles, 0), [dailyMileage]);

  const { bonus, totalCost, netResult } = useMemo(() => {
    const parsedBonus = parseFloat(bonusAmount) || 0;
    const cpm = parseFloat(costPerMile) || 0;
    const cost = grandTotal * cpm;
    const net = parsedBonus - cost;
    return { bonus: parsedBonus, totalCost: cost, netResult: net };
  }, [grandTotal, bonusAmount, costPerMile]);

  const monthlyTotals = useMemo(() => {
    const totals = dailyMileage.reduce((acc, day) => {
      const month = format(parseISO(day.date), 'MMMM yyyy', { locale: es });
      if (!acc[month]) { acc[month] = 0; }
      acc[month] += day.miles;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(totals).map(([month, miles]) => ({ month, miles })).sort((a, b) => b.miles - a.miles);
  }, [dailyMileage]);

  const weeklyTotals = useMemo(() => {
    const totals = dailyMileage.reduce((acc, day) => {
      const date = parseISO(day.date);
      const weekStart = format(startOfWeek(date, { locale: es, weekStartsOn: 1 }), 'dd/MMM');
      const weekEnd = format(endOfWeek(date, { locale: es, weekStartsOn: 1 }), 'dd/MMM');
      const weekLabel = `Semana ${weekStart} - ${weekEnd}`;
      if (!acc[weekLabel]) { acc[weekLabel] = 0; }
      acc[weekLabel] += day.miles;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(totals).map(([week, miles]) => ({ week, miles })).reverse();
  }, [dailyMileage]);

  if (!homeLocation) return <Typography variant="h6" align="center" sx={{ mt: 4 }}>Por favor, establece tu domicilio para calcular el kilometraje.</Typography>;
  if (dailyMileage.length === 0) return <Typography variant="h6" align="center" sx={{ mt: 4 }}>No hay datos de kilometraje para el rango seleccionado.</Typography>;

  const costToBonusRatio = bonus > 0 ? Math.min((totalCost / bonus) * 100, 100) : 0;

  return (
    <Box>
      <Box sx={{ my: 3 }}>
        <Typography variant="h5" gutterBottom>Resumen de Millas</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}><Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}><Typography variant="h6" color="text.secondary">Total General</Typography><Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>{grandTotal.toFixed(2)}</Typography><Typography variant="subtitle1" color="text.secondary">millas</Typography></Paper></Grid>
          <Grid item xs={12} sm={6} md={4}><Paper sx={{ p: 2, height: '100%' }}><Typography variant="h6" align="center" gutterBottom>Totales Mensuales</Typography><List dense>{monthlyTotals.map(({ month, miles }) => (<ListItem key={month} disableGutters><ListItemText primary={month} secondary={`${miles.toFixed(2)} millas`} /></ListItem>))}</List></Paper></Grid>
          <Grid item xs={12} sm={12} md={4}><Paper sx={{ p: 2, height: '100%' }}><Typography variant="h6" align="center" gutterBottom>Totales Semanales</Typography><List dense sx={{ 
  maxHeight: 200, 
  overflow: 'auto',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#FF5722',
    borderRadius: '4px',
    boxShadow: '0 0 6px #FF5722',
  },
}}>{weeklyTotals.map(({ week, miles }) => (<ListItem key={week} disableGutters><ListItemText primary={week} secondary={`${miles.toFixed(2)} millas`} /></ListItem>))}</List></Paper></Grid>
        </Grid>
      </Box>

      <Paper sx={{ my: 4, p: 2 }}>
        <Typography variant="h6" gutterBottom>Ajuste de Distancia</Typography>
        <TextField
          fullWidth
          label="Factor de Corrección de Distancia"
          type="number"
          value={circuityFactor}
          onChange={e => setCircuityFactor(e.target.value)}
          helperText="Multiplicador para estimar la distancia real de conducción (ej. 1.3 para un 30% más que la línea recta)."
          inputProps={{ step: "0.1" }}
        />
      </Paper>

      <Card sx={{ my: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Análisis de Costo vs. Bono</Typography>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}><TextField fullWidth label="Bono (USD)" type="number" value={bonusAmount} onChange={e => setBonusAmount(e.target.value)} helperText=" "/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Costo por Milla (USD)" helperText="Incluye gasolina, desgaste, seguro, etc." type="number" value={costPerMile} onChange={e => setCostPerMile(e.target.value)} /></Grid>
            </Grid>
          </Box>
          
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Resultado Neto (Bono - Costo)</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: netResult >= 0 ? 'success.main' : 'error.main' }}>
                {netResult >= 0 ? <TrendingUpIcon sx={{ fontSize: 40 }} /> : <TrendingDownIcon sx={{ fontSize: 40 }} />}
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    ${netResult.toFixed(2)}
                </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Costo Total Estimado: ${totalCost.toFixed(2)} / Bono: ${bonus.toFixed(2)}
            </Typography>
            <LinearProgress
                variant="determinate"
                value={costToBonusRatio}
                color={ costToBonusRatio > 85 ? 'error' : costToBonusRatio > 60 ? 'warning' : 'success' }
                sx={{ height: 10, borderRadius: 5 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {`El costo representa el ${costToBonusRatio.toFixed(0)}% de tu bono.`}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Desglose Diario</Typography>
      <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Fecha</TableCell><TableCell align="right">Millas Totales (aprox.)</TableCell></TableRow></TableHead><TableBody>{dailyMileage.map((day) => (<TableRow key={day.date} hover><TableCell component="th" scope="row">{format(parseISO(day.date), 'EEEE, dd MMMM, yyyy', { locale: es })}</TableCell><TableCell align="right">{day.miles.toFixed(2)} millas</TableCell></TableRow>))}</TableBody></Table></TableContainer>
    </Box>
  );
}
