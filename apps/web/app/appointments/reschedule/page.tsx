export default function RescheduleAppointmentPage() {
  return (
    <main>
      <h1>Reschedule Appointment</h1>
      <p>Update your appointment to a new time slot.</p>
      <form>
        <label htmlFor="appointmentId">Appointment ID</label>
        <input id="appointmentId" name="appointmentId" placeholder="appointment-uuid" />
        <label htmlFor="timeSlotId">New time slot ID</label>
        <input id="timeSlotId" name="timeSlotId" placeholder="time-slot-uuid" />
        <label htmlFor="reason">Reason</label>
        <input id="reason" name="reason" placeholder="Schedule change" />
        <button type="submit">Reschedule</button>
      </form>
    </main>
  );
}
