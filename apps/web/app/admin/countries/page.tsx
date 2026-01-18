export default function AdminCountriesPage() {
  return (
    <main>
      <h1>Country Configuration</h1>
      <p>Manage countries, regions, and cities.</p>
      <form>
        <label htmlFor="countryName">Country name</label>
        <input id="countryName" name="countryName" placeholder="Ghana" />
        <label htmlFor="currency">Currency</label>
        <input id="currency" name="currency" placeholder="GHS" />
        <label htmlFor="timezone">Timezone</label>
        <input id="timezone" name="timezone" placeholder="Africa/Accra" />
        <button type="submit">Save country</button>
      </form>
    </main>
  );
}
