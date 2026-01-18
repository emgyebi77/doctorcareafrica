export default function AdminAppointmentsPage() {
  return (
    <main>
      <h1>Appointment Oversight</h1>
      <p>Track upcoming and completed appointments.</p>
      <table>
        <thead>
          <tr>
            <th>Appointment ID</th>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>appointment-id</td>
            <td>Patient Name</td>
            <td>Doctor Name</td>
            <td>SCHEDULED</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
