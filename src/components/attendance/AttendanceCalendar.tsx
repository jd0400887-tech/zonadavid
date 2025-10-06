import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Paper } from '@mui/material';
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
  resource?: any;
}

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  hotels: Hotel[];
}

export default function AttendanceCalendar({ records, hotels }: AttendanceCalendarProps) {
  const events: CalendarEvent[] = records.map(record => {
    const hotel = hotels.find(h => h.id === record.hotelId);
    return {
      title: hotel?.name || 'Visita',
      start: new Date(record.timestamp),
      end: new Date(record.timestamp),
      allDay: true, // Treat visits as all-day events on the calendar
    };
  });

  return (
    <Paper sx={{ p: 2, height: '70vh' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        culture='es'
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
          noEventsInRange: "No hay visitas en este rango.",
        }}
      />
    </Paper>
  );
}