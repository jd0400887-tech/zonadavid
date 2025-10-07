import { useState, useMemo } from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, AppBar, IconButton, Grid } from '@mui/material';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { startOfDay, endOfDay } from 'date-fns';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ApartmentIcon from '@mui/icons-material/Apartment';
import MenuIcon from '@mui/icons-material/Menu';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../hooks/useAuth';
import { useHotels } from '../hooks/useHotels';
import { useAttendance } from '../hooks/useAttendance';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Empleados', icon: <PeopleIcon />, path: '/empleados' },
  { text: 'Hoteles', icon: <ApartmentIcon />, path: '/hoteles' },
  { text: 'Reporte Asistencia', icon: <AssessmentIcon />, path: '/reporte-asistencia' },
  { text: 'Revisión de Nómina', icon: <FactCheckIcon />, path: '/revision-nomina' },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { signOut } = useAuth();
  const { hotels } = useHotels();
  const { allRecords } = useAttendance({ start: null, end: null });

  const handleDrawerToggle = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsDrawerOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const hotelsVisitedToday = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const todaysRecords = allRecords.filter(r => 
      r.timestamp >= todayStart.getTime() && r.timestamp <= todayEnd.getTime()
    );
    const visitedHotelIds = new Set(todaysRecords.map(r => r.hotelId));
    return visitedHotelIds.size;
  }, [allRecords]);

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

  return (
    <Box sx={{ display: 'flex' }}>
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
            <Grid item sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', ml: 'auto' }}>
               <ApartmentIcon sx={{ mr: 1 }} />
               <Typography variant="body1">
                {`${hotelsVisitedToday} / ${hotels.length} Hoteles Visitados Hoy`}
               </Typography>
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
    </Box>
  );
}