export type Role = 'owner' | 'manager';

export interface Branch {
  id: string;
  name: string;
}

export interface User {
  username: string;
  name: string;
  role: Role;
}

export const branches: Branch[] = [
  { id: 'trendz', name: 'Trendz Salon' },
];

export const users: (User & { password: string })[] = [
  { 
    username: 'wasif-admin', 
    password: 'Trendzsalon@GR1234', 
    name: 'Wasif', 
    role: 'owner' 
  }
];

export interface Appointment {
  id: string;
  clientName: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  service: string;
  status: 'booked' | 'completed' | 'rescheduled' | 'cancelled';
  price: number;
}


