import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import HotelsPage from './pages/HotelsPage';
import AttendanceReportPage from './pages/AttendanceReportPage';
import PayrollReviewPage from './pages/PayrollReviewPage';
import HotelDetailPage from './pages/HotelDetailPage';
import LoginPage from './pages/LoginPage';
import { useAuth } from './hooks/useAuth';

function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {!session ? (
        <Route path="*" element={<LoginPage />} />
      ) : (
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="empleados" element={<EmployeesPage />} />
          <Route path="hoteles" element={<HotelsPage />} />
          <Route path="hotel/:hotelId" element={<HotelDetailPage />} />
          <Route path="reporte-asistencia" element={<AttendanceReportPage />} />
          <Route path="revision-nomina" element={<PayrollReviewPage />} />
        </Route>
      )}
    </Routes>
  );
}

export default App;