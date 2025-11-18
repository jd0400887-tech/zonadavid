import React, { useMemo } from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { Box, Typography, Paper } from '@mui/material';

// --- Helper Functions ---

// Function to get color based on turnover rate
const getColor = (rate: number) => {
  if (rate > 50) return '#E57373'; // A less intense red
  if (rate > 30) return '#FFB74D'; // A more muted orange
  if (rate > 15) return '#FFF176'; // A softer yellow
  return '#81C784'; // A more subtle green
};

// --- Custom Tooltip ---
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, turnoverRate, separations, size } = payload[0].payload;
    return (
      <Paper sx={{ p: 1, backgroundColor: '#000', border: '1px solid #FF5722' }}>
        <Typography sx={{ fontWeight: 'bold', color: '#FF5722' }}>{name}</Typography>
        <Typography variant="body2" sx={{ color: '#FF5722' }}>Tasa de Rotación: {turnoverRate.toFixed(1)}%</Typography>
        <Typography variant="body2" sx={{ color: '#FF5722' }}>Separaciones: {separations}</Typography>
        <Typography variant="body2" sx={{ color: '#FF5722' }}>Promedio Empleados: {size.toFixed(1)}</Typography>
      </Paper>
    );
  }
  return null;
};


// --- Custom Content Renderer for Treemap ---

const CustomizedContent = (props: any) => {
  const { depth, x, y, width, height, name, turnoverRate, separations } = props;

  // Only render the leaf nodes which are at depth 1 and have data
  if (depth !== 1 || turnoverRate === undefined) {
    return null;
  }

  // Simple heuristic to check if text will fit
  const isTextVisible = width > 80 && height > 50;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: getColor(turnoverRate),
          stroke: '#fff',
          strokeWidth: 2,
          strokeOpacity: 1,
        }}
      />
      {isTextVisible && (
        <foreignObject x={x + 5} y={y + 5} width={width - 10} height={height - 10}>
          <Box sx={{ 
            color: '#111', 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}>
            <Typography sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
              {name}
            </Typography>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 'bold', my: 0.5 }}>
              {turnoverRate.toFixed(1)}%
            </Typography>
            <Typography sx={{ fontSize: '0.7rem' }}>
              ({separations} {separations === 1 ? 'separación' : 'separaciones'})
            </Typography>
          </Box>
        </foreignObject>
      )}
    </g>
  );
};

// --- Main Treemap Component ---

interface TurnoverTreemapProps {
  data: {
    hotelId: string;
    hotelName: string;
    turnoverRate: number;
    separations: number;
    avgEmployees: number;
  }[];
}

const TurnoverTreemap: React.FC<TurnoverTreemapProps> = ({ data }) => {
  const treemapData = useMemo(() => {
    return data
      .filter(item => item.avgEmployees > 0) // Treemap can't render items with size 0
      .map(item => ({
        name: item.hotelName,
        size: item.avgEmployees,
        turnoverRate: item.turnoverRate,
        separations: item.separations,
      }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <Treemap
        data={treemapData}
        dataKey="size"
        ratio={4 / 3}
        stroke="#fff"
        fill="#8884d8"
        content={<CustomizedContent />}
        isAnimationActive={false} // Disable animation
      >
        <Tooltip content={<CustomTooltip />} />
      </Treemap>
    </ResponsiveContainer>
  );
};

export default TurnoverTreemap;
