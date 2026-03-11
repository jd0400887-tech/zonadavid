import { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, Typography, Box, Chip, IconButton, LinearProgress, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import WarningIcon from '@mui/icons-material/Warning';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import type { StaffingRequest } from '../../types';

interface RequestCardProps {
  request: StaffingRequest;
  onEdit: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export default function RequestCard({ request, onEdit, onArchive, onDelete }: RequestCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: request.id,
    data: {
      request,
    },
  });

  // Lógica de Urgencia por Fecha de Inicio
  const isUrgent = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(request.start_date);
    startDate.setHours(0, 0, 0, 0);
    
    const isCompleted = ['Completada', 'Completada Parcialmente', 'Cancelada por Hotel', 'Vencida'].includes(request.status);
    
    return !isCompleted && startDate <= today;
  }, [request.start_date, request.status]);

  // Lógica de Semáforo de 72 Horas
  const timeStats = useMemo(() => {
    const createdAt = new Date(request.created_at);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
    const limit = 72;
    const progress = Math.min((diffInHours / limit) * 100, 100);
    
    let color: 'success' | 'warning' | 'error' = 'success';
    if (diffInHours >= 48) color = 'error';
    else if (diffInHours >= 24) color = 'warning';

    const isOverdue = diffInHours > limit;
    const remainingHours = Math.max(limit - diffInHours, 0);

    return { diffInHours, progress, color, isOverdue, remainingHours };
  }, [request.created_at]);

  const style = {
    transform: CSS.Transform.toString(transform ? { ...transform, scaleX: 1.03, scaleY: 1.03 } : null),
    transition,
    opacity: isDragging ? 0.9 : 1,
    boxShadow: isDragging 
      ? '0 0 15px #FF5722, 0 0 25px #FF5722' 
      : (isUrgent ? '0 0 8px #f44336' : '0 0 2px #FF5722'),
    cursor: 'grab',
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      sx={{
        mb: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        border: isUrgent ? '2px solid #f44336' : '1px solid #FF5722',
        borderRadius: '8px',
        color: '#FFFFFF', // Set default text color to white for the card
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <CardContent>
        {isUrgent && (
          <Chip
            icon={<WarningIcon style={{ color: 'white', fontSize: '14px' }} />}
            label="URGENTE"
            size="small"
            color="error"
            sx={{
              position: 'absolute',
              top: -10,
              right: 10,
              height: '20px',
              fontSize: '0.6rem',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          />
        )}
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
            {onDelete && (
              <IconButton onClick={onDelete} size="small" sx={{ color: '#FFFFFF' }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Semáforo de 72 Horas */}
        {!['Completada', 'Cancelada por Hotel', 'Vencida'].includes(request.status) && (
          <Box sx={{ mt: 1.5, mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: timeStats.color === 'error' ? '#ff5252' : '#E0E0E0' }}>
                <AccessTimeIcon sx={{ fontSize: 14 }} />
                {timeStats.isOverdue ? `Vencida por ${timeStats.diffInHours - 72}h` : `${timeStats.remainingHours}h restantes`}
              </Typography>
              <Typography variant="caption" sx={{ color: '#E0E0E0' }}>
                Meta: 72h
              </Typography>
            </Box>
            <Tooltip title={`Tiempo transcurrido: ${timeStats.diffInHours} horas`}>
              <LinearProgress 
                variant="determinate" 
                value={timeStats.progress} 
                color={timeStats.color}
                sx={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)' }}
              />
            </Tooltip>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="caption" sx={{ color: '#E0E0E0' }}>{new Date(request.start_date).toLocaleDateString()}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {request.candidate_count > 0 && (
              <Chip 
                icon={<PeopleIcon />}
                label={String(request.candidate_count)} 
                size="small" 
                variant="outlined"
                sx={{ color: '#90caf9', borderColor: '#90caf9' }} // Light blue color
              />
            )}
            <Chip 
              label={`${request.num_of_people} persona(s)`} 
              size="small" 
              sx={{ color: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
