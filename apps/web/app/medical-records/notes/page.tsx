export default function NotesPage() {
  return (
    <main>
      <h1>Notes</h1>
      <p>Review and update clinical notes.</p>
      <form>
        <label htmlFor="note">Note</label>
        <textarea id="note" name="note" rows={6} />
        <button type="submit">Save note</button>
      </form>
    </main>
  );
}
