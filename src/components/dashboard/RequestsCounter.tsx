import { useStaffingRequests } from '../../hooks/useStaffingRequests';
import { Typography } from '@mui/material';

export default function RequestsCounter() {
  const { requests } = useStaffingRequests();
  return null;
}