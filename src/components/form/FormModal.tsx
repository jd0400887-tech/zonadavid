import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from '@mui/material';

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave: () => void;
}

export default function FormModal({ open, onClose, title, children, onSave }: FormModalProps) {
  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ component: 'form', onSubmit: (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); onSave(); } }}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
         {children}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="contained">Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}
