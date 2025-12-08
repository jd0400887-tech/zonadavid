import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Stack,
  Typography
} from '@mui/material';
import { useState, useEffect } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt';

const COMPLIANCE_STATUS_OPTIONS = [
  { value: 'cumplio', label: 'Cumplió Correctamente', icon: <CheckCircleIcon /> },
  { value: 'modificacion_menor', label: 'Modificación Menor', icon: <ErrorOutlineIcon /> },
  { value: 'incumplimiento_parcial', label: 'Incumplimiento Parcial', icon: <HelpOutlineIcon /> },
  { value: 'incumplimiento_total', label: 'Incumplimiento Total', icon: <DoNotDisturbAltIcon /> },
];

const REASON_OPTIONS = [
  { value: 'no_funcionaba_app', label: 'No funcionaba la aplicación' },
  { value: 'no_tenia_datos_senal', label: 'No tenía datos o mala señal' },
  { value: 'se_olvido_marcar', label: 'Se le olvidó marcar' },
  { value: 'otro', label: 'Otro' },
];

interface ComplianceReviewModalProps {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  initialComplianceStatus: string;
  initialComplianceReason: string | null;
  onSave: (employeeId: string, status: string, reason: string | null) => void;
}

export const ComplianceReviewModal = ({
  open,
  onClose,
  employeeId,
  employeeName,
  initialComplianceStatus,
  initialComplianceReason,
  onSave,
}: ComplianceReviewModalProps) => {
  const [status, setStatus] = useState<string>(initialComplianceStatus);
  const [reason, setReason] = useState<string | null>(initialComplianceReason);
  const [customReason, setCustomReason] = useState<string>('');

  useEffect(() => {
    setStatus(initialComplianceStatus);
    setReason(initialComplianceReason);
    if (REASON_OPTIONS.every(opt => opt.value !== initialComplianceReason)) {
      setCustomReason(initialComplianceReason || '');
    } else {
      setCustomReason('');
    }
  }, [initialComplianceStatus, initialComplianceReason]);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    if (newStatus === 'cumplio') {
      setReason(null);
      setCustomReason('');
    } else {
      // Ensure a reason is selected or input if previous status was 'cumplio'
      if (!reason && !customReason) {
        setReason(REASON_OPTIONS[0]?.value || null);
      }
    }
  };

  const handleReasonChange = (newReason: string) => {
    setReason(newReason);
    setCustomReason('');
  };

  const handleCustomReasonChange = (newCustomReason: string) => {
    setCustomReason(newCustomReason);
    setReason('otro'); // Ensure 'otro' is selected if typing custom reason
  };

  const currentReasonToSave = status === 'cumplio' ? null : (reason === 'otro' ? customReason : reason);

  const canSave = status && (status === 'cumplio' || currentReasonToSave);

  const handleSave = () => {
    if (canSave) {
      onSave(employeeId, status, currentReasonToSave);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Calificar Cumplimiento de {employeeName}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="subtitle1">Estado de Cumplimiento:</Typography>
          <Stack direction="row" flexWrap="wrap" spacing={2} sx={{ rowGap: 1 }}>
            {COMPLIANCE_STATUS_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                icon={option.icon}
                color={status === option.value ? 'primary' : 'default'}
                onClick={() => handleStatusChange(option.value)}
                clickable
              />
            ))}
          </Stack>

          {status && status !== 'cumplio' && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 2 }}>Motivo:</Typography>
              <Stack direction="row" flexWrap="wrap" spacing={2} sx={{ rowGap: 1 }}>
                {REASON_OPTIONS.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    color={reason === option.value ? 'secondary' : 'default'}
                    onClick={() => handleReasonChange(option.value)}
                    clickable
                  />
                ))}
              </Stack>
              {(reason === 'otro' || (reason === null && customReason)) && (
                <TextField
                  margin="dense"
                  label="Especifique otro motivo"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={customReason}
                  onChange={(e) => handleCustomReasonChange(e.target.value)}
                />
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={!canSave}>Guardar Calificación</Button>
      </DialogActions>
    </Dialog>
  );
};
