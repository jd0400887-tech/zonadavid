import { useState } from 'react';
import { 
  Accordion, AccordionSummary, AccordionDetails, Typography, Box, Chip, 
  List, ListItem, ListItemText, IconButton, Avatar, Stack, useTheme, Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import ApartmentIcon from '@mui/icons-material/Apartment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import type { AttendanceRecord, Hotel } from '../../types';
import ConfirmationDialog from '../common/ConfirmationDialog';

interface GroupedVisits {
  hotel: Hotel | undefined;
  count: number;
}

interface AttendanceGroupedListProps {
  groupedData: GroupedVisits[];
  allRecords: AttendanceRecord[];
  deleteRecord: (id: string) => void;
}

export default function AttendanceGroupedList({ groupedData, allRecords, deleteRecord }: AttendanceGroupedListProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const handleDeleteRequest = (id: string) => {
    setRecordToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (recordToDelete) {
      deleteRecord(recordToDelete);
    }
    setIsConfirmOpen(false);
    setRecordToDelete(null);
  };

  return (
    <Box sx={{ mt: 2 }}>
      {groupedData.map(({ hotel, count }) => {
        if (!hotel) return null;

        const recordsForHotel = allRecords
          .filter(rec => rec.hotelId === hotel.id)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return (
          <Accordion 
            key={hotel.id} 
            elevation={0}
            sx={{ 
              mb: 2, 
              borderRadius: '12px !important',
              border: '1px solid rgba(255,255,255,0.05)',
              backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.02)',
              '&:before': { display: 'none' },
              overflow: 'hidden',
              transition: 'all 0.2s',
              '&:hover': { borderColor: 'primary.main', backgroundColor: 'rgba(255, 87, 34, 0.02)' }
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon color="primary" />}
              sx={{ px: 2, py: 1 }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 1 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, boxShadow: '0 4px 10px rgba(255, 87, 34, 0.2)' }}>
                    <ApartmentIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.2 }}>{hotel.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{hotel.city}</Typography>
                  </Box>
                </Stack>
                <Chip 
                  label={`${count} ${count === 1 ? 'visita' : 'visitas'}`} 
                  color="primary" 
                  size="small" 
                  sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0, pb: 0 }}>
              <Divider sx={{ opacity: 0.05 }} />
              <List sx={{ py: 0 }}>
                {recordsForHotel.map((record, index) => (
                  <ListItem 
                    key={record.id}
                    divider={index < recordsForHotel.length - 1}
                    sx={{ 
                      py: 2, px: 3,
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.03)' }
                    }}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        onClick={() => handleDeleteRequest(record.id)}
                        sx={{ color: 'error.light', opacity: 0.5, '&:hover': { opacity: 1, backgroundColor: 'rgba(244, 67, 54, 0.1)' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText 
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CalendarTodayIcon sx={{ fontSize: 14, color: 'primary.main', opacity: 0.7 }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {new Date(record.timestamp).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                          <AccessTimeIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary">
                            Registrado a las {new Date(record.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        );
      })}
      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar este registro de visita? Esta acción no se puede deshacer."
      />
    </Box>
  );
}