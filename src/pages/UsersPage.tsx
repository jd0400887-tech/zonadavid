import { useState, useEffect } from 'react';
import { Box, Toolbar, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, CircularProgress, Chip } from '@mui/material';
import { supabase } from '../utils/supabase';
import { Profile } from '../types';

export default function UsersPage() {
  const [users, setUsers] = useState<(Profile & { email_auth?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 1. Obtener perfiles
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*');

      if (pError) throw pError;

      setUsers(profiles || []);
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Error al cargar usuarios: ' + error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
      setSnackbar({ open: true, message: 'Rol actualizado correctamente', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Error: ' + error.message, severity: 'error' });
    }
  };

  const handleUpdateZone = async (userId: string, newZone: string | null) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ assigned_zone: newZone === 'Ninguna' ? null : newZone })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, assigned_zone: (newZone === 'Ninguna' ? null : newZone) as any } : u));
      setSnackbar({ open: true, message: 'Zona actualizada correctamente', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Error: ' + error.message, severity: 'error' });
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Toolbar />
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          Gestión de Usuarios y Permisos
        </Typography>
        
        <TableContainer component={Paper} sx={{ mt: 3, backgroundColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><b>ID Usuario</b></TableCell>
                <TableCell><b>Rol Actual</b></TableCell>
                <TableCell><b>Zona Asignada</b></TableCell>
                <TableCell><b>Acciones</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    {user.id}
                    {user.role === 'ADMIN' && <Chip label="ADMIN" size="small" color="primary" sx={{ ml: 1 }} />}
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                      >
                        <MenuItem value="ADMIN">ADMIN</MenuItem>
                        <MenuItem value="COORDINATOR">COORDINADOR</MenuItem>
                        <MenuItem value="INSPECTOR">INSPECTOR</MenuItem>
                        <MenuItem value="RECRUITER">RECLUTADOR</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" fullWidth disabled={user.role === 'ADMIN' || user.role === 'RECRUITER'}>
                      <Select
                        value={user.assigned_zone || 'Ninguna'}
                        onChange={(e) => handleUpdateZone(user.id, e.target.value)}
                      >
                        <MenuItem value="Ninguna">Ninguna / Todas</MenuItem>
                        <MenuItem value="Centro">Centro</MenuItem>
                        <MenuItem value="Norte">Norte</MenuItem>
                        <MenuItem value="Noroeste">Noroeste</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      Cambios en tiempo real
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}