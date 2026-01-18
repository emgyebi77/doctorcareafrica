export default function EncountersPage() {
  return (
    <main>
      <h1>Encounters</h1>
      <p>Document patient encounters and visit notes.</p>
      <form>
        <label htmlFor="patientId">Patient ID</label>
        <input id="patientId" name="patientId" placeholder="patient-uuid" />
        <label htmlFor="occurredAt">Date</label>
        <input id="occurredAt" name="occurredAt" type="datetime-local" />
        <label htmlFor="chiefComplaint">Chief complaint</label>
        <input id="chiefComplaint" name="chiefComplaint" placeholder="Headache" />
        <label htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={4} />
        <button type="submit">Save encounter</button>
      </form>
    </main>
  );
}
