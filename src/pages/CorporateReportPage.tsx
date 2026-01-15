import { Box, Typography, Grid, Paper, Toolbar, Button, LinearProgress, Divider, Chip, IconButton } from '@mui/material';
import { useCorporateIntelligence, ReportSection } from '../hooks/useCorporateIntelligence';
import { useNavigate } from 'react-router-dom';
import PrintIcon from '@mui/icons-material/Print';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HailIcon from '@mui/icons-material/Hail';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const SectionCard = ({ section, icon, linkTo }: { section: ReportSection, icon: React.ReactNode, linkTo: string }) => {
  const navigate = useNavigate();
  
  return (
    <Paper sx={{ 
        p: 3, 
        height: '100%', 
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid',
        borderColor: 'primary.main',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            borderColor: 'primary.light'
        }
    }}>
      <Box 
        onClick={() => navigate(linkTo)}
        sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 3, 
            cursor: 'pointer',
            '&:hover .section-title': { textDecoration: 'underline' } 
        }}
      >
        <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'primary.main', color: '#fff', mr: 2, display: 'flex', boxShadow: '0 0 10px rgba(255, 87, 34, 0.5)' }}>
            {icon}
        </Box>
        <Typography variant="h6" fontWeight="bold" color="primary.main" className="section-title" sx={{ flexGrow: 1 }}>
          {section.title}
        </Typography>
        <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <ArrowForwardIcon />
        </IconButton>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {section.metrics.map((metric, idx) => (
          <Grid item xs={6} key={idx}>
            <Box>
              <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.6)' }}>
                {metric.label}
              </Typography>
              <Typography 
                variant="h4" 
                color={metric.status === 'critical' ? '#ff5252' : metric.status === 'warning' ? '#ffab40' : metric.status === 'good' ? '#69f0ae' : '#fff'}
                fontWeight="bold"
              >
                {metric.value}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', color: 'primary.light' }}>
            <InfoIcon fontSize="small" sx={{ mr: 1, opacity: 0.8 }} /> 
            ANÁLISIS ESTRATÉGICO
        </Typography>
        {section.insights.map((insight, idx) => (
            <Box key={idx} sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                mb: 1.5, 
                p: 1.5, 
                bgcolor: insight.type === 'negative' ? 'rgba(211, 47, 47, 0.15)' : insight.type === 'warning' ? 'rgba(237, 108, 2, 0.15)' : 'rgba(255,255,255,0.03)',
                borderLeft: '3px solid',
                borderColor: insight.type === 'positive' ? '#4caf50' : insight.type === 'negative' ? '#f44336' : insight.type === 'warning' ? '#ff9800' : '#2196f3',
                borderRadius: '0 4px 4px 0'
            }}>
                <Typography variant="body2" sx={{ lineHeight: 1.4, color: 'rgba(255,255,255,0.9)' }}>
                    {insight.text}
                </Typography>
            </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default function CorporateReportPage() {
  const report = useCorporateIntelligence();
  const navigate = useNavigate();

  if (report.loading) {
    return (
        <Box sx={{ width: '100%', mt: 10, px: 5, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom color="primary">Generando Inteligencia de Negocio...</Typography>
            <Typography variant="body2" sx={{ mb: 3, opacity: 0.7 }}>Consolidando datos de todos los módulos operativos</Typography>
            <LinearProgress color="primary" sx={{ height: 8, borderRadius: 4 }} />
        </Box>
    );
  }

  // Safe check in case report is null despite loading being false (shouldn't happen with hook logic but good for TS)
  if (!report.talent) return null;

  const handlePrint = () => {
    window.print();
  };

  const healthColor = report.accountHealth.status === 'critical' ? '#f44336' :
                      report.accountHealth.status === 'risk' ? '#ffa726' :
                      '#66bb6a';

  return (
    <Box>
      <Toolbar />
      <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: '1600px', margin: '0 auto' }}>
        
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
            <Box>
                <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ letterSpacing: -1 }}>
                    Informe Corporativo
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 300 }}>
                        Estrategia y Operaciones DA
                    </Typography>
                    <Chip 
                        label={new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })} 
                        size="small" 
                        sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 'bold' }} 
                    />
                </Box>
            </Box>
            <Button 
                variant="contained" 
                startIcon={<PrintIcon />} 
                onClick={handlePrint}
                sx={{ 
                    displayPrint: 'none',
                    background: 'linear-gradient(45deg, #FF5722 30%, #FF8A65 90%)',
                    boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
                }}
            >
                Exportar / Imprimir
            </Button>
        </Box>

        {/* Global Account Health Score */}
        <Paper 
            sx={{ 
                p: 4, 
                mb: 4, 
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '2px solid',
                borderColor: healthColor,
                boxShadow: `0 0 20px ${healthColor}33`,
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Background Accent */}
            <Box sx={{ 
                position: 'absolute', 
                top: -50, 
                right: -50, 
                width: 200, 
                height: 200, 
                borderRadius: '50%', 
                bgcolor: healthColor, 
                opacity: 0.05,
                filter: 'blur(40px)'
            }} />

            <Grid container alignItems="center" spacing={4}>
                <Grid item xs={12} md={3} sx={{ textAlign: 'center', borderRight: { md: '1px solid rgba(255,255,255,0.1)' } }}>
                    <Typography variant="h1" fontWeight="bold" sx={{ color: healthColor, lineHeight: 1 }}>
                        {report.accountHealth.score}
                    </Typography>
                    <Typography variant="h6" sx={{ color: healthColor, opacity: 0.8, mt: 1 }}>
                        PUNTOS DE SALUD
                    </Typography>
                </Grid>
                <Grid item xs={12} md={9}>
                    <Typography variant="h4" gutterBottom fontWeight="bold">
                        Estado de la Cuenta: 
                        <Box component="span" sx={{ ml: 2, color: healthColor }}>
                            {report.accountHealth.status === 'critical' ? 'CRÍTICO' : report.accountHealth.status === 'risk' ? 'EN RIESGO' : 'SALUDABLE'}
                        </Box>
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 300, lineHeight: 1.5 }}>
                        {report.accountHealth.message}
                    </Typography>
                    <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                        <Chip label="Análisis en tiempo real" size="small" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)' }} />
                        <Chip label="Basado en 4 pilares operativos" size="small" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)' }} />
                    </Box>
                </Grid>
            </Grid>
        </Paper>

        <Grid container spacing={3}>
            {/* 1. TALENT */}
            <Grid item xs={12} md={6} lg={4}>
                <SectionCard section={report.talent} icon={<PeopleIcon />} linkTo="/empleados" />
            </Grid>

            {/* 2. DEMAND */}
            <Grid item xs={12} md={6} lg={4}>
                <SectionCard section={report.demand} icon={<AssignmentIcon />} linkTo="/solicitudes" />
            </Grid>

            {/* 3. SUPPLY */}
            <Grid item xs={12} md={6} lg={4}>
                <SectionCard section={report.supply} icon={<HailIcon />} linkTo="/aplicaciones" />
            </Grid>

             {/* 4. VISITS */}
             <Grid item xs={12} md={6} lg={6}>
                <SectionCard section={report.visits} icon={<TrendingUpIcon />} linkTo="/reporte-asistencia" />
            </Grid>

             {/* 5. WORKRECORD */}
             <Grid item xs={12} md={6} lg={6}>
                <SectionCard section={report.workrecord} icon={<FactCheckIcon />} linkTo="/seguimiento-workrecord" />
            </Grid>
        </Grid>

        {/* HOTEL HEALTH RANKING - FULL LIST */}
        <Box sx={{ mt: 4, mb: 6 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                <WarningIcon color="inherit" sx={{ mr: 1 }} />
                Semáforo de Salud de la Cuenta (Listado Completo)
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.7 }}>
                Hoteles ordenados por nivel de criticidad. Haga clic en un hotel para ver sus detalles y resolver incidencias.
            </Typography>
            
            <Paper sx={{ 
                backgroundColor: 'rgba(0,0,0,0.2)', 
                border: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden' 
            }}>
                <Grid container sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 2, fontWeight: 'bold', display: { xs: 'none', md: 'flex' }, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <Grid item xs={4}>HOTEL</Grid>
                    <Grid item xs={2} textAlign="center">ESTADO</Grid>
                    <Grid item xs={6}>INCIDENCIAS Y ALERTAS DETECTADAS</Grid>
                </Grid>
                
                {report.hotelHealth.map((hotel) => (
                    <Box 
                        key={hotel.id} 
                        onClick={() => navigate(`/hotel/${hotel.id}`)}
                        sx={{ 
                            p: 2, 
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            alignItems: { xs: 'flex-start', md: 'center' }
                        }}
                    >
                        <Grid container alignItems="center">
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'primary.light', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.2)' }}>
                                    {hotel.name}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={2} sx={{ my: { xs: 1, md: 0 }, textAlign: { md: 'center' } }}>
                                <Chip 
                                    label={hotel.status === 'critical' ? 'CRÍTICO' : hotel.status === 'warning' ? 'RIESGO' : 'SALUDABLE'} 
                                    sx={{ 
                                        fontWeight: 'bold',
                                        width: '100px',
                                        cursor: 'pointer',
                                        bgcolor: hotel.status === 'critical' ? 'rgba(244, 67, 54, 0.2)' : hotel.status === 'warning' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                                        color: hotel.status === 'critical' ? '#ff5252' : hotel.status === 'warning' ? '#ffab40' : '#69f0ae',
                                        border: '1px solid'
                                    }}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {hotel.issues.length > 0 ? hotel.issues.map((issue, i) => (
                                        <Chip 
                                            key={i} 
                                            label={issue} 
                                            size="small" 
                                            variant="outlined" 
                                            sx={{ 
                                                color: 'rgba(255,255,255,0.7)', 
                                                borderColor: 'rgba(255,255,255,0.2)',
                                                fontSize: '0.7rem' 
                                            }} 
                                        />
                                    )) : (
                                        <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                                            <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} /> Operación Óptima
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                ))}
            </Paper>
        </Box>

        <Box sx={{ mt: 5, textAlign: 'center', color: 'text.secondary', displayPrint: 'none' }}>
            <Typography variant="caption">
                Este informe consolida datos en tiempo real de los módulos de Gestión DA. Para profundizar, visite el módulo específico.
            </Typography>
        </Box>

      </Box>
    </Box>
  );
}
