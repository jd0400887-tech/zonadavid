import { createTheme } from '@mui/material/styles';

// Create a theme instance.
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FF5722', // Naranja Neón
    },
    secondary: {
      main: '#f50057', // Un color de acento
    },
    background: {
      default: '#212121', // Fondo principal oscuro
      paper: '#303030',   // Fondo de 'papel' como tarjetas y menús
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

export default theme;
