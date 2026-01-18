export default function TelemedicineCallPage() {
  return (
    <main>
      <h1>Video Visit</h1>
      <div>
        <section>
          <h2>Call</h2>
          <div aria-label="jitsi-iframe">Jitsi IFrame placeholder</div>
          <div>
            <button type="button">Mute</button>
            <button type="button">Camera</button>
            <button type="button">Chat</button>
            <button type="button">Share screen</button>
          </div>
        </section>
        <aside>
          <h2>Patient Info</h2>
          <ul>
            <li>Name: Pending</li>
            <li>Appointment time: Pending</li>
            <li>Reason: Pending</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
