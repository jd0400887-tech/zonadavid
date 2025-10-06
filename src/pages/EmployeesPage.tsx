import { useState } from 'react';
import { Box, Typography, Button, Stack, Toolbar, ToggleButtonGroup, ToggleButton, Paper } from '@mui/material';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import useLocalStorage from '../hooks/useLocalStorage';
import { useEmployees } from '../hooks/useEmployees';
import { initialHotels } from '../data/initialData';
import type { Employee, Hotel } from '../types';
import FormModal from '../components/form/FormModal';
import EmployeeForm from '../components/employees/EmployeeForm';
import EmptyState from '../components/EmptyState';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import { exportEmployeesToExcel } from '../utils/exportUtils';
import EmployeeFilters from '../components/employees/EmployeeFilters';
import EmployeeGrid from '../components/employees/EmployeeGrid';
import EmployeeTable from '../components/employees/EmployeeTable';
import BulkImportButton from '../components/common/BulkImportButton';

export default function EmployeesPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, toggleEmployeeBlacklist } = useEmployees();
  const [hotels] = useLocalStorage<Hotel[]>('hotels', initialHotels);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee>>({});

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);

  const filteredEmployees = employees
    .filter(employee => {
      if (statusFilter === 'active') return employee.isActive && !employee.isBlacklisted;
      if (statusFilter === 'inactive') return !employee.isActive && !employee.isBlacklisted;
      if (statusFilter === 'blacklisted') return employee.isBlacklisted;
      return true;
    })
    .filter(employee =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleOpenAddModal = () => {
    setCurrentEmployee({ isActive: true, isBlacklisted: false, payrollType: 'timesheet' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (employee: Employee) => {
    setCurrentEmployee(employee);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEmployee({});
  };

  const handleFormChange = (field: keyof Employee, value: any) => {
    setCurrentEmployee(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (currentEmployee.id) {
      updateEmployee(currentEmployee);
    } else {
      addEmployee(currentEmployee);
    }
    handleCloseModal();
  };

  const handleDeleteRequest = (id: string) => {
    setEmployeeToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (employeeToDelete) {
      deleteEmployee(employeeToDelete);
    }
    setIsConfirmOpen(false);
    setEmployeeToDelete(null);
  };

  const handleToggleBlacklist = () => {
    if (!currentEmployee.id) return;
    toggleEmployeeBlacklist(currentEmployee.id);
    handleCloseModal();
  };

  const handleViewChange = (event: React.MouseEvent<HTMLElement>, nextView: string | null) => {
    if (nextView !== null) {
      setViewMode(nextView);
    }
  };

  const modalTitle = currentEmployee.id ? "Editar Empleado" : "Añadir Nuevo Empleado";

  const handleEmployeeImport = async (parsedData: Partial<Employee>[]) => {
    let successCount = 0;
    let errorCount = 0;

    const existingHotelIds = new Set(hotels.map(h => h.id));

    for (const item of parsedData) {
      if (item.name && item.hotelId && item.role && item.payrollType) {
      let currentHotel = hotels.find((h) => h.id === item.hotelId);
      if (!currentHotel) {
        console.warn(
          `Employee "${item.name}" is associated with a missing hotel ID "${item.hotelId}". Displaying as "Hotel Desconocido".`
        );
        currentHotel = { id: 'unknown', name: 'Hotel Desconocido', address: 'N/A', phone: 'N/A', email: 'N/A' };
      }

        addEmployee({
          name: item.name,
          hotelId: item.hotelId,
          role: item.role,
          payrollType: item.payrollType,
          isActive: true,
          isBlacklisted: false,
        });
        successCount++;
      } else {
        errorCount++;
      }
    }

    return { successCount, errorCount };
  };

  return (
    <Box>
      <Toolbar />
      <Box component="main" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4">Gestión de Empleados</Typography>
          <Stack direction="row" spacing={2}>
            <BulkImportButton<Partial<Employee>>
              buttonText="Importar Empleados (CSV)"
              requiredHeaders={['name', 'hotelId', 'role', 'payrollType']}
              onDataParsed={handleEmployeeImport}
            />
            <Button variant="outlined" startIcon={<SaveAltIcon />} onClick={() => exportEmployeesToExcel(filteredEmployees, hotels)}>
              Exportar a Excel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenAddModal}
              sx={{
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: `0 0 8px 2px #FF5722`,
                }
              }}
            >
              Añadir Empleado
            </Button>
          </Stack>
        </Box>

        <EmployeeFilters 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewChange}>
            <ToggleButton value="grid" aria-label="grid view">
              <ViewModuleIcon />
            </ToggleButton>
            <ToggleButton value="table" aria-label="table view">
              <ViewListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {filteredEmployees.length > 0 ? (
          viewMode === 'grid' ? (
            <EmployeeGrid 
              employees={filteredEmployees} 
              hotels={hotels} 
              onEdit={handleOpenEditModal} 
              onDelete={handleDeleteRequest} 
            />
          ) : (
            <EmployeeTable 
              employees={filteredEmployees} 
              hotels={hotels} 
              onEdit={handleOpenEditModal} 
              onDelete={handleDeleteRequest} 
            />
          )
        ) : (
          <Paper sx={{ mt: 2 }}>
            <EmptyState 
              icon={<SearchIcon />}
              title="No se encontraron empleados"
              subtitle="Intenta cambiar los filtros o el término de búsqueda."
            />
          </Paper>
        )}

        <FormModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          title={modalTitle}
        >
          <EmployeeForm
            employeeData={currentEmployee}
            onFormChange={handleFormChange}
            hotels={hotels}
            onToggleBlacklist={handleToggleBlacklist}
          />
        </FormModal>

        <ConfirmationDialog
          open={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Confirmar Eliminación"
          content="¿Estás seguro de que quieres eliminar este empleado? Esta acción no se puede deshacer."
        />
      </Box>
    </Box>
  );
}
