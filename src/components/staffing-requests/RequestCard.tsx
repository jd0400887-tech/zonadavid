
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, Typography, Box, Chip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import type { StaffingRequest } from '../../types';

interface RequestCardProps {
  request: StaffingRequest;
  onEdit: () => void;
  onArchive?: () => void; // Optional archive function
}

export default function RequestCard({ request, onEdit, onArchive }: RequestCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: request.id,
    data: {
      request,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform ? { ...transform, scaleX: 1.03, scaleY: 1.03 } : null),
    transition,
    opacity: isDragging ? 0.9 : 1,
    boxShadow: isDragging ? '0 0 15px #FF5722, 0 0 25px #FF5722' : '0 0 2px #FF5722',
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      sx={{
        mb: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        border: '1px solid #FF5722',
        borderRadius: '8px',
        color: '#FFFFFF', // Set default text color to white for the card
        boxShadow: '0 0 2px #FF5722',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
              {request.role}
            </Typography>
            <Typography variant="body2" sx={{ color: '#E0E0E0' }} gutterBottom>
              {request.hotelName}
            </Typography>
          </Box>
          <Box>
            {onArchive && (
              <IconButton onClick={onArchive} size="small" sx={{ color: '#FFFFFF' }}>
                <ArchiveIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton onClick={onEdit} size="small" sx={{ color: '#FFFFFF' }}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton {...listeners} size="small" sx={{ color: '#FFFFFF', cursor: 'grab' }}>
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="caption" sx={{ color: '#E0E0E0' }}>{new Date(request.start_date).toLocaleDateString()}</Typography>
          <Chip 
            label={`${request.num_of_people} persona(s)`} 
            size="small" 
            sx={{ color: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
