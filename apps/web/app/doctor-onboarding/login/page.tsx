export default function DoctorLoginPage() {
  return (
    <main>
      <h1>Doctor Login</h1>
      <p>Choose phone or email to receive an OTP.</p>
      <form>
        <label htmlFor="channel">Login method</label>
        <select id="channel" name="channel">
          <option value="SMS">Phone</option>
          <option value="EMAIL">Email</option>
        </select>
        <label htmlFor="identifier">Phone or email</label>
        <input id="identifier" name="identifier" placeholder="doctor@example.com" />
        <button type="submit">Send OTP</button>
      </form>
    </main>
  );
}
