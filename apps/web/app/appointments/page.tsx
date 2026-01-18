import Link from 'next/link';

export default function AppointmentsIndexPage() {
  return (
    <main>
      <h1>Appointments</h1>
      <p>Manage appointments and scheduling.</p>
      <ul>
        <li>
          <Link href="/appointments/availability">Doctor availability</Link>
        </li>
        <li>
          <Link href="/appointments/book">Book appointment</Link>
        </li>
        <li>
          <Link href="/appointments/reschedule">Reschedule appointment</Link>
        </li>
        <li>
          <Link href="/appointments/cancel">Cancel appointment</Link>
        </li>
      </ul>
    </main>
  );
}
