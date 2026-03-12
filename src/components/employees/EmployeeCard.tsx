import { 
  Card, CardContent, Box, Avatar, Typography, Stack, Chip, 
  IconButton, Tooltip, Divider, useTheme, Badge
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BadgeIcon from '@mui/icons-material/Badge';
import WorkIcon from '@mui/icons-material/Work';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import type { Employee, Hotel } from '../../types';
import { getInitials } from '../../utils/stringUtils';

interface EmployeeCardProps {
  employee: Employee;
  hotel?: Hotel;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

const roleColors: { [key: string]: string } = {
  'Housekeeper': '#FF5722',
  'Housekeeping Runner': '#FF9800',
  'Laundry Attendant': '#2196F3',
  'General Worker': '#4CAF50',
  'Supervisor': '#9C27B0',
};

export default function EmployeeCard({ employee, hotel, onEdit, onDelete }: EmployeeCardProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const roleColor = roleColors[employee.role] || theme.palette.primary.main;

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: `0 12px 30px -10px ${isLight ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.5)'}`,
          borderColor: roleColor,
          '& .action-buttons': { opacity: 1, transform: 'translateX(0)' }
        }
      }}
    >
      {/* Indicador de Estado Lateral */}
      <Box sx={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '4px', 
        height: '100%', 
        backgroundColor: employee.isBlacklisted ? 'error.main' : (employee.isActive ? 'success.main' : 'text.disabled') 
      }} />

      <CardContent sx={{ p: 3, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              sx={{ 
                '& .MuiBadge-badge': { 
                  backgroundColor: employee.isActive ? '#44b700' : '#bdbdbd',
                  color: '#44b700',
                  boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                  width: 12, height: 12, borderRadius: '50%',
                  '&::after': {
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '50%',
                    animation: employee.isActive ? 'ripple 1.2s infinite ease-in-out' : 'none',
                    border: '1px solid currentColor', content: '""',
                  },
                },
                '@keyframes ripple': {
                  '0%': { transform: 'scale(.8)', opacity: 1 },
                  '100%': { transform: 'scale(2.4)', opacity: 0 },
                },
              }}
            >
              <Avatar 
                sx={{ 
                  bgcolor: roleColor, 
                  width: 60, 
                  height: 60, 
                  fontSize: '1.5rem', 
                  fontWeight: 800,
                  boxShadow: `0 4px 12px ${roleColor}44`
                }}
              >
                {getInitials(employee.name)}
              </Avatar>
            </Badge>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, mb: 0.5 }}>
                {employee.name}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <BadgeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  ID: {employee.employeeNumber}
                </Typography>
              </Stack>
            </Box>
          </Box>
        </Box>

        <Stack spacing={1.5} sx={{ mt: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 24, height: 24, bgcolor: 'rgba(255,255,255,0.05)' }}>
              <WorkIcon sx={{ fontSize: 14, color: roleColor }} />
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.role}</Typography>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 24, height: 24, bgcolor: 'rgba(255,255,255,0.05)' }}>
              <ApartmentIcon sx={{ fontSize: 14, color: 'primary.main' }} />
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{hotel?.name || 'No Asignado'}</Typography>
              {hotel?.zone && <Typography variant="caption" color="text.secondary">{hotel.zone}</Typography>}
            </Box>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2.5, opacity: 0.1 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tooltip title={employee.documentacion_completa ? "Documentación Completa" : "Documentación Incompleta"}>
            <Chip 
              size="small"
              icon={employee.documentacion_completa ? <VerifiedUserIcon /> : <WarningAmberIcon />}
              label={employee.documentacion_completa ? "VERIFICADO" : "PENDIENTE"}
              color={employee.documentacion_completa ? "success" : "error"}
              variant="outlined"
              sx={{ fontWeight: 900, fontSize: '0.65rem', borderRadius: 1.5 }}
            />
          </Tooltip>
          
          <Chip 
            label={employee.payrollType.toUpperCase()} 
            size="small" 
            sx={{ fontWeight: 'bold', fontSize: '0.65rem', bgcolor: 'rgba(255,255,255,0.05)' }} 
          />
        </Box>
      </CardContent>

      {/* Botones de Acción (Flotantes a la derecha) */}
      <Box 
        className="action-buttons"
        sx={{ 
          position: 'absolute', top: 12, right: 12, 
          display: 'flex', flexDirection: 'column', gap: 1,
          opacity: 0, transform: 'translateX(10px)',
          transition: 'all 0.3s ease',
          zIndex: 2
        }}
      >
        <Tooltip title="Editar" placement="left">
          <IconButton 
            size="small" 
            onClick={(e) => { e.stopPropagation(); onEdit(employee); }}
            sx={{ bgcolor: 'background.paper', boxShadow: 2, '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar" placement="left">
          <IconButton 
            size="small" 
            onClick={(e) => { e.stopPropagation(); onDelete(employee.id); }}
            sx={{ bgcolor: 'background.paper', boxShadow: 2, '&:hover': { bgcolor: 'error.main', color: 'white' } }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {employee.isBlacklisted && (
        <Box sx={{ 
          position: 'absolute', bottom: 0, width: '100%', 
          bgcolor: 'error.main', color: 'white', 
          py: 0.5, textAlign: 'center', fontSize: '0.7rem', fontWeight: 'bold'
        }}>
          LISTA NEGRA
        </Box>
      )}
    </Card>
  );
}