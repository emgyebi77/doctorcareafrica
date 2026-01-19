import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { Appointment, Doctor, Patient } from "@/types/healthcare";

export type TimeSlot = {
  time: string;
  available: boolean;
};

export type AppointmentType =
  | "checkup"
  | "consultation"
  | "follow-up"
  | "emergency"
  | "procedure";

interface BookingState {
  selectedDate: Date | undefined;
  selectedTime: string | null;
  selectedDoctor: Doctor | null;
  selectedPatient: Patient | null;
  appointmentType: AppointmentType;
  notes: string;
}

interface AppointmentState {
  appointments: Appointment[];
  doctors: Doctor[];
  booking: BookingState;
  isLoading: boolean;
  error: string | null;

  isBookingModalOpen: boolean;
  isViewModalOpen: boolean;
  selectedAppointment: Appointment | null;

  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Omit<Appointment, "id" | "createdAt">) => Promise<Appointment | null>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  cancelAppointment: (id: string) => Promise<void>;

  setSelectedDate: (date: Date | undefined) => void;
  setSelectedTime: (time: string | null) => void;
  setSelectedDoctor: (doctor: Doctor | null) => void;
  setSelectedPatient: (patient: Patient | null) => void;
  setAppointmentType: (type: AppointmentType) => void;
  setNotes: (notes: string) => void;
  resetBooking: () => void;

  openBookingModal: () => void;
  closeBookingModal: () => void;
  openViewModal: (appointment: Appointment) => void;
  closeViewModal: () => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchAppointments: () => Promise<void>;
  fetchDoctors: () => Promise<void>;

  getAvailableTimeSlots: (date: Date, doctorId: string) => TimeSlot[];
  getAppointmentsByDate: (date: Date) => Appointment[];
}

const initialBookingState: BookingState = {
  selectedDate: undefined,
  selectedTime: null,
  selectedDoctor: null,
  selectedPatient: null,
  appointmentType: "checkup",
  notes: "",
};

