export interface Hotel {
  id: string;
  name: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
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

// Force cache invalidation 2025-10-03