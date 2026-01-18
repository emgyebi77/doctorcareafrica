export default function PrescriptionsPage() {
  return (
    <main>
      <h1>Prescriptions</h1>
      <p>Create prescriptions for patient encounters.</p>
      <form>
        <label htmlFor="encounterId">Encounter ID</label>
        <input id="encounterId" name="encounterId" placeholder="encounter-uuid" />
        <label htmlFor="medicationName">Medication</label>
        <input id="medicationName" name="medicationName" placeholder="Amoxicillin" />
        <label htmlFor="dosage">Dosage</label>
        <input id="dosage" name="dosage" placeholder="500mg" />
        <label htmlFor="frequency">Frequency</label>
        <input id="frequency" name="frequency" placeholder="Twice daily" />
        <button type="submit">Save prescription</button>
      </form>
    </main>
  );
}
