import type { Hotel, Employee } from '../types';

const generateUniqueId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const initialHotels: Hotel[] = [
  { id: generateUniqueId('hotel'), name: 'Grand Hyatt', city: 'New York', address: '109 E 42nd St', latitude: null, longitude: null, imageUrl: null },
  { id: generateUniqueId('hotel'), name: 'The Beverly Hills Hotel', city: 'Los Angeles', address: '9641 Sunset Blvd', latitude: null, longitude: null, imageUrl: null },
  { id: generateUniqueId('hotel'), name: 'Four Seasons', city: 'Chicago', address: '120 E Delaware Pl', latitude: null, longitude: null, imageUrl: null },
];

export const initialEmployees: Employee[] = [
  { id: generateUniqueId('emp'), employeeNumber: 'DA-836429', name: 'John Doe', role: 'Supervisor Housekeeper', hotelId: 'hotel-1', isActive: true, isBlacklisted: false, payrollType: 'Workrecord', lastReviewedTimestamp: null },
  { id: generateUniqueId('emp'), employeeNumber: 'DA-193746', name: 'Jane Smith', role: 'Frontdesk', hotelId: 'hotel-2', isActive: true, isBlacklisted: false, payrollType: 'timesheet', lastReviewedTimestamp: null },
  { id: generateUniqueId('emp'), employeeNumber: 'DA-582610', name: 'Peter Jones', role: 'Housekeeper', hotelId: 'hotel-1', isActive: false, isBlacklisted: false, payrollType: 'Workrecord', lastReviewedTimestamp: null },
  { id: generateUniqueId('emp'), employeeNumber: 'DA-271943', name: 'Mary Williams', role: 'Mantenimiento', hotelId: 'hotel-3', isActive: true, isBlacklisted: false, payrollType: 'timesheet', lastReviewedTimestamp: null },
];