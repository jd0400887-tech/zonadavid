import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, ThemeProvider, CssBaseline } from '@mui/material';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import HotelsPage from './pages/HotelsPage';
import AttendanceReportPage from './pages/AttendanceReportPage';
import PayrollReviewPage from './pages/PayrollReviewPage';
import HotelDetailPage from './pages/HotelDetailPage';
import InformesPage from './pages/InformesPage'; // Import the new page
import StaffingRequestsPage from './pages/StaffingRequestsPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ArchivedRequestsPage from './pages/ArchivedRequestsPage';
import AdoptionTrackerPage from './pages/AdoptionTrackerPage'; // Import the new page
import CorporateReportPage from './pages/CorporateReportPage';
import HistoricalReportPage from './pages/HistoricalReportPage';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import { useAuth } from './hooks/useAuth';
import { lightTheme, darkTheme } from './theme';

function App() {
  const { session, profile, loading } = useAuth(); // Added profile
  const [forceShow, setForceShow] = useState(false);

  // Seleccionar tema basado en el rol
  const theme = (profile?.role === 'RECRUITER' || profile?.role === 'INSPECTOR') ? lightTheme : darkTheme;

  // Seguridad extra: si en 5 segundos no ha cargado, forzamos mostrar la app
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('Forzando carga de la aplicación tras timeout');
        setForceShow(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && !forceShow) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#121212', color: '#ff5722' }}>
        <h2 style={{ marginBottom: '1rem' }}>Cargando...</h2>
        <CircularProgress color="inherit" />
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {!session ? (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<Navigate to="/" />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="usuarios" element={profile?.role === 'ADMIN' ? <UsersPage /> : <Navigate to="/" />} />
              <Route path="empleados" element={<EmployeesPage />} />
              <Route path="hoteles" element={<HotelsPage />} />
              <Route path="hotel/:hotelId" element={<HotelDetailPage />} />
              <Route path="reporte-asistencia" element={<AttendanceReportPage />} />
              <Route path="revision-nomina" element={<PayrollReviewPage />} />
              <Route path="informes" element={<InformesPage />} /> {/* Add the new route */}
              <Route path="solicitudes" element={<StaffingRequestsPage />} />
              <Route path="aplicaciones" element={<ApplicationsPage />} />
              <Route path="solicitudes-archivadas" element={<ArchivedRequestsPage />} />
              <Route path="seguimiento-workrecord" element={<AdoptionTrackerPage />} />
              <Route path="reporte-corporativo" element={<CorporateReportPage />} />
              <Route path="reporte-historico" element={<HistoricalReportPage />} />
            </Route>
          </>
        )}
      </Routes>
    </ThemeProvider>
  );
}

export default App;