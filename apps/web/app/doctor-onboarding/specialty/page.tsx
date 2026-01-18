export default function DoctorSpecialtyPage() {
  return (
    <main>
      <h1>Specialty</h1>
      <p>Select your specialty and add license details.</p>
      <form>
        <label htmlFor="specialty">Specialty</label>
        <input id="specialty" name="specialty" placeholder="Cardiology" />
        <label htmlFor="licenseNumber">License number</label>
        <input id="licenseNumber" name="licenseNumber" placeholder="DOC-12345" />
        <label htmlFor="yearsExperience">Years of experience</label>
        <input id="yearsExperience" name="yearsExperience" type="number" min="0" />
        <button type="submit">Save and continue</button>
      </form>
    </main>
  );
}
