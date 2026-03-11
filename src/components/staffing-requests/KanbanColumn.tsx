
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Box, Typography, Paper, useTheme } from '@mui/material';
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
  onDeleteRequest?: (id: number) => void;
}

export default function KanbanColumn({ id, title, requests, bgColor, textColor = '#FFFFFF', onEditRequest, onArchiveRequest, onDeleteRequest }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  return (
    <Paper sx={{
      height: '100%',
      p: 1.5,
      borderRadius: '16px',
      backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 0, 0, 0.2)', // Slate 100 in light mode
      backdropFilter: isLight ? 'none' : 'blur(10px)',
      border: '1px solid',
      borderColor: isOver ? '#00BCD4' : (isLight ? '#E2E8F0' : 'rgba(255, 87, 34, 0.3)'),
      boxShadow: isOver 
        ? '0 0 8px #00BCD4' 
        : (isLight ? 'none' : '0 0 5px #FF5722'),
      transition: 'all 0.2s ease-in-out',
      minWidth: '280px'
    }}>
      <Typography variant="subtitle1" gutterBottom sx={{
        textTransform: 'uppercase',
        color: isLight ? '#475569' : 'primary.main',
        fontWeight: 800,
        fontSize: '0.75rem',
        letterSpacing: '1px',
        mb: 2,
        px: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {title} 
        <Box component="span" sx={{ 
          backgroundColor: isLight ? '#CBD5E1' : 'rgba(255,255,255,0.1)', 
          px: 1, 
          py: 0.2, 
          borderRadius: '10px', 
          fontSize: '0.7rem',
          color: isLight ? '#1E293B' : '#FFF'
        }}>
          {requests.length}
        </Box>
      </Typography>
      <SortableContext id={id} items={requests} strategy={verticalListSortingStrategy}>
        <Box ref={setNodeRef} sx={{ 
          minHeight: '200px', 
          maxHeight: 'calc(100vh - 300px)',
          overflowY: 'auto', 
          p: 0.5,
          '&::-webkit-scrollbar': {
            width: '5px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: isLight ? '#CBD5E1' : '#FF5722',
            borderRadius: '10px',
          },
        }}>
          {requests.map(request => (
            <RequestCard 
              key={request.id} 
              request={request} 
              onEdit={() => onEditRequest(request)} 
              onArchive={['Completada', 'Completada Parcialmente', 'Candidato No Presentado', 'Cancelada por Hotel', 'Vencida'].includes(id) ? () => onArchiveRequest(request.id) : undefined} 
              onDelete={onDeleteRequest ? () => onDeleteRequest(request.id) : undefined}
            />
          ))}
        </Box>
      </SortableContext>
    </Paper>
  );
}
