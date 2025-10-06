import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

interface BulkImportButtonProps<T> {
  onDataParsed: (data: T[]) => Promise<{ successCount: number; errorCount: number }>;
  requiredHeaders: string[];
  buttonText: string;
}

export default function BulkImportButton<T extends object>({ onDataParsed, requiredHeaders, buttonText }: BulkImportButtonProps<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    Papa.parse<T>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const fileHeaders = results.meta.fields;
        const missingHeaders = requiredHeaders.filter(h => !fileHeaders?.includes(h));

        if (missingHeaders.length > 0) {
          setSnackbar({
            open: true,
            message: `El archivo no es válido. Faltan las siguientes columnas: ${missingHeaders.join(', ')}`,
            severity: 'error',
          });
          setIsLoading(false);
          return;
        }

        try {
          const { successCount, errorCount } = await onDataParsed(results.data);
          let message = `Carga completada. Registros exitosos: ${successCount}.`;
          if (errorCount > 0) {
            message += ` Errores: ${errorCount}.`;
          }
          setSnackbar({
            open: true,
            message,
            severity: errorCount > 0 ? 'warning' : 'success',
          });
        } catch (error) {
          setSnackbar({
            open: true,
            message: `Ocurrió un error inesperado durante el procesamiento.`,
            severity: 'error',
          });
        } finally {
          setIsLoading(false);
          // Reset file input
          if(fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      },
      error: (error) => {
        setSnackbar({ open: true, message: `Error al leer el archivo: ${error.message}`, severity: 'error' });
        setIsLoading(false);
      },
    });
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <Button
        variant="outlined"
        startIcon={isLoading ? <CircularProgress size={20} /> : <UploadFileIcon />}
        onClick={handleButtonClick}
        disabled={isLoading}
      >
        {isLoading ? 'Procesando...' : buttonText}
      </Button>
      {snackbar && (
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbar(null)} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </>
  );
}
