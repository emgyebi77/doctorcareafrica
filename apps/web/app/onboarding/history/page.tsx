export default function MedicalHistoryPage() {
  return (
    <main>
      <h1>Medical History</h1>
      <p>Share allergies, conditions, and medications.</p>
      <form>
        <label htmlFor="allergies">Allergies</label>
        <input id="allergies" name="allergies" placeholder="Pollen, Penicillin" />
        <label htmlFor="conditions">Conditions</label>
        <input id="conditions" name="conditions" placeholder="Asthma" />
        <label htmlFor="medications">Medications</label>
        <input id="medications" name="medications" placeholder="Albuterol" />
        <button type="submit">Finish onboarding</button>
      </form>
    </main>
  );
}
