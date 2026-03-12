import { Paper, TextField, InputAdornment, ToggleButtonGroup, ToggleButton, Box, FormControl, InputLabel, Select, MenuItem, Stack, Typography, Divider, Grid } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MapIcon from '@mui/icons-material/Map';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BadgeIcon from '@mui/icons-material/Badge';
import { useAuth } from '../../hooks/useAuth';
import type { Hotel } from '../../types';

interface EmployeeFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (filter: string) => void;
  hotels: Hotel[];
  zoneFilter: string;
  onZoneChange: (zone: string) => void;
  hotelFilter: string;
  onHotelChange: (hotelId: string) => void;
}

export default function EmployeeFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  hotels,
  zoneFilter,
  onZoneChange,
  hotelFilter,
  onHotelChange,
}: EmployeeFiltersProps) {
  const { profile } = useAuth();
  const isInspector = profile?.role === 'INSPECTOR';

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 2.5, 
        mb: 3, 
        borderRadius: 3, 
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)'
      }}
    >
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <BadgeIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Filtros de Personal</Typography>
          </Stack>

          <ToggleButtonGroup
            color="primary"
            value={statusFilter}
            exclusive
            onChange={(_e, newFilter) => newFilter && onStatusChange(newFilter)}
            aria-label="Filtro de estado"
            size="small"
            sx={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, p: 0.5 }}
          >
            <ToggleButton value="active" sx={{ border: 'none', borderRadius: '8px !important', px: 2 }}>Activos</ToggleButton>
            <ToggleButton value="inactive" sx={{ border: 'none', borderRadius: '8px !important', px: 2 }}>Inactivos</ToggleButton>
            <ToggleButton value="blacklisted" sx={{ border: 'none', borderRadius: '8px !important', px: 2, color: 'error.main' }}>Lista Negra</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider sx={{ opacity: 0.1 }} />

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="zone-filter-label">Zona</InputLabel>
              <Select
                labelId="zone-filter-label"
                value={zoneFilter}
                onChange={(e) => onZoneChange(e.target.value)}
                label="Zona"
                disabled={isInspector}
                startAdornment={<InputAdornment position="start"><MapIcon fontSize="small" color="primary" /></InputAdornment>}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">Todas las Zonas</MenuItem>
                <MenuItem value="Centro">Centro</MenuItem>
                <MenuItem value="Norte">Norte</MenuItem>
                <MenuItem value="Noroeste">Noroeste</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="hotel-filter-label">Hotel</InputLabel>
              <Select
                labelId="hotel-filter-label"
                value={hotelFilter}
                onChange={(e) => onHotelChange(e.target.value)}
                label="Hotel"
                startAdornment={<InputAdornment position="start"><ApartmentIcon fontSize="small" color="primary" /></InputAdornment>}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">
                  <em>Todos los Hoteles</em>
                </MenuItem>
                {hotels
                  .filter(h => {
                    if (zoneFilter !== 'all') return h.zone === zoneFilter;
                    return true;
                  })
                  .map((hotel) => (
                    <MenuItem key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Buscar empleado por nombre..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="primary" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 }
              }}
            />
          </Grid>
        </Grid>
      </Stack>
    </Paper>
  );
}