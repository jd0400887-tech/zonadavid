import { useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box, Chip, List, ListItem, ListItemText, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
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
    <Box>
      {groupedData.map(({ hotel, count }) => {
        if (!hotel) return null;

        const recordsForHotel = allRecords
          .filter(rec => rec.hotelId === hotel.id)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return (
          <Accordion key={hotel.id} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                <Typography variant="h6">{hotel.name}</Typography>
                <Chip label={`${count} visita(s)`} color="primary" />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {recordsForHotel.map(record => (
                  <ListItem 
                    key={record.id}
                    secondaryAction={
                      <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteRequest(record.id)}>
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText 
                      primary={new Date(record.timestamp).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      secondary={new Date(record.timestamp).toLocaleTimeString('es-ES')}
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