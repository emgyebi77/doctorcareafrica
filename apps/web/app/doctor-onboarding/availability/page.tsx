export default function DoctorAvailabilityPage() {
  return (
    <main>
      <h1>Availability Setup</h1>
      <p>Define your working hours for patient bookings.</p>
      <form>
        <label htmlFor="dayOfWeek">Day of week</label>
        <select id="dayOfWeek" name="dayOfWeek">
          <option value="1">Monday</option>
          <option value="2">Tuesday</option>
          <option value="3">Wednesday</option>
          <option value="4">Thursday</option>
          <option value="5">Friday</option>
          <option value="6">Saturday</option>
          <option value="0">Sunday</option>
        </select>
        <label htmlFor="startTime">Start time</label>
        <input id="startTime" name="startTime" type="time" />
        <label htmlFor="endTime">End time</label>
        <input id="endTime" name="endTime" type="time" />
        <button type="submit">Save availability</button>
      </form>
    </main>
  );
}
