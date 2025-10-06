import { Card, Typography, Box, Avatar, CardActionArea } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color?: string;
  onClick?: () => void;
}

export default function StatCard({ title, value, icon, color = 'primary.main', onClick }: StatCardProps) {
  const cardContent = (
    <Box sx={{ display: 'flex', alignItems: 'center', p: 2, width: '100%' }}>
      <Avatar sx={{ bgcolor: color, width: 56, height: 56, mr: 2 }}>
        {icon}
      </Avatar>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{value}</Typography>
        <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
      </Box>
    </Box>
  );

  return (
    <Card sx={{
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      border: '1px solid',
      borderColor: 'primary.main',
      boxShadow: `0 0 5px #FF5722, 0 0 10px #FF5722`,
      height: '100%'
    }}>
      {onClick ? (
        <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
          {cardContent}
        </CardActionArea>
      ) : (
        cardContent
      )}
    </Card>
  );
}
