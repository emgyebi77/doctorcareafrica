export default function DoctorDocumentsPage() {
  return (
    <main>
      <h1>Document Upload</h1>
      <p>Upload your license and identification documents.</p>
      <form>
        <label htmlFor="docType">Document type</label>
        <select id="docType" name="docType">
          <option value="LICENSE">License</option>
          <option value="ID_CARD">ID card</option>
          <option value="CERTIFICATE">Certificate</option>
          <option value="PROOF_OF_ADDRESS">Proof of address</option>
          <option value="OTHER">Other</option>
        </select>
        <label htmlFor="file">File</label>
        <input id="file" name="file" type="file" />
        <button type="submit">Upload</button>
      </form>
    </main>
  );
}
