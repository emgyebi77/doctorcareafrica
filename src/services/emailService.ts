import { supabase } from "@/integrations/supabase/client";

export interface AppointmentEmailPayload {
  type: "appointment_confirmation" | "appointment_reminder" | "appointment_cancelled";
  appointmentId: string;
  recipientEmail: string;
  recipientName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
}

export async function sendAppointmentEmail(
  payload: AppointmentEmailPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("send-appointment-email", {
      body: payload,
    });

    if (error) {
      console.error("Error sending appointment email:", error);
      return { success: false, error: error.message };
    }

    console.log("Appointment email sent:", data);
    return { success: true };
  } catch (err) {
    console.error("Failed to send appointment email:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function sendAppointmentConfirmation(
  appointmentId: string,
  patientEmail: string,
  patientName: string,
  doctorName: string,
  date: string,
  time: string,
  type: string,
): Promise<{ success: boolean; error?: string }> {
  return sendAppointmentEmail({
    type: "appointment_confirmation",
    appointmentId,
    recipientEmail: patientEmail,
    recipientName: patientName,
    doctorName,
    appointmentDate: date,
    appointmentTime: time,
    appointmentType: type,
  });
}

export async function sendAppointmentReminder(
  appointmentId: string,
  patientEmail: string,
  patientName: string,
  doctorName: string,
  date: string,
  time: string,
  type: string,
): Promise<{ success: boolean; error?: string }> {
  return sendAppointmentEmail({
    type: "appointment_reminder",
    appointmentId,
    recipientEmail: patientEmail,
    recipientName: patientName,
    doctorName,
    appointmentDate: date,
    appointmentTime: time,
    appointmentType: type,
  });
}

export async function sendAppointmentCancellation(
  appointmentId: string,
  patientEmail: string,
  patientName: string,
  doctorName: string,
  date: string,
  time: string,
  type: string,
): Promise<{ success: boolean; error?: string }> {
  return sendAppointmentEmail({
    type: "appointment_cancelled",
    appointmentId,
    recipientEmail: patientEmail,
    recipientName: patientName,
    doctorName,
    appointmentDate: date,
    appointmentTime: time,
    appointmentType: type,
  });
}
