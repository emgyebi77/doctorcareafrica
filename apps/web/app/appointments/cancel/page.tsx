export default function CancelAppointmentPage() {
  return (
    <main>
      <h1>Cancel Appointment</h1>
      <p>Cancel a scheduled appointment.</p>
      <form>
        <label htmlFor="appointmentId">Appointment ID</label>
        <input id="appointmentId" name="appointmentId" placeholder="appointment-uuid" />
        <label htmlFor="reason">Reason</label>
        <input id="reason" name="reason" placeholder="Unable to attend" />
        <button type="submit">Cancel appointment</button>
      </form>
    </main>
  );
}
