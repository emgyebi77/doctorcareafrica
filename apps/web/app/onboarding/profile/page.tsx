export default function ProfileSetupPage() {
  return (
    <main>
      <h1>Profile Setup</h1>
      <p>Tell us about yourself.</p>
      <form>
        <label htmlFor="firstName">First name</label>
        <input id="firstName" name="firstName" />
        <label htmlFor="lastName">Last name</label>
        <input id="lastName" name="lastName" />
        <label htmlFor="dateOfBirth">Date of birth</label>
        <input id="dateOfBirth" name="dateOfBirth" type="date" />
        <label htmlFor="gender">Gender</label>
        <select id="gender" name="gender">
          <option value="">Select gender</option>
          <option value="FEMALE">Female</option>
          <option value="MALE">Male</option>
          <option value="OTHER">Other</option>
          <option value="UNKNOWN">Prefer not to say</option>
        </select>
        <button type="submit">Save and continue</button>
      </form>
    </main>
  );
}
