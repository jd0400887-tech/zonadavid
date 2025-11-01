import { useHotels } from './useHotels';
import { supabase } from '../utils/supabase';
import type { Employee } from '../types';
import { useCallback, useMemo } from 'react';

export function useEmployees() {
  const { employees, refreshHotels } = useHotels();

  const roles = useMemo(() => {
    if (!employees) return [];
    const allRoles = employees.map(e => e.role);
    return [...new Set(allRoles)];
  }, [employees]);

  const addEmployee = useCallback(async (employeeData: Partial<Employee>) => {
    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      ...employeeData,
    } as Employee;
    const { error } = await supabase.from('employees').insert([newEmployee]);
    if (error) {
      console.error('Error adding employee:', error);
    } else {
      refreshHotels();
    }
  }, [refreshHotels]);

  const updateEmployee = useCallback(async (updatedEmployee: Partial<Employee>) => {
    if (!updatedEmployee.id) return;
    const { error } = await supabase.from('employees').update(updatedEmployee).eq('id', updatedEmployee.id);
    if (error) {
      console.error('Error updating employee:', error);
    } else {
      refreshHotels();
    }
  }, [refreshHotels]);

  const deleteEmployee = useCallback(async (id: string) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) {
      console.error('Error deleting employee:', error);
    } else {
      refreshHotels();
    }
  }, [refreshHotels]);

  const toggleEmployeeBlacklist = useCallback(async (id: string) => {
    const employee = employees.find(e => e.id === id);
    if (!employee) return;
    const { error } = await supabase.from('employees').update({ isBlacklisted: !employee.isBlacklisted }).eq('id', id);
    if (error) {
      console.error('Error toggling blacklist:', error);
    } else {
      refreshHotels();
    }
  }, [employees, refreshHotels]);

  return {
    employees,
    roles,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeBlacklist,
  };
}
