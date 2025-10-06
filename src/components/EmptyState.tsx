import { Box, Typography } from '@mui/material';
import React from 'react';

interface EmptyStateProps {
  icon: React.ReactElement;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: 4,
        color: 'text.secondary',
      }}
    >
      {React.cloneElement(icon, { sx: { fontSize: 60, mb: 2 } })}
      <Typography variant="h6" component="p" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2">{subtitle}</Typography>
      )}
    </Box>
  );
}
