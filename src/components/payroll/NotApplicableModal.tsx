import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Stack,
  Typography,
  TextField
} from '@mui/material';
import { useState } from 'react';

const NOT_APPLICABLE_REASONS = [
  { value: 'vacaciones', label: 'Vacaciones' },
  { value: 'baja_medica', label: 'Baja Médica' },
  { value: 'permiso', label: 'Permiso' },
  { value: 'otro', label: 'Otro' },
];

interface NotApplicableModalProps {
  open: boolean;
  onClose: () => void;
  employeeName: string;
  onSave: (reason: string) => void;
}

export const NotApplicableModal = ({
  open,
  onClose,
  employeeName,
  onSave,
}: NotApplicableModalProps) => {
  const [reason, setReason] = useState<string>('vacaciones');
  const [customReason, setCustomReason] = useState<string>('');

  const handleReasonChange = (newReason: string) => {
    setReason(newReason);
    setCustomReason('');
  };

  const currentReasonToSave = reason === 'otro' ? customReason : reason;
  const canSave = currentReasonToSave && currentReasonToSave.trim() !== '';

  const handleSave = () => {
    if (canSave) {
      onSave(currentReasonToSave);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Motivo para "No Aplica"</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>Selecciona el motivo por el cual {employeeName} no será calificado esta semana.</Typography>
        <Stack spacing={2}>
          <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ rowGap: 1 }}>
            {NOT_APPLICABLE_REASONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                color={reason === option.value ? 'primary' : 'default'}
                onClick={() => handleReasonChange(option.value)}
                clickable
              />
            ))}
          </Stack>
          {reason === 'otro' && (
            <TextField
              autoFocus
              margin="dense"
              label="Especifique otro motivo"
              type="text"
              fullWidth
              variant="outlined"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={!canSave}>Guardar Motivo</Button>
      </DialogActions>
    </Dialog>
  );
};
