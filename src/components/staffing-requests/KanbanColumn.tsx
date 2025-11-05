
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Box, Typography, Paper } from '@mui/material';
import RequestCard from './RequestCard';
import type { StaffingRequest } from '../../types';

interface KanbanColumnProps {
  id: string;
  title: string;
  requests: StaffingRequest[];
  bgColor?: string;
  textColor?: string;
  onEditRequest: (request: StaffingRequest) => void;
  onArchiveRequest: (id: number) => void;
}

export default function KanbanColumn({ id, title, requests, bgColor, textColor = '#FFFFFF', onEditRequest, onArchiveRequest }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Paper sx={{
      height: '100%',
      p: 1.5,
      borderRadius: '12px',
      backgroundColor: 'rgba(0, 0, 0, 0.2)', // Dark semi-transparent
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: isOver ? '2px solid #00BCD4' : '1px solid #FF5722', // Highlight with a different neon color when hovered
      boxShadow: isOver ? '0 0 8px #00BCD4, 0 0 15px #00BCD4' : '0 0 5px #FF5722, 0 0 10px #FF5722',
      transition: 'all 0.2s ease-in-out',
    }}>
      <Typography variant="h6" gutterBottom sx={{
        textTransform: 'capitalize',
        color: 'primary.main', // Use primary color for brightness
        fontWeight: 'bold',
        p: 1,
        textAlign: 'center', // Centered text
      }}>
        {title} ({requests.length})
      </Typography>
      <SortableContext id={id} items={requests} strategy={verticalListSortingStrategy}>
        <Box ref={setNodeRef} sx={{ minHeight: '200px', overflowY: 'auto', p: 1 }}>
          {requests.map(request => (
            <RequestCard 
              key={request.id} 
              request={request} 
              onEdit={() => onEditRequest(request)} 
              onArchive={['Completada', 'Completada Parcialmente', 'Candidato No Presentado', 'Cancelada por Hotel', 'Vencida'].includes(id) ? () => onArchiveRequest(request.id) : undefined} 
            />
          ))}
        </Box>
      </SortableContext>
    </Paper>
  );
}
