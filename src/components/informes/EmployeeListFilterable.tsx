import React, { useState, useMemo } from 'react';
import { List, ListItem, ListItemText, FormControl, InputLabel, Select, MenuItem, Box, Typography } from '@mui/material';

interface EmployeeListFilterableProps {
  employees: any[]; // Expects an array of employee-like objects with at least `id`, `name`, `hotelId`
  hotels: any[]; // Expects an array of hotel-like objects with at least `id`, `name`
  title: string;
}

const EmployeeListFilterable: React.FC<EmployeeListFilterableProps> = ({ employees, hotels, title }) => {
  const [hotelFilter, setHotelFilter] = useState('all');

  const filteredEmployees = useMemo(() => {
    if (hotelFilter === 'all') {
      return employees;
    }
    return employees.filter(emp => emp.hotelId === hotelFilter);
  }, [employees, hotelFilter]);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="filter-by-hotel-label">Filtrar por Hotel</InputLabel>
        <Select
          labelId="filter-by-hotel-label"
          id="filter-by-hotel"
          value={hotelFilter}
          label="Filtrar por Hotel"
          onChange={(e) => setHotelFilter(e.target.value as string)}
        >
          <MenuItem value="all">Todos los Hoteles</MenuItem>
          {hotels.map(hotel => (
            <MenuItem key={hotel.id} value={hotel.id}>{hotel.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {filteredEmployees.length > 0 ? (
        <List dense>
          {filteredEmployees.map((item: any) => {
            const hotel = hotels.find(h => h.id === item.hotelId);
            return (
              <ListItem key={item.id}>
                <ListItemText primary={`${item.name} - ${hotel?.name || 'Hotel desconocido'}`} />
              </ListItem>
            );
          })}
        </List>
      ) : (
        <Typography sx={{ mt: 2 }}>No hay empleados que coincidan con el filtro.</Typography>
      )}
    </Box>
  );
};

export default EmployeeListFilterable;
