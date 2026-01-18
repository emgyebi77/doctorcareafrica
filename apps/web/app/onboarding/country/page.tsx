export default function CountrySelectPage() {
  return (
    <main>
      <h1>Select Country</h1>
      <p>Choose your country to set timezone, currency, and locale defaults.</p>
      <form>
        <label htmlFor="country">Country</label>
        <select id="country" name="country">
          <option value="">Select country</option>
        </select>
        <button type="submit">Continue</button>
      </form>
    </main>
  );
}
