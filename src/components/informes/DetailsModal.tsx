import { Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, Typography, DialogActions, Button } from '@mui/material';

interface DetailsModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  items: any[];
  renderItem: (item: any) => React.ReactNode;
}

export default function DetailsModal({ open, onClose, title, items, renderItem }: DetailsModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        {items.length > 0 ? (
          <List>
            {items.map((item, index) => (
              <ListItem key={index} divider>
                {renderItem(item)}
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography sx={{ p: 3, textAlign: 'center' }}>No hay detalles para mostrar.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
