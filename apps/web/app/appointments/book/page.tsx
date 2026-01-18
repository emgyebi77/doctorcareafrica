export default function BookAppointmentPage() {
  return (
    <main>
      <h1>Book Appointment</h1>
      <p>Select a time slot and book a visit.</p>
      <form>
        <label htmlFor="timeSlotId">Time slot ID</label>
        <input id="timeSlotId" name="timeSlotId" placeholder="time-slot-uuid" />
        <label htmlFor="type">Appointment type</label>
        <select id="type" name="type">
          <option value="IN_PERSON">In person</option>
          <option value="VIDEO">Video</option>
          <option value="HOME_VISIT">Home visit</option>
        </select>
        <label htmlFor="reason">Reason</label>
        <input id="reason" name="reason" placeholder="Consultation" />
        <button type="submit">Book appointment</button>
      </form>
    </main>
  );
}