const allTimeSlots = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [],
  doctors: [],
  booking: initialBookingState,
  isLoading: false,
  error: null,
  isBookingModalOpen: false,
  isViewModalOpen: false,
  selectedAppointment: null,

  setAppointments: (appointments) => set({ appointments }),

  addAppointment: async (appointmentData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase
        .from("appointments")
        .insert({
          patient_id: appointmentData.patientId,
          doctor_id: appointmentData.doctorId,
          scheduled_date: appointmentData.date,
          scheduled_time: appointmentData.time,
          duration_minutes: appointmentData.duration,
          type: appointmentData.type,
          status: appointmentData.status || "scheduled",
          notes: appointmentData.notes,
          created_by: user.id,
        })
        .select(
          `
          *,
          doctors:doctor_id (first_name, last_name)
        `,
        )
        .single();

      if (error) {
        throw error;
      }

      const newAppointment: Appointment = {
        id: data.id,
        patientId: data.patient_id,
        doctorId: data.doctor_id,
        doctorName: `Dr. ${data.doctors?.first_name || ""} ${data.doctors?.last_name || ""}`.trim(),
        date: data.scheduled_date,
        time: data.scheduled_time,
        duration: data.duration_minutes || 30,
        type: data.type as Appointment["type"],
        status: data.status as Appointment["status"],
        notes: data.notes || undefined,
        createdAt: data.created_at,
      };

      set((state) => ({
        appointments: [...state.appointments, newAppointment],
      }));

      return newAppointment;
    } catch (err) {
      console.error("Error adding appointment:", err);
      set({ error: "Failed to create appointment" });
      return null;
    }
  },

  updateAppointment: async (id, updates) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          scheduled_date: updates.date,
          scheduled_time: updates.time,
          duration_minutes: updates.duration,
          type: updates.type,
          status: updates.status,
          notes: updates.notes,
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      set((state) => ({
        appointments: state.appointments.map((appointment) =>
          appointment.id === id ? { ...appointment, ...updates } : appointment,
        ),
      }));
    } catch (err) {
      console.error("Error updating appointment:", err);
      set({ error: "Failed to update appointment" });
    }
  },

  cancelAppointment: async (id) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) {
        throw error;
      }

      set((state) => ({
        appointments: state.appointments.map((appointment) =>
          appointment.id === id
            ? { ...appointment, status: "cancelled" as const }
            : appointment,
        ),
      }));
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      set({ error: "Failed to cancel appointment" });
    }
  },

  setSelectedDate: (selectedDate) =>
    set((state) => ({
      booking: { ...state.booking, selectedDate, selectedTime: null },
    })),

  setSelectedTime: (selectedTime) =>
    set((state) => ({
      booking: { ...state.booking, selectedTime },
    })),

  setSelectedDoctor: (selectedDoctor) =>
    set((state) => ({
      booking: { ...state.booking, selectedDoctor, selectedTime: null },
    })),

  setSelectedPatient: (selectedPatient) =>
    set((state) => ({
      booking: { ...state.booking, selectedPatient },
    })),

  setAppointmentType: (appointmentType) =>
    set((state) => ({
      booking: { ...state.booking, appointmentType },
    })),

  setNotes: (notes) =>
    set((state) => ({
      booking: { ...state.booking, notes },
    })),

  resetBooking: () => set({ booking: initialBookingState }),

  openBookingModal: () => set({ isBookingModalOpen: true }),
  closeBookingModal: () => set({ isBookingModalOpen: false }),
  openViewModal: (appointment) =>
    set({ isViewModalOpen: true, selectedAppointment: appointment }),
  closeViewModal: () => set({ isViewModalOpen: false, selectedAppointment: null }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchAppointments: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          *,
          doctors:doctor_id (first_name, last_name)
        `,
        )
        .order("scheduled_date", { ascending: true });

      if (error) {
        throw error;
      }

      const appointments: Appointment[] = (data || []).map((appointment) => ({
        id: appointment.id,
        patientId: appointment.patient_id,
        doctorId: appointment.doctor_id,
        doctorName: `Dr. ${appointment.doctors?.first_name || ""} ${appointment.doctors?.last_name || ""}`.trim(),
        date: appointment.scheduled_date,
        time: appointment.scheduled_time,
        duration: appointment.duration_minutes || 30,
        type: appointment.type as Appointment["type"],
        status: appointment.status as Appointment["status"],
        notes: appointment.notes || undefined,
        createdAt: appointment.created_at,
      }));

      set({ appointments, isLoading: false });
    } catch (err) {
      console.error("Error fetching appointments:", err);
      set({ error: "Failed to load appointments", isLoading: false });
    }
  },

  fetchDoctors: async () => {
    try {
      const { data, error } = await supabase
        .from("doctors_public")
        .select("*")
        .eq("is_available", true)
        .order("first_name");

      if (error) {
        throw error;
      }

      const doctors: Doctor[] = (data || []).map((doctor) => ({
        id: doctor.id,
        firstName: doctor.first_name || "",
        lastName: doctor.last_name || "",
        email: "",
        phone: "",
        specialty: doctor.specialization || "",
        avatarUrl: doctor.avatar_url || undefined,
        status: doctor.is_available ? "online" : "offline",
        availability: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      }));

      set({ doctors });
    } catch (err) {
      console.error("Error fetching doctors:", err);
      set({ error: "Failed to load doctors" });
    }
  },

  getAvailableTimeSlots: (date, doctorId) => {
    const { appointments } = get();
    const dateStr = date.toISOString().split("T")[0];

    const bookedTimes = appointments
      .filter(
        (appointment) =>
          appointment.date === dateStr &&
          appointment.doctorId === doctorId &&
          appointment.status !== "cancelled",
      )
      .map((appointment) => appointment.time);

    return allTimeSlots.map((time) => ({
      time,
      available: !bookedTimes.includes(time),
    }));
  },

  getAppointmentsByDate: (date) => {
    const { appointments } = get();
    const dateStr = date.toISOString().split("T")[0];
    return appointments.filter((appointment) => appointment.date === dateStr);
  },
}));
