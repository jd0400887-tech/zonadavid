import { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Button, Paper, IconButton, Stack, TextField, 
  InputAdornment, Link, Card, CardMedia, CardContent, CardActions, 
  FormControlLabel, Switch, Grid, Tooltip, Divider, useTheme, Chip
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// Iconos
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import SearchIcon from '@mui/icons-material/Search';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import AddIcon from '@mui/icons-material/Add';

import { useHotels } from '../hooks/useHotels';
import { useAuth } from '../hooks/useAuth';
import type { Hotel } from '../types';
import FormModal from '../components/form/FormModal';
import HotelForm from '../components/hotels/HotelForm';
import EmptyState from '../components/EmptyState';
import { exportHotelsToExcel } from '../utils/exportUtils';
import BulkImportButton from '../components/common/BulkImportButton';

export default function HotelsPage() {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const { hotels, addHotel, updateHotel, deleteHotel, uploadHotelImage } = useHotels();
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  const isAdmin = profile?.role === 'ADMIN';
  const isInspector = profile?.role === 'INSPECTOR';

  const [showHotelsWithEmployees, setShowHotelsWithEmployees] = useState(() => {
    const saved = localStorage.getItem('showHotelsWithEmployeesFilter');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentHotel, setCurrentHotel] = useState<Partial<Hotel>>({});
  
  useEffect(() => {
    localStorage.setItem('showHotelsWithEmployeesFilter', JSON.stringify(showHotelsWithEmployees));
  }, [showHotelsWithEmployees]);

  const filteredHotels = useMemo(() => {
    return hotels.filter(hotel => {
      // Si es INSPECTOR, forzamos su zona.
      if (isInspector) {
        const allowedZone = profile?.assigned_zone || 'Centro';
        if (hotel.zone !== allowedZone) return false;
      }
      
      const matchesSearch = hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           hotel.city.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesEmployeeFilter = !showHotelsWithEmployees || (hotel.totalEmployees && hotel.totalEmployees > 0);
      
      return matchesSearch && matchesEmployeeFilter;
    });
  }, [hotels, searchQuery, showHotelsWithEmployees, isInspector, profile]);

  const handleOpenAddModal = () => {
    setCurrentHotel({ imageUrl: null });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (hotel: Hotel) => {
    setCurrentHotel(hotel);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentHotel({});
  };

  const handleFormChange = (field: keyof Hotel, value: any) => {
    setCurrentHotel(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (currentHotel.id) {
      const existingHotel = hotels.find(h => h.id === currentHotel.id);
      const hotelToUpdate: Partial<Hotel> = { ...currentHotel };
      if (!hotelToUpdate.imageUrl && existingHotel?.imageUrl) {
        hotelToUpdate.imageUrl = existingHotel.imageUrl;
      }
      updateHotel(hotelToUpdate);
    } else {
      addHotel(currentHotel);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este hotel?')) {
      deleteHotel(id);
    }
  };

  const handleHotelImport = async (parsedData: Partial<Hotel>[]) => {
    let successCount = 0;
    let errorCount = 0;
    for (const item of parsedData) {
      if (item.name && item.city && item.address) {
        const hotelData = { ...item };
        await addHotel(hotelData);
        successCount++;
      } else {
        errorCount++;
      }
    }
    return { successCount, errorCount };
  };

  return (
    <Box component="main" sx={{ p: 2 }}>
      {/* ENCABEZADO MODERNO */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3, 
          background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
          border: '1px solid rgba(255, 87, 34, 0.1)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: 2 
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            backgroundColor: 'primary.main', 
            p: 1, 
            borderRadius: 2, 
            display: 'flex', 
            boxShadow: '0 4px 12px rgba(255, 87, 34, 0.3)' 
          }}>
            <ApartmentIcon sx={{ color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>
              Hoteles
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
              {isInspector ? `Gestión de Zona: ${profile?.assigned_zone || 'Centro'}` : 'Control Global de Ubicaciones'}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button 
            variant="outlined" 
            startIcon={<SaveAltIcon />} 
            onClick={() => exportHotelsToExcel(filteredHotels)}
            sx={{ borderRadius: 2, fontWeight: 'bold' }}
          >
            Excel
          </Button>
          
          {isAdmin && (
            <>
              <BulkImportButton<Partial<Hotel>>
                buttonText="Importar CSV"
                requiredHeaders={['name', 'city', 'address']}
                onDataParsed={handleHotelImport}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAddModal}
                sx={{
                  borderRadius: 2, px: 3, fontWeight: 'bold',
                  boxShadow: '0 4px 14px 0 rgba(255, 87, 34, 0.39)',
                  background: 'linear-gradient(45deg, #FF5722 30%, #FF8A65 90%)',
                }}
              >
                Añadir Hotel
              </Button>
            </>
          )}
        </Stack>
      </Paper>

      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          mb: 4, 
          borderRadius: 3, 
          backgroundColor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          flexWrap: 'wrap'
        }}
      >
        <TextField
          sx={{ flexGrow: 1, minWidth: '300px' }}
          variant="outlined"
          size="small"
          placeholder="Buscar por nombre o ciudad..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon color="primary" fontSize="small" /></InputAdornment>,
            sx: { borderRadius: 2 }
          }}
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Divider orientation="vertical" flexItem sx={{ height: 24, mx: 1, opacity: 0.1 }} />
          <FormControlLabel
            control={
              <Switch
                checked={showHotelsWithEmployees}
                onChange={(e) => setShowHotelsWithEmployees(e.target.checked)}
                size="small"
                color="primary"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PeopleIcon fontSize="small" color="primary" /> Con Personal
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </Box>
      </Paper>

      {filteredHotels.length > 0 ? (
        <Grid container spacing={3}>
          {filteredHotels.map((hotel) => (
            <Grid item key={hotel.id} xs={12} sm={6} md={4} lg={3}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 4,
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: `0 12px 30px -10px ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.5)'}`,
                  borderColor: 'primary.main',
                }
              }}>
                <Box sx={{ position: 'relative' }}>
                  {hotel.imageUrl ? (
                    <CardMedia component="img" height="180" image={hotel.imageUrl} alt={hotel.name} />
                  ) : (
                    <Box sx={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      <ApartmentIcon sx={{ fontSize: 60, color: 'rgba(255,255,255,0.1)' }} />
                    </Box>
                  )}
                  <Chip 
                    label={hotel.zone} 
                    size="small" 
                    sx={{ 
                      position: 'absolute', top: 12, right: 12, 
                      fontWeight: 'bold', fontSize: '0.6rem',
                      backdropFilter: 'blur(10px)',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      color: 'white', border: '1px solid rgba(255,255,255,0.2)'
                    }} 
                  />
                </Box>

                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, lineHeight: 1.2 }}>
                    <Link component={RouterLink} to={`/hotel/${hotel.id}`} sx={{ color: 'text.primary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                      {hotel.name}
                    </Link>
                  </Typography>
                  
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationCityIcon sx={{ fontSize: 16, color: 'primary.main', opacity: 0.7 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {hotel.city}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon sx={{ fontSize: 16, color: 'primary.main', opacity: 0.7 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {hotel.activeEmployees} <Typography component="span" variant="caption" color="text.secondary">/ {hotel.totalEmployees} Personal</Typography>
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>

                <Divider sx={{ opacity: 0.05 }} />
                
                <CardActions sx={{ justifyContent: 'space-between', p: 1.5, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <Button 
                    size="small" 
                    component={RouterLink} 
                    to={`/hotel/${hotel.id}`}
                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                  >
                    Ver Detalles
                  </Button>
                  
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Editar Hotel">
                      <IconButton size="small" onClick={() => handleOpenEditModal(hotel)} sx={{ color: 'primary.main', backgroundColor: 'rgba(255, 87, 34, 0.05)' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    {isAdmin && (
                      <Tooltip title="Eliminar Hotel">
                        <IconButton size="small" onClick={() => handleDelete(hotel.id)} sx={{ color: 'error.main', backgroundColor: 'rgba(244, 67, 54, 0.05)' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ mt: 2, borderRadius: 4 }}>
          <EmptyState icon={<ApartmentIcon />} title="No se encontraron hoteles" subtitle={isInspector ? `No tienes hoteles registrados en la zona ${profile?.assigned_zone}` : "Intenta con otro término de búsqueda."} />
        </Paper>
      )}

      <FormModal open={isModalOpen} onClose={handleCloseModal} onSave={handleSave} title={currentHotel.id ? "Editar Hotel" : "Añadir Nuevo Hotel"}>
        <HotelForm hotelData={currentHotel} onFormChange={handleFormChange} uploadHotelImage={uploadHotelImage} isEditMode={!!currentHotel.id} />
      </FormModal>
    </Box>
  );
}
