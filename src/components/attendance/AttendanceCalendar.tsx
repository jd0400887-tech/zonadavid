import { Calendar, dateFnsLocalizer, EventProps } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { es } from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Paper, Box, Typography, Avatar, useTheme } from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import type { AttendanceRecord, Hotel } from '../../types';

const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  hotel?: Hotel;
}

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  hotels: Hotel[];
}

const CustomEvent = ({ event }: EventProps<CalendarEvent>) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 0.5, 
    px: 0.5,
    overflow: 'hidden'
  }}>
    <ApartmentIcon sx={{ fontSize: 14 }} />
    <Typography variant="caption" sx={{ 
      fontWeight: 'bold', 
      whiteSpace: 'nowrap', 
      overflow: 'hidden', 
      textOverflow: 'ellipsis',
      fontSize: '0.7rem'
    }}>
      {event.title}
    </Typography>
  </Box>
);

export default function AttendanceCalendar({ records, hotels }: AttendanceCalendarProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  const events: CalendarEvent[] = records.map(record => {
    const hotel = hotels.find(h => h.id === record.hotelId);
    const date = new Date(record.timestamp);
    return {
      title: hotel?.name || 'Visita',
      start: date,
      end: date,
      allDay: true,
      hotel
    };
  });

  const eventStyleGetter = () => {
    return {
      style: {
        backgroundColor: '#FF5722',
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
        boxShadow: '0 2px 4px rgba(255, 87, 34, 0.3)',
        fontSize: '0.8rem'
      }
    };
  };

  return (
    <Paper sx={{ 
      p: 2, 
      height: '75vh', 
      borderRadius: 4,
      border: '1px solid rgba(255,255,255,0.05)',
      backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.02)',
      '& .rbc-calendar': {
        fontFamily: theme.typography.fontFamily,
      },
      '& .rbc-header': {
        py: 1,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: '0.75rem',
        color: 'text.secondary'
      },
      '& .rbc-off-range-bg': {
        backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.01)'
      },
      '& .rbc-today': {
        backgroundColor: 'rgba(255, 87, 34, 0.05)'
      }
    }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        culture='es'
        eventPropGetter={eventStyleGetter}
        components={{
          event: CustomEvent
        }}
        messages={{
          next: "Siguiente",
          previous: "Anterior",
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Día",
          agenda: "Agenda",
          date: "Fecha",
          time: "Hora",
          event: "Evento",
          noEventsInRange: "No hay visitas registradas.",
        }}
      />
    </Paper>
  );
}