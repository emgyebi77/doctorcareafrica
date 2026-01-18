import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <main>
      <h1>Admin Dashboard</h1>
      <p>Manage users, approvals, payments, and configuration.</p>
      <ul>
        <li>
          <Link href="/admin/users">User management</Link>
        </li>
        <li>
          <Link href="/admin/doctors">Doctor approvals</Link>
        </li>
        <li>
          <Link href="/admin/appointments">Appointments</Link>
        </li>
        <li>
          <Link href="/admin/payments">Payments</Link>
        </li>
        <li>
          <Link href="/admin/countries">Country configuration</Link>
        </li>
        <li>
          <Link href="/admin/analytics">Analytics</Link>
        </li>
      </ul>
    </main>
  );
}
