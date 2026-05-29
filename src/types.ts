export type Role = 'owner' | 'manager';

export interface Branch {
  id: string;
  name: string;
}

export interface User {
  username: string;
  name: string;
  role: Role;
  branchId?: string; // Optional for owners, required for managers
}

export const branches: Branch[] = [
  { id: 'chandni', name: 'Chandni Branch' },
  { id: 'new-market', name: 'New Market Branch' },
];

export const users: (User & { password: string })[] = [
  { 
    username: 'pretti_pillay8426', 
    password: 'Vpsalon@pp-8426', 
    name: 'Pretti Pillay', 
    role: 'owner' 
  },
  { 
    username: 'feroz_beg6248', 
    password: 'vPsalon-fb@123456', 
    name: 'Feroz Beg', 
    role: 'owner' 
  },
  { 
    username: 'humaira-hafiz', 
    password: 'vp-humaira-882', 
    name: 'Humaira Hafiz', 
    role: 'manager', 
    branchId: 'chandni' 
  },
  { 
    username: 'rakshita-new', 
    password: 'rak-oxy-8422', 
    name: 'Rakshita', 
    role: 'manager', 
    branchId: 'new-market' 
  },
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

