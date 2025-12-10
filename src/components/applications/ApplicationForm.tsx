import { TextField, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import type { Hotel } from '../../types';

interface ApplicationFormProps {
  formData: {
    candidate_name: string;
    hotel_id: string;
    role: string;
  };
  onFormChange: (field: string, value: any) => void;
  hotels: Hotel[];
  roles: string[]; // Add roles prop
}

export default function ApplicationForm({ formData, onFormChange, hotels, roles }: ApplicationFormProps) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Nombre del Candidato"
          value={formData.candidate_name}
          onChange={(e) => onFormChange('candidate_name', e.target.value)}
          margin="dense"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth margin="dense">
          <InputLabel>Hotel</InputLabel>
          <Select
            value={formData.hotel_id}
            label="Hotel"
            onChange={(e) => onFormChange('hotel_id', e.target.value)}
          >
            {hotels.map(hotel => (
              <MenuItem key={hotel.id} value={hotel.id}>{hotel.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth margin="dense">
          <InputLabel>Cargo</InputLabel>
          <Select
            value={formData.role}
            label="Cargo"
            onChange={(e) => onFormChange('role', e.target.value)}
          >
            {roles.map(role => (
              <MenuItem key={role} value={role}>{role}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
}
