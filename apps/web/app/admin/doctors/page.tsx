export default function AdminDoctorsPage() {
  return (
    <main>
      <h1>Doctor Approvals</h1>
      <p>Review pending doctor onboarding submissions.</p>
      <table>
        <thead>
          <tr>
            <th>Doctor</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Dr. Mensah</td>
            <td>SUBMITTED</td>
            <td>Pending</td>
            <td>
              <button type="button">Approve</button>
              <button type="button">Reject</button>
            </td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
