import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from '@mui/material';

interface HotelRankingTableProps {
  data: { id: string; name: string; visits: number }[];
}

export default function HotelRankingTable({ data }: HotelRankingTableProps) {
  return (
        <Paper sx={{
      p: 2,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      border: '1px solid',
      borderColor: 'primary.main',
      boxShadow: `0 0 5px #FF5722, 0 0 10px #FF5722`
    }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Ranking de Hoteles por Visitas
      </Typography>
      <TableContainer sx={{ maxHeight: 400 }}>
        <Table stickyHeader aria-label="hotel ranking table">
          <TableHead>
            <TableRow>
              <TableCell>Hotel</TableCell>
              <TableCell align="right">Visitas</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.slice(0, 10).map((hotel) => ( // Show top 10
              <TableRow key={hotel.id}>
                <TableCell component="th" scope="row">
                  {hotel.name}
                </TableCell>
                <TableCell align="right">{hotel.visits}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
