import { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, Typography, Box, Chip, IconButton, LinearProgress, Tooltip, Divider, Stack } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssignmentIcon from '@mui/icons-material/Assignment';
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
    data: { request },
  });

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
    transform: CSS.Transform.toString(transform ? { ...transform, scaleX: 1.02, scaleY: 1.02 } : null),
    transition,
    opacity: isDragging ? 0.8 : 1,
    cursor: 'grab',
  };

  const formattedDate = new Date(request.start_date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short'
  });

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      sx={{
        mb: 2,
        backgroundColor: 'rgba(30, 30, 30, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 87, 34, 0.3)',
        borderRadius: '12px',
        color: '#FFFFFF',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: '#FF5722',
          backgroundColor: 'rgba(40, 40, 40, 0.8)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
        }
      }}
    >
      <CardContent sx={{ p: '16px !important' }}>
        {/* CABECERA: ROL Y ACCIONES */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ maxWidth: '70%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2, color: '#FF5722', textTransform: 'uppercase', fontSize: '0.9rem' }}>
              {request.role}
            </Typography>
            <Typography variant="body2" sx={{ color: '#bdbdbd', fontWeight: 500, mt: 0.5 }}>
              {request.hotelName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton onClick={(e) => { e.stopPropagation(); onEdit(); }} size="small" sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#fff' } }}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={(e) => { e.stopPropagation(); onArchive?.(); }} size="small" sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#fff' } }}>
              <ArchiveIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* MEDIO: SEMÁFORO DE TIEMPO */}
        {!['Completada', 'Cancelada por Hotel', 'Vencida'].includes(request.status) && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: timeStats.color === 'error' ? '#ff5252' : '#E0E0E0', fontWeight: 'bold' }}>
                <AccessTimeIcon sx={{ fontSize: 14 }} />
                {timeStats.isOverdue ? `RETRASO: ${timeStats.diffInHours - 72}h` : `${timeStats.remainingHours}h restantes`}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>Meta 72h</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={timeStats.progress} 
              color={timeStats.color}
              sx={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.05)' }}
            />
          </Box>
        )}

        <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.05)' }} />

        {/* PIE: INDICADORES RÁPIDOS */}
        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
          {/* Fecha */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarMonthIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>{formattedDate}</Typography>
          </Box>

          {/* Progreso de Vacantes */}
          <Tooltip title={`${request.candidate_count} candidatos asignados de ${request.num_of_people} requeridos`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, backgroundColor: 'rgba(255,255,255,0.05)', px: 1, py: 0.2, borderRadius: '4px' }}>
              <PeopleIcon sx={{ fontSize: 16, color: request.candidate_count >= request.num_of_people ? '#4caf50' : '#90caf9' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: request.candidate_count >= request.num_of_people ? '#4caf50' : '#90caf9' }}>
                {request.candidate_count} / {request.num_of_people}
              </Typography>
            </Box>
          </Tooltip>

          {/* Tipo */}
          <Chip 
            label={request.request_type === 'temporal' ? 'TEMP' : 'PERM'} 
            size="small"
            sx={{ 
              height: '18px', 
              fontSize: '0.65rem', 
              fontWeight: 900,
              backgroundColor: request.request_type === 'temporal' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(156, 39, 176, 0.2)',
              color: request.request_type === 'temporal' ? '#2196f3' : '#ce93d8',
              border: '1px solid currentColor'
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
