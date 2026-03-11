import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

import { StaffingRequestsProvider } from './contexts/StaffingRequestsContext';
import { AuthProvider } from './contexts/AuthContext';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <StaffingRequestsProvider>
        <App />
      </StaffingRequestsProvider>
    </AuthProvider>
  </BrowserRouter>
);
