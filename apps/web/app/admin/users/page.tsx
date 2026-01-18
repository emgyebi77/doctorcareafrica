export default function AdminUsersPage() {
  return (
    <main>
      <h1>User Management</h1>
      <p>Review and update user status.</p>
      <table>
        <thead>
          <tr>
            <th>User ID</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>user-id</td>
            <td>user@example.com</td>
            <td>PATIENT</td>
            <td>ACTIVE</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
