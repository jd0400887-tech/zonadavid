import { useHotels } from './useHotels';
import { supabase } from '../utils/supabase';
import type { Employee } from '../types';
import { useCallback, useMemo } from 'react';
import { EMPLOYEE_POSITIONS } from '../data/constants';

export function useEmployees() {
  const { employees, refreshHotels } = useHotels();

  const roles = useMemo(() => {
    return EMPLOYEE_POSITIONS;
  }, []);

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

    const { data: currentEmployee, error: fetchError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', updatedEmployee.id)
      .single();

    if (fetchError) {
      console.error('Error fetching current employee:', fetchError);
      return;
    }

    if (currentEmployee && currentEmployee.isActive !== updatedEmployee.isActive) {
      await supabase.from('employee_status_history').insert({
        employee_id: updatedEmployee.id,
        change_date: new Date().toISOString(),
        old_is_active: currentEmployee.isActive,
        new_is_active: updatedEmployee.isActive,
        reason: updatedEmployee.isActive ? 'Activated' : 'Deactivated',
      });
    }

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

    const isBlacklisting = !employee.isBlacklisted;
    const updateData: Partial<Employee> = { id, isBlacklisted: isBlacklisting };

    if (isBlacklisting) {
      if (employee.isActive) {
        updateData.isActive = false;
      }
    } else {
      // When removing from blacklist, keep the current isActive status
      updateData.isActive = employee.isActive;
    }

    updateEmployee(updateData);
  }, [employees, updateEmployee]);

  return {
    employees,
    roles,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeBlacklist,
  };
}
