export default function PostCallSummaryPage() {
  return (
    <main>
      <h1>Post-call Summary</h1>
      <p>Capture notes and next steps after the visit.</p>
      <form>
        <label htmlFor="summary">Summary</label>
        <textarea id="summary" name="summary" rows={6} />
        <label htmlFor="followUp">Follow-up instructions</label>
        <textarea id="followUp" name="followUp" rows={4} />
        <button type="submit">Save summary</button>
      </form>
    </main>
  );
}
