import { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, Typography, Box, Chip, IconButton, LinearProgress, Tooltip, Divider, Stack, useTheme } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useHotels } from '../../hooks/useHotels';
import type { StaffingRequest } from '../../types';

interface RequestCardProps {
  request: StaffingRequest;
  onEdit: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export default function RequestCard({ request, onEdit, onArchive, onDelete }: RequestCardProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: request.id,
    data: { request },
  });

  const { hotels } = useHotels();

  const hotelInfo = useMemo(() => {
    return hotels.find(h => h.id === request.hotel_id);
  }, [hotels, request.hotel_id]);

  // Lógica de Semáforo de 72 Horas
  const timeStats = useMemo(() => {
    const createdAt = new Date(request.created_at);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
    const limit = 72;
    const progress = Math.min((diffInHours / limit) * 100, 100);
    
    let color: 'success' | 'warning' | 'error' = 'success';
    let borderColor = '#4caf50'; // Verde por defecto

    if (diffInHours >= 48) {
      color = 'error';
      borderColor = '#f44336'; // Rojo si > 48h
    } else if (diffInHours >= 24) {
      color = 'warning';
      borderColor = '#ff9800'; // Naranja si > 24h
    }

    const isOverdue = diffInHours > limit;
    const remainingHours = Math.max(limit - diffInHours, 0);

    return { diffInHours, progress, color, borderColor, isOverdue, remainingHours };
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
        backgroundColor: isLight ? '#FFFFFF' : 'rgba(30, 30, 30, 0.6)',
        backdropFilter: isLight ? 'none' : 'blur(10px)',
        border: 'none',
        borderLeft: `4px solid ${timeStats.borderColor}`, // Borde dinámico según urgencia
        borderRadius: '12px',
        color: isLight ? '#0F172A' : '#FFFFFF',
        transition: 'all 0.2s ease-in-out',
        boxShadow: isLight 
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
          : `0 0 5px ${timeStats.borderColor}`,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isLight 
            ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' 
            : `0 0 15px ${timeStats.borderColor}`,
          backgroundColor: isLight ? '#FFFFFF' : 'rgba(40, 40, 40, 0.8)',
        }
      }}
    >
      <CardContent sx={{ p: '16px !important' }}>
        {/* CABECERA: ROL Y ACCIONES */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ maxWidth: onDelete ? '65%' : '80%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2, color: 'primary.main', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                {request.role}
              </Typography>
              {hotelInfo?.zone && (
                <Chip 
                  label={hotelInfo.zone.toUpperCase()} 
                  size="small" 
                  sx={{ 
                    height: 16, 
                    fontSize: '0.6rem', 
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: isLight ? 'text.secondary' : 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }} 
                />
              )}
            </Box>
            <Typography variant="body2" sx={{ color: isLight ? '#475569' : '#bdbdbd', fontWeight: 600, mt: 0.5, fontSize: '0.8rem' }}>
              {request.hotelName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
            <Tooltip title="Editar">
              <IconButton onClick={(e) => { e.stopPropagation(); onEdit(); }} size="small" sx={{ color: isLight ? '#64748B' : 'rgba(255,255,255,0.5)', '&:hover': { color: '#FF5722', backgroundColor: 'rgba(255, 87, 34, 0.1)' } }}>
                <EditIcon sx={{ fontSize: '1.1rem' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Archivar">
              <IconButton onClick={(e) => { e.stopPropagation(); onArchive?.(); }} size="small" sx={{ color: isLight ? '#64748B' : 'rgba(255,255,255,0.5)', '&:hover': { color: '#FF5722', backgroundColor: 'rgba(255, 87, 34, 0.1)' } }}>
                <ArchiveIcon sx={{ fontSize: '1.1rem' }} />
              </IconButton>
            </Tooltip>
            {onDelete && (
              <Tooltip title="Eliminar">
                <IconButton onClick={(e) => { e.stopPropagation(); onDelete(); }} size="small" sx={{ color: isLight ? '#94A3B8' : 'rgba(255,255,255,0.3)', '&:hover': { color: '#f44336', backgroundColor: 'rgba(244, 67, 54, 0.1)' } }}>
                  <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* MEDIO: SEMÁFORO DE TIEMPO */}
        {!['Completada', 'Cancelada por Hotel', 'Vencida'].includes(request.status) && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: timeStats.color === 'error' ? '#f44336' : (isLight ? 'text.secondary' : '#E0E0E0'), fontWeight: 'bold', fontSize: '0.7rem' }}>
                <AccessTimeIcon sx={{ fontSize: 12 }} />
                {timeStats.isOverdue ? `RETRASO: ${timeStats.diffInHours - 72}h` : `${timeStats.remainingHours}h restantes`}
              </Typography>
              <Typography variant="caption" sx={{ color: isLight ? 'text.disabled' : 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>Meta 72h</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={timeStats.progress} 
              color={timeStats.color}
              sx={{ height: 4, borderRadius: 2, backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}
            />
          </Box>
        )}

        <Divider sx={{ my: 1.5, borderColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }} />

        {/* PIE: INDICADORES RÁPIDOS */}
        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
          {/* Fecha */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarMonthIcon sx={{ fontSize: 14, color: isLight ? 'text.disabled' : 'rgba(255,255,255,0.4)' }} />
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>{formattedDate}</Typography>
          </Box>

          {/* Progreso de Vacantes */}
          <Tooltip title={`${request.candidate_count} candidatos asignados de ${request.num_of_people} requeridos`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', px: 1, py: 0.2, borderRadius: '4px' }}>
              <PeopleIcon sx={{ fontSize: 14, color: request.candidate_count >= request.num_of_people ? '#4caf50' : (isLight ? '#1976d2' : '#90caf9') }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: request.candidate_count >= request.num_of_people ? '#4caf50' : (isLight ? '#1976d2' : '#90caf9'), fontSize: '0.7rem' }}>
                {request.candidate_count} / {request.num_of_people}
              </Typography>
            </Box>
          </Tooltip>

          {/* Tipo */}
          <Chip 
            label={request.request_type === 'temporal' ? 'TEMP' : 'PERM'} 
            size="small"
            sx={{ 
              height: '16px', 
              fontSize: '0.6rem', 
              fontWeight: 900,
              backgroundColor: request.request_type === 'temporal' ? (isLight ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.2)') : (isLight ? 'rgba(156, 39, 176, 0.1)' : 'rgba(156, 39, 176, 0.2)'),
              color: request.request_type === 'temporal' ? '#1976d2' : (isLight ? '#9c27b0' : '#ce93d8'),
              border: isLight ? 'none' : '1px solid currentColor'
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
