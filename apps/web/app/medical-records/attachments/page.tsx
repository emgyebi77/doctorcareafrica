export default function AttachmentsPage() {
  return (
    <main>
      <h1>Attachments</h1>
      <p>Upload lab results and supporting documents.</p>
      <form>
        <label htmlFor="targetId">Record ID</label>
        <input id="targetId" name="targetId" placeholder="record-uuid" />
        <label htmlFor="file">File</label>
        <input id="file" name="file" type="file" />
        <button type="submit">Upload</button>
      </form>
    </main>
  );
}
