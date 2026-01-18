export default function PreCallCheckPage() {
  return (
    <main>
      <h1>Pre-call Device Check</h1>
      <p>Confirm camera, microphone, and network before joining.</p>
      <section>
        <h2>Camera preview</h2>
        <div aria-label="camera-preview">Camera preview placeholder</div>
      </section>
      <section>
        <h2>Microphone</h2>
        <label htmlFor="mic-select">Microphone</label>
        <select id="mic-select" name="mic-select">
          <option value="">Default microphone</option>
        </select>
      </section>
      <section>
        <h2>Camera</h2>
        <label htmlFor="camera-select">Camera</label>
        <select id="camera-select" name="camera-select">
          <option value="">Default camera</option>
        </select>
      </section>
      <button type="button">Join call</button>
    </main>
  );
}
