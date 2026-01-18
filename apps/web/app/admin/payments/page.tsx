export default function AdminPaymentsPage() {
  return (
    <main>
      <h1>Payment Monitoring</h1>
      <p>Review payments, refunds, and webhook events.</p>
      <table>
        <thead>
          <tr>
            <th>Payment ID</th>
            <th>Provider</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>payment-id</td>
            <td>MOMO</td>
            <td>PENDING</td>
            <td>50 GHS</td>
            <td>Pending</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
