import { useState, useEffect } from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, AppBar, IconButton, Grid, Badge, Popover, Chip, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';
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
import HomeIcon from '@mui/icons-material/Home'; // Icon for Home Location
import { useAuth } from '../hooks/useAuth';
import { useDashboardStats } from '../hooks/useDashboardStats';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Empleados', icon: <PeopleIcon />, path: '/empleados' },
  { text: 'Hoteles', icon: <ApartmentIcon />, path: '/hoteles' },
  { text: 'Solicitudes', icon: <AssignmentIcon />, path: '/solicitudes' },
  { text: 'Aplicaciones', icon: <PlaylistAddCheckIcon />, path: '/aplicaciones' },
  { text: 'Reporte Asistencia', icon: <AssessmentIcon />, path: '/reporte-asistencia' },
  { text: 'Revisión de Nómina', icon: <FactCheckIcon />, path: '/revision-nomina' },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { signOut, session, updateUser } = useAuth(); // Get session and updateUser
  const { unfulfilledRequestsCount, unfulfilledRequests } = useDashboardStats();

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
    await signOut();
    navigate('/login');
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
      <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
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
          <ListItem disablePadding>
            <ListItemButton onClick={handleOpenHomeDialog}>
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Mi Domicilio" />
            </ListItemButton>
          </ListItem>
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
    if (hour < 12) return "Buenos días, David";
    if (hour < 18) return "Buenas tardes, David";
    return "Buenas noches, David";
  };

  const getRequestStatus = (startDate: string) => {
    const date = new Date(startDate);
    if (isPast(date) && !isToday(date)) return { label: 'Vencida', color: 'error' };
    if (isToday(date) || isTomorrow(date)) return { label: 'Vence pronto', color: 'warning' };
    return null;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
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
            <Grid item sx={{ mr: 3 }}>
              <Typography variant="h6" noWrap component="div" sx={{
                color: 'primary.main',
                textShadow: '0 0 4px #FF5722, 0 0 8px #FF5722'
              }}>
                {getGreeting()}
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="body1" noWrap sx={{ display: { xs: 'none', sm: 'block' } }}>
                {currentDate}
              </Typography>
            </Grid>
            {/* Notification Bell */}
            <Grid item sx={{ ml: 'auto' }}> {/* ml: 'auto' pushes it to the right */}
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
            backgroundColor: 'rgba(48, 48, 48, 0.5)', // More transparent background
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)', // For Safari
            borderRight: '1px solid rgba(255, 255, 255, 0.12)' // A subtle border to define the edge
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1 }}>
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
