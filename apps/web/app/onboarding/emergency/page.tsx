export default function EmergencyContactPage() {
  return (
    <main>
      <h1>Emergency Contact</h1>
      <p>Add someone we can contact in case of emergency.</p>
      <form>
        <label htmlFor="contactName">Contact name</label>
        <input id="contactName" name="contactName" />
        <label htmlFor="contactPhone">Contact phone</label>
        <input id="contactPhone" name="contactPhone" placeholder="+23300000001" />
        <button type="submit">Save and continue</button>
      </form>
    </main>
  );
}
