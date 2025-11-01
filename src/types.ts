export interface Hotel {
  id: string;
  name: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  activeEmployees?: number;
  totalEmployees?: number;
}

export interface Employee {
  id: string; // Internal unique ID
  employeeNumber: string; // User-facing employee number
  name: string;
  hotelId: string;
  isActive: boolean;
  role: string;
  isBlacklisted: boolean;
  payrollType: 'timesheet' | 'Workrecord';
  lastReviewedTimestamp: string | null;
  overtime?: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  hotelId: string;
  timestamp: number; // Unix timestamp
}

export interface StaffingRequest {
  id: number;
  created_at: string;
  hotel_id: string;
  hotelName?: string; // From the join
  request_type: 'permanente' | 'temporal';
  num_of_people: number;
  role: string;
  start_date: string;
  status: 'Pendiente' | 'Enviada a Reclutamiento' | 'En Proceso' | 'Completada' | 'Completada Parcialmente' | 'Cancelada por Hotel' | 'Candidato No Presentado' | 'Vencida';
  completed_at?: string | null;
  notes?: string | null;
}

export interface StaffingRequestHistory {
  id: number;
  created_at: string;
  request_id: number;
  changed_by: string;
  change_description: string;
}

// Force cache invalidation 2025-10-03