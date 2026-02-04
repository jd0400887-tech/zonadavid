import { useStaffingRequestsContext } from '../../contexts/StaffingRequestsContext';
import { Typography } from '@mui/material';

export default function RequestsCounter() {
  const { activeRequests } = useStaffingRequestsContext();
  return (
    <Typography variant="h6">
      Solicitudes Activas: {activeRequests.length}
    </Typography>
  );
}