import { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, IconButton, Stack, Toolbar, TextField, InputAdornment, Link, Card, CardMedia, CardContent, CardActions, FormControlLabel, Switch, Grid } from '@mui/material';
import { Masonry } from '@mui/lab';
import { Link as RouterLink } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import SearchIcon from '@mui/icons-material/Search';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';

import { useHotels } from '../hooks/useHotels';
import { useAuth } from '../hooks/useAuth';
import type { Hotel } from '../types';
import FormModal from '../components/form/FormModal';
import HotelForm from '../components/hotels/HotelForm';
import EmptyState from '../components/EmptyState';
import { exportHotelsToExcel } from '../utils/exportUtils';
import BulkImportButton from '../components/common/BulkImportButton';

export default function HotelsPage() {
  const { hotels, addHotel, updateHotel, deleteHotel, uploadHotelImage } = useHotels();
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showHotelsWithEmployees, setShowHotelsWithEmployees] = useState(() => {
    const saved = localStorage.getItem('showHotelsWithEmployeesFilter');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentHotel, setCurrentHotel] = useState<Partial<Hotel>>({});
  
  useEffect(() => {
    localStorage.setItem('showHotelsWithEmployeesFilter', JSON.stringify(showHotelsWithEmployees));
  }, [showHotelsWithEmployees]);

  const filteredHotels = hotels.filter(hotel => {
    // Si es INSPECTOR, forzamos su zona. Si no tiene zona (fallback), le damos una por defecto para no ver todo.
    if (profile?.role === 'INSPECTOR') {
      const allowedZone = profile.assigned_zone || 'Centro';
      if (hotel.zone !== allowedZone) return false;
    }
    
    return hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!showHotelsWithEmployees || (hotel.totalEmployees && hotel.totalEmployees > 0))
  });

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
    <Box component="main" sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Gestión de Hoteles</Typography>
        <Stack direction="row" spacing={2}>
          <BulkImportButton<Partial<Hotel>>
            buttonText="Importar Hoteles (CSV)"
            requiredHeaders={['name', 'city', 'address']}
            onDataParsed={handleHotelImport}
          />
          <Button variant="outlined" startIcon={<SaveAltIcon />} onClick={() => exportHotelsToExcel(filteredHotels)}>
            Exportar a Excel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenAddModal}
            sx={{
              transition: 'box-shadow 0.3s ease-in-out',
              '&:hover': { boxShadow: `0 0 8px 2px #FF5722` }
            }}
          >
            Añadir Hotel
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Buscar hotel por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
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
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleIcon sx={{ mr: 0.5, fontSize: 20 }} /> <Typography variant="body2">Hoteles con personal</Typography>
            </Box>
          }
          sx={{ flexShrink: 0, ml: 1 }}
        />
      </Paper>

      {filteredHotels.length > 0 ? (
        <Grid container spacing={3}>
          {filteredHotels.map((hotel) => (
            <Grid item key={hotel.id} xs={12} sm={6} md={4} lg={3}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderLeft: '4px solid #FF5722',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                }
              }}>
                {hotel.imageUrl ? (
                  <CardMedia component="img" height="160" image={hotel.imageUrl} alt={hotel.name} />
                ) : (
                  <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'background.default' }}>
                    <ApartmentIcon sx={{ fontSize: 60, color: 'grey.500' }} />
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 800, mb: 1 }}>
                    <Link component={RouterLink} to={`/hotel/${hotel.id}`} sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                      {hotel.name}
                    </Link>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <b>Ciudad:</b> {hotel.city}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PeopleIcon sx={{ fontSize: 16 }} /> 
                    <b>Personal:</b> {hotel.activeEmployees} activos / {hotel.totalEmployees} total
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', p: 1, backgroundColor: 'rgba(0,0,0,0.02)' }}>
                  <IconButton size="small" onClick={() => handleOpenEditModal(hotel)} sx={{ color: 'primary.main' }}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => handleDelete(hotel.id)} sx={{ color: 'error.light' }}><DeleteIcon fontSize="small" /></IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ mt: 2 }}>
          <EmptyState icon={<ApartmentIcon />} title="No se encontraron hoteles" subtitle="Intenta con otro término de búsqueda o añade un nuevo hotel." />
        </Paper>
      )}

      <FormModal open={isModalOpen} onClose={handleCloseModal} onSave={handleSave} title={currentHotel.id ? "Editar Hotel" : "Añadir Nuevo Hotel"}>
        <HotelForm hotelData={currentHotel} onFormChange={handleFormChange} uploadHotelImage={uploadHotelImage} isEditMode={!!currentHotel.id} />
      </FormModal>
    </Box>
  );
}