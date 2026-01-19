export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  avatarUrl?: string;
  status: "active" | "pending" | "completed" | "cancelled" | "scheduled";
  lastVisit?: string;
  condition?: string;
  address?: string;
  insuranceProvider?: string;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patient?: Patient;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  duration: number;
  type: "checkup" | "consultation" | "follow-up" | "emergency" | "procedure";
  status: "scheduled" | "confirmed" | "in-progress" | "completed" | "cancelled" | "no-show";
  notes?: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  avatarUrl?: string;
  status: "online" | "offline" | "busy" | "away";
  availability: string[];
}

export interface DashboardStats {
  totalPatients: number;
  patientsTrend: number;
  todayAppointments: number;
  appointmentsTrend: number;
  activeCases: number;
  casesTrend: number;
  revenue: number;
  revenueTrend: number;
}

export interface Activity {
  id: string;
  type: "appointment" | "note" | "prescription" | "result" | "message";
  title: string;
  description?: string;
  timestamp: string;
  user?: {
    name: string;
    avatarUrl?: string;
  };
  status?: "active" | "pending" | "completed" | "cancelled" | "scheduled";
}

export interface Notification {
  id: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
