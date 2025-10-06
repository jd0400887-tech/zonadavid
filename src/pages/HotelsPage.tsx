import { useState } from 'react';
import { Box, Typography, Button, Paper, IconButton, Stack, Toolbar, TextField, InputAdornment, Link, Card, CardMedia, CardContent, CardActions } from '@mui/material';
import { Masonry } from '@mui/lab';
import { Link as RouterLink } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import SearchIcon from '@mui/icons-material/Search';
import ApartmentIcon from '@mui/icons-material/Apartment';

import { useHotels } from '../hooks/useHotels';
import type { Hotel } from '../types';
import FormModal from '../components/form/FormModal';
import HotelForm from '../components/hotels/HotelForm';
import EmptyState from '../components/EmptyState';
import { exportHotelsToExcel } from '../utils/exportUtils';
import BulkImportButton from '../components/common/BulkImportButton';

export default function HotelsPage() {
  const { hotels, addHotel, updateHotel, deleteHotel, uploadHotelImage } = useHotels();
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentHotel, setCurrentHotel] = useState<Partial<Hotel>>({});

  const filteredHotels = hotels.filter(hotel =>
    hotel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      // Find the full hotel object from the current hotels state to get the latest imageUrl
      const existingHotel = hotels.find(h => h.id === currentHotel.id);
      const hotelToUpdate: Partial<Hotel> = { ...currentHotel };

      // If imageUrl is missing in currentHotel but present in existingHotel, add it
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

  const modalTitle = currentHotel.id ? "Editar Hotel" : "Añadir Nuevo Hotel";

  const handleHotelImport = async (parsedData: Partial<Hotel>[]) => {
    let successCount = 0;
    let errorCount = 0;

    for (const item of parsedData) {
      if (item.name && item.city && item.address) {
        const hotelData = { ...item };
        if ('imagenUrl' in hotelData) {
          hotelData.imageUrl = (hotelData as any).imagenUrl;
          delete (hotelData as any).imagenUrl;
        }
        await addHotel(hotelData);
        successCount++;
      } else {
        errorCount++;
      }
    }

    return { successCount, errorCount };
  };

  return (
    <Box>
      <Toolbar />
      <Box component="main" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
                '&:hover': {
                  boxShadow: `0 0 8px 2px #FF5722`,
                }
              }}
            >
              Añadir Hotel
            </Button>
          </Stack>
        </Box>

        <Paper sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
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
        </Paper>

        {filteredHotels.length > 0 ? (
          <Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} spacing={3}>
            {filteredHotels.map((hotel) => (
              <Card key={hotel.id}>
                {hotel.imageUrl ? (
                  <CardMedia
                    component="img"
                    height="140"
                    image={hotel.imageUrl}
                    alt={hotel.name}
                  />
                ) : (
                  <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'grey.800' }}>
                    <ApartmentIcon sx={{ fontSize: 60, color: 'grey.500' }} />
                  </Box>
                )}
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    <Link component={RouterLink} to={`/hotel/${hotel.id}`} sx={{ color: 'text.primary', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                      {hotel.name}
                    </Link>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {hotel.city} - {hotel.address}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <IconButton aria-label="edit" onClick={() => handleOpenEditModal(hotel)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton aria-label="delete" onClick={() => handleDelete(hotel.id)}>
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            ))}
          </Masonry>
        ) : (
          <Paper sx={{ mt: 2 }}>
            <EmptyState 
              icon={<ApartmentIcon />}
              title="No se encontraron hoteles"
              subtitle="Intenta con otro término de búsqueda o añade un nuevo hotel."
            />
          </Paper>
        )}

        <FormModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          title={modalTitle}
        >
          <HotelForm
            hotelData={currentHotel}
            onFormChange={handleFormChange}
            uploadHotelImage={uploadHotelImage}
            isEditMode={!!currentHotel.id}
          />
        </FormModal>
      </Box>
    </Box>
  );
}