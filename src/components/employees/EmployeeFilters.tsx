import { Paper, TextField, InputAdornment, ToggleButtonGroup, ToggleButton, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface EmployeeFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (filter: string) => void;
}

export default function EmployeeFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
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
        >
          <ToggleButton value="active">Activos</ToggleButton>
          <ToggleButton value="inactive">Inactivos</ToggleButton>
          <ToggleButton value="blacklisted">Lista Negra</ToggleButton>
        </ToggleButtonGroup>
        <TextField
          variant="outlined"
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
          sx={{ flexGrow: 1, minWidth: '250px' }}
        />
      </Box>
    </Paper>
  );
}