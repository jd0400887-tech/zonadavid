import { useState, useEffect } from 'react';
import { 
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Toolbar, Typography, AppBar, IconButton, Grid, Badge, Popover, Chip, 
  Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, 
  Paper, useTheme, Avatar, Divider, Stack, Tooltip 
} from '@mui/material';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { isToday, isTomorrow, isPast } from 'date-fns';

// Iconos
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ApartmentIcon from '@mui/icons-material/Apartment';
import MenuIcon from '@mui/icons-material/Menu';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import HomeIcon from '@mui/icons-material/Home';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

import { useAuth } from '../hooks/useAuth';
import { useDashboardStats } from '../hooks/useDashboardStats';

const drawerWidth = 260;

const allMenuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Usuarios', icon: <SupervisorAccountIcon />, path: '/usuarios' },
  { text: 'Empleados', icon: <PeopleIcon />, path: '/empleados' },
  { text: 'Hoteles', icon: <ApartmentIcon />, path: '/hoteles' },
  { text: 'Solicitudes', icon: <AssignmentIcon />, path: '/solicitudes' },
  { text: 'Aplicaciones', icon: <PlaylistAddCheckIcon />, path: '/aplicaciones' },
  { text: 'Calidad QA', icon: <VerifiedUserIcon />, path: '/calidad' },
  { text: 'Reporte Asistencia', icon: <AssessmentIcon />, path: '/reporte-asistencia' },
  { text: 'Revisión de Nómina', icon: <FactCheckIcon />, path: '/revision-nomina' },
  { text: 'Seguimiento Workrecord', icon: <QueryStatsIcon />, path: '/seguimiento-workrecord' },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { signOut, session, profile, updateUser } = useAuth();
  const { stats: dashboardStats } = useDashboardStats();
  const unfulfilledRequestsCount = dashboardStats?.unfulfilledRequestsCount || 0;
  const unfulfilledRequests = dashboardStats?.unfulfilledRequests || [];

  const handleDrawerToggle = () => setOpen(!open);

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const menuItems = allMenuItems.filter(item => {
    if (profile?.role === 'ADMIN') return true;
    if (item.text === 'Usuarios') return false;
    
    const userPermissions = profile?.permissions || [];
    
    // Si es INSPECTOR y no tiene permisos definidos, le damos los básicos (sin incluir Calidad QA automáticamente)
    if (profile?.role === 'INSPECTOR' && userPermissions.length === 0) {
      return ['Dashboard', 'Hoteles', 'Empleados', 'Aplicaciones', 'Reporte Asistencia', 'Seguimiento Workrecord'].includes(item.text);
    }
    
    if (profile?.role === 'RECRUITER' && userPermissions.length === 0) {
      return ['Dashboard', 'Solicitudes', 'Aplicaciones'].includes(item.text);
    }
    
    return userPermissions.includes(item.text);
  });

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0F172A' }}>
      <Box sx={{ 
        minHeight: 70, 
        display: 'flex', 
        alignItems: 'center', 
        px: 2,
        gap: 1
      }}>
        <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 900, letterSpacing: '1px' }}>
          MENÚ
        </Typography>
      </Box>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 2 }} />

      <Box sx={{ px: 2, mb: 3 }}>
        <Paper sx={{ 
          p: 2, borderRadius: 3, 
          bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', gap: 2
        }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.9rem', fontWeight: 'bold' }}>
            {profile?.role?.[0] || 'U'}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'bold', display: 'block', lineHeight: 1 }}>
              {profile?.role || 'USUARIO'}
            </Typography>
            <Typography variant="body2" noWrap sx={{ color: 'white', fontWeight: 600 }}>
              {profile?.email?.split('@')[0] || 'Mi Cuenta'}
            </Typography>
            {profile?.assigned_zone && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                Zona: {profile.assigned_zone}
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>

      <Box sx={{ flexGrow: 1, px: 1, overflowY: 'auto' }}>
        <List>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 3, py: 1.2, px: 2,
                    backgroundColor: isActive ? 'rgba(255, 87, 34, 0.15)' : 'transparent',
                    borderLeft: isActive ? '4px solid #FF5722' : '4px solid transparent',
                    color: isActive ? '#FF5722' : 'rgba(255,255,255,0.6)',
                    transition: 'all 0.2s ease',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? '#FF5722' : 'rgba(255,255,255,0.4)', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: isActive ? 800 : 500 }} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.05)', mt: 'auto' }} />

      <List sx={{ px: 1, py: 2 }}>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={handleLogout} 
            sx={{ borderRadius: 3, color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#f44336' } }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><LogoutIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Cerrar Sesión" primaryTypographyProps={{ fontSize: '0.85rem' }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  const currentDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const isLight = theme.palette.mode === 'light';
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    let label = profile?.role === 'INSPECTOR' ? 'Inspector' : (profile?.role || 'Usuario');
    if (hour < 12) return `¡Buenos días, ${label}!`;
    if (hour < 18) return `¡Buenas tardes, ${label}!`;
    return `¡Buenas noches, ${label}!`;
  };

  const getRequestStatus = (startDate: string) => {
    const date = new Date(startDate);
    if (isPast(date) && !isToday(date)) return { label: 'Vencida', color: 'error' };
    if (isToday(date) || isTomorrow(date)) return { label: 'Vence pronto', color: 'warning' };
    return null;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer - 1,
          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 30, 30, 0.8)',
          backdropFilter: 'blur(12px)',
          color: isLight ? '#0F172A' : '#FFFFFF',
          boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.1)' : '0 1px 10px rgba(0,0,0,0.5)',
          borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`,
          left: 0, width: '100%',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 70 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 1 }}><MenuIcon /></IconButton>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', lineHeight: 1.2 }}>{getGreeting()}</Typography>
              <Typography variant="caption" sx={{ color: isLight ? 'text.secondary' : 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase' }}>Sistema de Gestión DA</Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" sx={{ display: { xs: 'none', lg: 'block' }, fontWeight: 700, opacity: 0.7, textTransform: 'capitalize', color: isLight ? 'inherit' : '#FFFFFF' }}>{currentDate}</Typography>
            <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center', opacity: 0.1, display: { xs: 'none', md: 'block' }, bgcolor: isLight ? 'inherit' : 'rgba(255,255,255,0.2)' }} />
            
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ bgcolor: isLight ? 'rgba(255, 87, 34, 0.05)' : 'rgba(255, 255, 255, 0.05)', color: 'primary.main' }}>
              <Badge badgeContent={unfulfilledRequestsCount} color="error" overlap="circular"><NotificationsIcon fontSize="small" /></Badge>
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={open}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            bgcolor: '#0F172A',
            borderRight: 'none',
            boxShadow: '10px 0 30px rgba(0,0,0,0.5)'
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, mt: 8, width: '100%' }}>
        <Outlet />
      </Box>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { borderRadius: 3, mt: 1.5, maxWidth: 320, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Alertas Pendientes</Typography>
          <Divider sx={{ mb: 1, opacity: 0.05 }} />
          {unfulfilledRequests.length > 0 ? (
            <List dense>
              {unfulfilledRequests.map((req) => (
                <ListItemButton key={req.id} onClick={() => { setAnchorEl(null); navigate(`/solicitudes?requestId=${req.id}`); }}>
                  <ListItemText primary={`${req.hotelName || 'H'} - ${req.role}`} secondary={`Inicio: ${new Date(req.start_date).toLocaleDateString()}`} />
                </ListItemButton>
              ))}
            </List>
          ) : <Typography variant="body2" sx={{ py: 2, textAlign: 'center', opacity: 0.5 }}>No hay notificaciones</Typography>}
        </Box>
      </Popover>
    </Box>
  );
}
