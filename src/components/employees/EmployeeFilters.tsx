import { Paper, TextField, InputAdornment, ToggleButtonGroup, ToggleButton, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
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
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <ToggleButtonGroup
          color="primary"
          value={statusFilter}
          exclusive
          onChange={(_e, newFilter) => newFilter && onStatusChange(newFilter)}
          aria-label="Filtro de estado"
          size="small"
        >
          <ToggleButton value="active">Activos</ToggleButton>
          <ToggleButton value="inactive">Inactivos</ToggleButton>
          <ToggleButton value="blacklisted">Lista Negra</ToggleButton>
        </ToggleButtonGroup>

        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel id="zone-filter-label">Zona</InputLabel>
          <Select
            labelId="zone-filter-label"
            value={zoneFilter}
            onChange={(e) => onZoneChange(e.target.value)}
            label="Zona"
          >
            <MenuItem value="all">Todas las Zonas</MenuItem>
            <MenuItem value="Centro">Centro</MenuItem>
            <MenuItem value="Norte">Norte</MenuItem>
            <MenuItem value="Noroeste">Noroeste</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="hotel-filter-label">Hotel</InputLabel>
          <Select
            labelId="hotel-filter-label"
            value={hotelFilter}
            onChange={(e) => onHotelChange(e.target.value)}
            label="Hotel"
          >
            <MenuItem value="">
              <em>Todos los Hoteles</em>
            </MenuItem>
            {hotels
              .filter(h => zoneFilter === 'all' || h.zone === zoneFilter)
              .map((hotel) => (
                <MenuItem key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Buscar por nombre..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, minWidth: '200px' }}
        />
      </Box>
    </Paper>
  );
}