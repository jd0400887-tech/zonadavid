import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import type { Employee } from '../types';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase.from('employees').select('*');
      if (error) {
        console.error('Error fetching employees:', error);
      } else {
        setEmployees(data as Employee[]);
      }
    };

    fetchEmployees();
  }, []);

  const addEmployee = async (employeeData: Partial<Employee>) => {
    const newEmployee: Employee = {
      id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      employeeNumber: `DA-${Date.now().toString().slice(-6)}`,
      isActive: employeeData.isActive ?? true,
      isBlacklisted: false,
      payrollType: employeeData.payrollType || 'timesheet',
      ...employeeData,
    } as Employee;
    const { data, error } = await supabase.from('employees').insert([newEmployee]).select();
    if (error) {
      console.error('Error adding employee:', error);
    } else if (data) {
      setEmployees(prev => [...prev, ...data as Employee[]]);
    }
  };

  const updateEmployee = async (updatedEmployee: Partial<Employee>) => {
    if (!updatedEmployee.id) return;
    const { data, error } = await supabase.from('employees').update(updatedEmployee).eq('id', updatedEmployee.id).select();
    if (error) {
      console.error('Error updating employee:', error);
    } else if (data) {
      setEmployees(prev =>
        prev.map(emp =>
          emp.id === updatedEmployee.id ? { ...emp, ...updatedEmployee } as Employee : emp
        )
      );
    }
  };

  const deleteEmployee = async (id: string) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) {
      console.error('Error deleting employee:', error);
    } else {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    }
  };

  const toggleEmployeeBlacklist = async (id: string) => {
    const employee = employees.find(emp => emp.id === id);
    if (!employee) return;

    const updatedEmployee = {
      ...employee,
      isBlacklisted: !employee.isBlacklisted,
      isActive: employee.isBlacklisted, // If un-blacklisted, go back to active
    };

    await updateEmployee(updatedEmployee);
  };

  return {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeBlacklist,
  };
}
