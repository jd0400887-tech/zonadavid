import { Grid } from '@mui/material';

import type { Employee, Hotel } from '../../types';
import EmployeeCard from './EmployeeCard';

// This is a dummy comment to force re-evaluation of the module.
interface EmployeeGridProps {
  employees: Employee[];
  hotels: Hotel[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

export default function EmployeeGrid({ employees, hotels, onEdit, onDelete }: EmployeeGridProps) {
  return (
    <Grid container spacing={3} columns={12}>
      {employees.map((employee) => {
        return (
          <Grid item key={employee.id} xs={12} sm={6} md={4}>
            <EmployeeCard 
              employee={employee} 
              hotel={hotels.find(h => h.id === employee.hotelId)} 
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </Grid>
        );
      })}
    </Grid>
  );
}