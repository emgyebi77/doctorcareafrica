export default function OtpVerifyPage() {
  return (
    <main>
      <h1>Verify OTP</h1>
      <p>Enter the code sent to your phone.</p>
      <form>
        <label htmlFor="otp">OTP code</label>
        <input id="otp" name="otp" placeholder="123456" />
        <button type="submit">Verify</button>
      </form>
    </main>
  );
}
