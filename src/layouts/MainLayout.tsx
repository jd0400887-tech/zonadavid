import { useState, useEffect } from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, AppBar, IconButton, Grid, Badge, Popover, Chip, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, Paper, useTheme } from '@mui/material';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { isToday, isTomorrow, isPast } from 'date-fns';

import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ApartmentIcon from '@mui/icons-material/Apartment';
import MenuIcon from '@mui/icons-material/Menu';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ArchiveIcon from '@mui/icons-material/Archive';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import HomeIcon from '@mui/icons-material/Home'; // Icon for Home Location
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import { useAuth } from '../hooks/useAuth';
import { useDashboardStats } from '../hooks/useDashboardStats';

const drawerWidth = 240;

const allMenuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Usuarios', icon: <SupervisorAccountIcon />, path: '/usuarios' },
  { text: 'Empleados', icon: <PeopleIcon />, path: '/empleados' },
  { text: 'Hoteles', icon: <ApartmentIcon />, path: '/hoteles' },
  { text: 'Solicitudes', icon: <AssignmentIcon />, path: '/solicitudes' },
  { text: 'Aplicaciones', icon: <PlaylistAddCheckIcon />, path: '/aplicaciones' },
  { text: 'Reporte Asistencia', icon: <AssessmentIcon />, path: '/reporte-asistencia' },
  { text: 'Revisión de Nómina', icon: <FactCheckIcon />, path: '/revision-nomina' },
  { text: 'Seguimiento Workrecord', icon: <QueryStatsIcon />, path: '/seguimiento-workrecord' },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { signOut, session, profile, updateUser } = useAuth(); // Added profile
  const { unfulfilledRequestsCount, unfulfilledRequests } = useDashboardStats();

  const menuItems = allMenuItems.filter(item => {
    if (profile?.role === 'ADMIN') return true; // Admin ve todo siempre
    if (item.text === 'Usuarios') return false; // Solo Admin ve Usuarios
    
    // El resto depende de los permisos marcados
    return (profile?.permissions || []).includes(item.text);
  });

  // State for Home Location Dialog
  const [homeDialogOpen, setHomeDialogOpen] = useState(false);
  const [homeLat, setHomeLat] = useState('');
  const [homeLng, setHomeLng] = useState('');

  useEffect(() => {
    if (session?.user?.user_metadata) {
      setHomeLat(session.user.user_metadata.home_lat || '');
      setHomeLng(session.user.user_metadata.home_lng || '');
    }
  }, [session]);

  const handleDrawerToggle = () => setIsDrawerOpen(!isDrawerOpen);
  const handleNavigation = (path: string) => {
    navigate(path);
    setIsDrawerOpen(false);
  };
  const handleLogout = async () => {
    try {
      setIsDrawerOpen(false); // Close drawer first
      await signOut();
      navigate('/login', { replace: true }); // Use replace to prevent going back
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback redirect even if signOut fails
      navigate('/login', { replace: true });
    }
  };
  const handleNotificationClick = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
  const handleNotificationClose = () => setAnchorEl(null);

  const handleOpenHomeDialog = () => {
    setHomeDialogOpen(true);
  };

  const handleCloseHomeDialog = () => {
    setHomeDialogOpen(false);
  };

  const handleSaveHomeLocation = async () => {
    await updateUser({ home_lat: homeLat, home_lng: homeLng });
    handleCloseHomeDialog();
  };

  const handleFetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setHomeLat(position.coords.latitude.toString());
          setHomeLng(position.coords.longitude.toString());
        },
        (error) => {
          console.error("Error getting location: ", error);
          alert("No se pudo obtener la ubicación. Asegúrate de haber concedido los permisos.");
        }
      );
    } else {
      alert("La geolocalización no es soportada por este navegador.");
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  const drawerContent = (
    <>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ color: 'primary.main' }}>
          Gestion DA
        </Typography>
      </Toolbar>
      <Box sx={{ 
  overflow: 'auto', 
  display: 'flex', 
  flexDirection: 'column', 
  height: '100%',
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
}}>
        <List>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={isActive ? {
                    backgroundColor: 'rgba(255, 87, 34, 0.1)',
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                    '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                      color: 'primary.main',
                      fontWeight: 'bold',
                    },
                  } : {
                    // Subtle hover effect for non-active items
                    '&:hover': {
                      backgroundColor: 'rgba(255, 87, 34, 0.05)',
                    }
                  }}
                >
                  <ListItemIcon sx={!isActive ? { color: 'grey.500' } : {}}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <List>
          {(profile?.role === 'ADMIN' || (profile?.permissions || []).includes('Mi Domicilio')) && (
            <ListItem disablePadding>
              <ListItemButton onClick={handleOpenHomeDialog}>
                <ListItemIcon>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText primary="Mi Domicilio" />
              </ListItemButton>
            </ListItem>
          )}
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Cerrar Sesión" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </>
  );

  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    
    // Personalizar nombre según el rol
    let displayName = 'Usuario';
    if (profile?.role === 'ADMIN') displayName = 'Admin';
    else if (profile?.role === 'RECRUITER') displayName = 'Reclutamiento';
    else if (profile?.role === 'COORDINATOR') displayName = 'Coordinación';
    else if (profile?.role === 'INSPECTOR') displayName = 'Inspección';
    else if (profile?.email) {
      const nameFromEmail = profile.email.split('@')[0];
      displayName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
    }
    
    if (hour < 12) return `¡Buenos días, ${displayName}!`;
    if (hour < 18) return `¡Buenas tardes, ${displayName}!`;
    return `¡Buenas noches, ${displayName}!`;
  };

  const getRequestStatus = (startDate: string) => {
    const date = new Date(startDate);
    if (isPast(date) && !isToday(date)) return { label: 'Vencida', color: 'error' };
    if (isToday(date) || isTomorrow(date)) return { label: 'Vence pronto', color: 'warning' };
    return null;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : 'primary.main',
          color: theme.palette.mode === 'light' ? 'text.primary' : 'white',
          boxShadow: theme.palette.mode === 'light' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Grid container alignItems="center" spacing={2}>
            <Grid item sx={{ mr: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" noWrap component="div" sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  letterSpacing: '-0.5px',
                  lineHeight: 1.1
                }}>
                  {getGreeting()}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.mode === 'light' ? 'text.secondary' : 'rgba(255,255,255,0.7)', 
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  mt: 0.5
                }}>
                  Bienvenido al Sistema
                </Typography>
              </Box>
            </Grid>
            {/* Notification Bell and Date */}
            <Grid item sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}> 
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Paper sx={{ 
                  backgroundColor: theme.palette.mode === 'light' ? 'rgba(255, 87, 34, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'light' ? 'rgba(255, 87, 34, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  px: 2,
                  py: 0.5,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.mode === 'light' ? 'primary.main' : 'white',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    letterSpacing: '0.5px'
                  }}>
                    {currentDate.toUpperCase()}
                  </Typography>
                </Paper>
              </Box>

              <IconButton
                color="inherit"
                aria-label="show notifications"
                onClick={handleNotificationClick}
                aria-describedby={id}
              >
                <Badge badgeContent={unfulfilledRequestsCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleNotificationClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <Box sx={{ p: 2, maxWidth: 300 }}>
                  <Typography variant="h6" gutterBottom>Solicitudes Pendientes</Typography>
                  {unfulfilledRequests.length > 0 ? (
                    <List dense>
                      {unfulfilledRequests
                        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                        .map((req) => {
                          const status = getRequestStatus(req.start_date);
                          return (
                            <ListItemButton key={req.id} onClick={() => {
                              handleNotificationClose();
                              navigate(`/solicitudes?requestId=${req.id}`);
                            }}>
                              <ListItemText
                                primary={`Hotel: ${req.hotelName || 'N/A'} - ${req.role}`}
                                secondary={`Inicio: ${new Date(req.start_date).toLocaleDateString()}`}
                                primaryTypographyProps={{ color: status ? `${status.color}.main` : 'text.primary' }}
                              />
                              {status && <Chip label={status.label} color={status.color} size="small" />}
                            </ListItemButton>
                          );
                        })}
                    </List>
                  ) : (
                    <Typography>No hay solicitudes pendientes.</Typography>
                  )}
                </Box>
              </Popover>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      
      <Drawer
          variant="temporary"
          open={isDrawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: theme.palette.mode === 'light' ? '#1E293B' : 'rgba(48, 48, 48, 0.9)',
              color: theme.palette.mode === 'light' ? '#FFFFFF' : 'inherit',
              backdropFilter: 'blur(10px)',
              borderRight: 'none'
            },
          }}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 900 }}>GESTION DA</Typography>
          </Box>
          <List sx={{ px: 1 }}>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      borderRadius: '8px',
                      backgroundColor: isActive ? 'rgba(255, 87, 34, 0.15)' : 'transparent',
                      color: isActive ? '#FF5722' : (theme.palette.mode === 'light' ? '#94A3B8' : 'grey.500'),
                      '&:hover': {
                        backgroundColor: 'rgba(255, 87, 34, 0.05)',
                        color: '#FF5722'
                      },
                      '& .MuiListItemIcon-root': {
                        color: isActive ? '#FF5722' : (theme.palette.mode === 'light' ? '#94A3B8' : 'grey.500'),
                        minWidth: 40
                      }
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isActive ? 700 : 500 }} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
          <Box sx={{ flexGrow: 1 }} />
          <List sx={{ px: 1, pb: 2 }}>
            {(profile?.role === 'ADMIN' || (profile?.permissions || []).includes('Mi Domicilio')) && (
              <ListItem disablePadding>
                <ListItemButton onClick={handleOpenHomeDialog} sx={{ borderRadius: '8px', color: theme.palette.mode === 'light' ? '#94A3B8' : 'inherit' }}>
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><HomeIcon /></ListItemIcon>
                  <ListItemText primary="Mi Domicilio" primaryTypographyProps={{ fontSize: '0.9rem' }} />
                </ListItemButton>
              </ListItem>
            )}
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout} sx={{ borderRadius: '8px', color: theme.palette.mode === 'light' ? '#94A3B8' : 'inherit' }}>
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><LogoutIcon /></ListItemIcon>
                <ListItemText primary="Cerrar Sesión" primaryTypographyProps={{ fontSize: '0.9rem' }} />
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, pt: 1 }}>
        <Toolbar />
        <Outlet />
      </Box>

      {/* Home Location Dialog */}
      <Dialog open={homeDialogOpen} onClose={handleCloseHomeDialog}>
        <DialogTitle>Establecer Ubicación de Domicilio</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="latitude"
            label="Latitud"
            type="text"
            fullWidth
            variant="standard"
            value={homeLat}
            onChange={(e) => setHomeLat(e.target.value)}
          />
          <TextField
            margin="dense"
            id="longitude"
            label="Longitud"
            type="text"
            fullWidth
            variant="standard"
            value={homeLng}
            onChange={(e) => setHomeLng(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHomeDialog}>Cancelar</Button>
          <Button onClick={handleFetchLocation}>Obtener mi Ubicación</Button>
          <Button onClick={handleSaveHomeLocation}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
