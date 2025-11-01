import { Card, Typography, Box, Avatar, CardActionArea, useTheme } from '@mui/material';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color?: string;
  onClick?: () => void;
  trendData?: number[];
}

export default function StatCard({ title, value, icon, color = 'primary.main', onClick, trendData }: StatCardProps) {
  const theme = useTheme();

  const resolveThemeColor = (colorString: string) => {
    const colorPath = colorString.split('.');
    let resolvedColor: any = theme.palette;
    for (const key of colorPath) {
      if (resolvedColor && typeof resolvedColor === 'object' && key in resolvedColor) {
        resolvedColor = resolvedColor[key];
      } else {
        return colorString; // Fallback to the original string if path is invalid
      }
    }
    return typeof resolvedColor === 'string' ? resolvedColor : colorString;
  };

  const lineChartColor = resolveThemeColor(color);

  const chartData = trendData?.map((v, i) => ({ name: `Day ${i}`, value: v }));
  const domain = chartData ? [Math.min(...chartData.map(d => d.value)) - 1, Math.max(...chartData.map(d => d.value)) + 1] : [];

  const cardContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2, height: '100%', textAlign: 'center' }}>
      <Avatar sx={{ bgcolor: color, width: 48, height: 48, mb: 1.5 }}>
        {icon}
      </Avatar>
      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{value}</Typography>
      <Typography variant="subtitle1" color="text.secondary">{title}</Typography>
      {chartData && (
        <Box sx={{ width: '100%', height: 40, mt: 1 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <YAxis hide domain={domain} />
              <Line type="monotone" dataKey="value" stroke={lineChartColor} strokeWidth={3} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
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
