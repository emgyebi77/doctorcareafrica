export default function PhoneLoginPage() {
  return (
    <main>
      <h1>Phone Login</h1>
      <p>Enter your phone number to receive an OTP.</p>
      <form>
        <label htmlFor="phone">Phone number</label>
        <input id="phone" name="phone" placeholder="+23300000000" />
        <button type="submit">Send OTP</button>
      </form>
    </main>
  );
}
