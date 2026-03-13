import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  Typography, Box, Grid, Avatar, Stack, Divider, List, ListItem, 
  ListItemText, Chip, Paper, useTheme, IconButton
} from '@mui/material';

// Iconos
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import ApartmentIcon from '@mui/icons-material/Apartment';
import NotesIcon from '@mui/icons-material/Notes';
import WarningIcon from '@mui/icons-material/Warning';

import { QA_TEMPLATES } from '../../data/qaTemplates';

interface QADetailsDialogProps {
  open: boolean;
  onClose: () => void;
  audit: any | null;
}

export default function QADetailsDialog({ open, onClose, audit }: QADetailsDialogProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  if (!audit) return null;

  const template = QA_TEMPLATES.find(t => t.id === audit.type);
  const targetName = audit.type === 'staff' ? audit.employees?.name : (audit.type === 'room' ? audit.employees?.name : audit.hotels?.name);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ p: 3, background: 'linear-gradient(45deg, #0F172A 30%, #1e293b 90%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 'bold' }}>
              {audit.score}%
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Detalle de Auditoría</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>Realizada el {new Date(audit.created_at).toLocaleDateString()}</Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC' }}>
        {/* INFO DEL AUDITADO */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255, 87, 34, 0.1)', color: 'primary.main' }}>
            {audit.type === 'hotel' ? <ApartmentIcon /> : <PersonIcon />}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{targetName}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 800 }}>
              {template?.title}
            </Typography>
          </Box>
        </Paper>

        <Typography variant="overline" sx={{ fontWeight: 900, mb: 1, display: 'block', color: 'text.secondary' }}>Resultados por ítem</Typography>
        
        <Stack spacing={1}>
          {template?.questions.map((q) => {
            const answer = audit.audit_data[q.id];
            const isPass = answer === 'pass';
            const isFail = answer === 'fail';
            const isNA = answer === 'na';

            return (
              <Paper key={q.id} elevation={0} sx={{ 
                p: 1.5, borderRadius: 2, 
                border: '1px solid rgba(0,0,0,0.03)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                bgcolor: isFail ? 'rgba(244, 67, 54, 0.03)' : 'white'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {q.isCritical && <WarningIcon sx={{ color: 'error.main', fontSize: 16 }} />}
                  <Typography variant="body2" sx={{ fontWeight: isFail ? 700 : 400, color: isFail ? 'error.main' : 'text.primary' }}>
                    {q.text}
                  </Typography>
                </Box>
                
                {isPass && <Chip icon={<CheckCircleIcon />} label="CUMPLE" size="small" color="success" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 900 }} />}
                {isFail && <Chip icon={<CancelIcon />} label="FALLA" size="small" color="error" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 900 }} />}
                {isNA && <Chip label="N/A" size="small" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 900 }} />}
              </Paper>
            );
          })}
        </Stack>

        {/* NOTAS */}
        {audit.notes && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.secondary' }}>Observaciones del Inspector</Typography>
            <Paper elevation={0} sx={{ p: 2, mt: 0.5, borderRadius: 2, bgcolor: 'rgba(255, 152, 0, 0.05)', border: '1px dashed rgba(255, 152, 0, 0.3)' }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                "{audit.notes}"
              </Typography>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: '#F8FAFC' }}>
        <Button onClick={onClose} variant="contained" fullWidth sx={{ borderRadius: 2, fontWeight: 'bold', py: 1.2 }}>
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
}
