import { createTheme } from '@mui/material/styles';

// Dark Theme (Original)
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FF5722', // Naranja Neón
    },
    secondary: {
      main: '#f50057', 
    },
    background: {
      default: '#000000', 
      paper: '#1e1e1e',   
    },
    text: {
      primary: '#ffffff',
      secondary: '#e0e0e0',
    },
  },
  typography: {
    fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  },
});

// Light Theme (Premium Recruiter Style)
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#FF5722', // Naranja DA
    },
    secondary: {
      main: '#1E293B', // Azul Medianoche (Navy)
    },
    background: {
      default: '#F8FAFC', // Gris Pizarra muy claro (Slate 50)
      paper: '#FFFFFF',   // Blanco puro para tarjetas
    },
    text: {
      primary: '#0F172A', // Azul oscuro casi negro para lectura (Slate 900)
      secondary: '#475569', // Gris intermedio (Slate 600)
    },
  },
  typography: {
    fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.5px' },
    h6: { fontWeight: 700 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', 
          borderRadius: '12px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          boxShadow: 'none',
          borderBottom: '3px solid #FF5722', // La línea naranja superior
        },
      },
    },
  },
});

export default darkTheme;
