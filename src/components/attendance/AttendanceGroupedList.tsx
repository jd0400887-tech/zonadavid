import { Accordion, AccordionSummary, AccordionDetails, Typography, Box, Chip, List, ListItem, ListItemText } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { AttendanceRecord, Hotel } from '../../types';

interface GroupedVisits {
  hotel: Hotel | undefined;
  count: number;
}

interface AttendanceGroupedListProps {
  groupedData: GroupedVisits[];
  allRecords: AttendanceRecord[];
}

export default function AttendanceGroupedList({ groupedData, allRecords }: AttendanceGroupedListProps) {
  return (
    <Box>
      {groupedData.map(({ hotel, count }) => {
        if (!hotel) return null;

        const recordsForHotel = allRecords
          .filter(rec => rec.hotelId === hotel.id)
          .sort((a, b) => b.timestamp - a.timestamp);

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
                  <ListItem key={record.id}>
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
    </Box>
  );
}