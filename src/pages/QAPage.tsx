import { useState, useMemo, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, Button, Stack, Avatar, 
  Chip, Divider, useTheme, Card, CardContent,
  List, ListItem, ListItemAvatar, ListItemText, CircularProgress,
  Tooltip, Snackbar, Alert
} from '@mui/material';

// Iconos
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PersonIcon from '@mui/icons-material/Person';
import ApartmentIcon from '@mui/icons-material/Apartment';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { useAuth } from '../hooks/useAuth';
import { QA_TEMPLATES, QATemplate } from '../data/qaTemplates';
import QAFormDialog from '../components/qa/QAFormDialog';
import QADetailsDialog from '../components/qa/QADetailsDialog';
import { supabase } from '../utils/supabase';

export default function QAPage() {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const { profile, session } = useAuth();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<QATemplate | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<any | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState<any[]>([]);

  // Cargar auditorías reales
  const fetchAudits = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('qa_audits')
        .select('*, employees(name), hotels(name)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (profile?.role === 'INSPECTOR' && profile.assigned_zone) {
        query = query.eq('zone', profile.assigned_zone);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAudits(data || []);
    } catch (error: any) {
      console.error('Error al cargar auditorías:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) fetchAudits();
  }, [profile]);

  const stats = useMemo(() => {
    if (audits.length === 0) return { totalAudits: 0, avgScore: 0, criticalFailures: 0 };
    const total = audits.length;
    const avg = Math.round(audits.reduce((acc, curr) => acc + curr.score, 0) / total);
    const criticals = audits.filter(a => a.score < 70).length;
    return { totalAudits: total, avgScore: avg, criticalFailures: criticals };
  }, [audits]);

  const handleStartAudit = (template: QATemplate) => {
    setSelectedTemplate(template);
    setIsDialogOpen(true);
  };

  const handleOpenDetails = (audit: any) => {
    setSelectedAudit(audit);
    setIsDetailsOpen(true);
  };

  const handleSubmitAudit = async (auditData: any) => {
    try {
      const isEmployeeAudit = auditData.type === 'staff' || auditData.type === 'room';
      const { error } = await supabase
        .from('qa_audits')
        .insert([{
          inspector_id: session?.user?.id,
          type: auditData.type,
          employee_id: isEmployeeAudit ? auditData.target_id : null,
          hotel_id: !isEmployeeAudit ? auditData.target_id : null,
          score: auditData.score,
          audit_data: auditData.answers,
          notes: auditData.notes,
          zone: auditData.zone
        }]);

      if (error) throw error;
      setSnackbar({ open: true, message: 'Auditoría guardada correctamente', severity: 'success' });
      fetchAudits();
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Error al guardar: ' + error.message, severity: 'error' });
    }
  };

  const getTargetName = (audit: any) => {
    if (audit.type === 'staff' || audit.type === 'room') return audit.employees?.name || 'Empleado desconocido';
    return audit.hotels?.name || 'Hotel desconocido';
  };

  const getTemplateIcon = (id: string) => {
    switch (id) {
      case 'staff': return <PersonIcon fontSize="large" />;
      case 'room': return <MeetingRoomIcon fontSize="large" />;
      case 'hotel': return <ApartmentIcon fontSize="large" />;
      default: return <VerifiedUserIcon fontSize="large" />;
    }
  };

  const getTemplateColor = (id: string) => {
    switch (id) {
      case 'staff': return '#FF5722';
      case 'room': return '#2196F3';
      case 'hotel': return '#4CAF50';
      default: return '#9C27B0';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* ENCABEZADO */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)', border: '1px solid rgba(255, 87, 34, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ backgroundColor: 'primary.main', p: 1.5, borderRadius: 2, display: 'flex', boxShadow: '0 4px 12px rgba(255, 87, 34, 0.3)' }}>
            <VerifiedUserIcon sx={{ color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>Calidad QA</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Auditorías de Excelencia Operativa - Zona {profile?.assigned_zone || 'Centro'}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* RESUMEN DE ESTADÍSTICAS */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {[
          { label: 'Auditorías Realizadas', val: stats.totalAudits, icon: <HistoryIcon />, color: '#2196F3' },
          { label: 'Promedio de Calidad', val: `${stats.avgScore}%`, icon: <TrendingUpIcon />, color: '#4CAF50' },
          { label: 'Fallas Críticas', val: stats.criticalFailures, icon: <WarningAmberIcon />, color: '#f44336' },
        ].map((s) => (
          <Grid item xs={12} sm={4} key={s.label}>
            <Paper sx={{ p: 2.5, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, bgcolor: isLight ? 'white' : 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Avatar sx={{ bgcolor: `${s.color}15`, color: s.color, width: 48, height: 48 }}>{s.icon}</Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>{s.val}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{s.label}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* SELECTOR DE AUDITORÍAS */}
        <Grid item xs={12} md={7}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Nueva Auditoría</Typography>
          <Grid container spacing={2}>
            {QA_TEMPLATES.map((template) => {
              const color = getTemplateColor(template.id);
              return (
                <Grid item xs={12} sm={6} key={template.id}>
                  <Card sx={{ borderRadius: 4, height: '100%', border: `1px solid ${color}22`, transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', '&:hover': { transform: 'translateY(-5px)', boxShadow: `0 8px 25px ${color}22`, borderColor: color } }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 56, height: 56, mb: 2 }}>{getTemplateIcon(template.id)}</Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{template.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{template.description}</Typography>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button variant="contained" fullWidth startIcon={<AddIcon />} onClick={() => handleStartAudit(template)} sx={{ borderRadius: 2, bgcolor: color, '&:hover': { bgcolor: color, opacity: 0.9 } }}>Iniciar Auditoría</Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Grid>

        {/* HISTORIAL RECIENTE */}
        <Grid item xs={12} md={5}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Actividad Reciente</Typography>
          <Paper sx={{ borderRadius: 4, overflow: 'hidden', bgcolor: isLight ? 'white' : 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {loading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={30} /></Box>
            ) : audits.length > 0 ? (
              <List sx={{ p: 0 }}>
                {audits.map((audit, index) => (
                  <Box key={audit.id}>
                    <ListItem sx={{ py: 2, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }} onClick={() => handleOpenDetails(audit)}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: getTemplateColor(audit.type) }}>{getTemplateIcon(audit.type)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={getTargetName(audit)} secondary={new Date(audit.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} primaryTypographyProps={{ fontWeight: 'bold' }} />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: audit.score >= 90 ? 'success.main' : (audit.score >= 70 ? 'warning.main' : 'error.main') }}>{audit.score}%</Typography>
                        <Typography variant="caption" color="text.secondary">Calificación</Typography>
                      </Box>
                    </ListItem>
                    {index < audits.length - 1 && <Divider sx={{ opacity: 0.05 }} />}
                  </Box>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 5, textAlign: 'center', opacity: 0.5 }}>
                <HistoryIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2">No se han realizado auditorías aún.</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <QAFormDialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} template={selectedTemplate} onSubmit={handleSubmitAudit} />
      <QADetailsDialog open={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} audit={selectedAudit} />
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}><Alert severity={snackbar.severity}>{snackbar.message}</Alert></Snackbar>
    </Box>
  );
}
