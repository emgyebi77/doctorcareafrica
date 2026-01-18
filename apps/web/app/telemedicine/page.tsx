import Link from 'next/link';

export default function TelemedicineIndexPage() {
  return (
    <main>
      <h1>Telemedicine</h1>
      <p>Prepare for your video visit.</p>
      <ul>
        <li>
          <Link href="/telemedicine/demo-session/precall">Pre-call check</Link>
        </li>
        <li>
          <Link href="/telemedicine/demo-session/call">Join call</Link>
        </li>
        <li>
          <Link href="/telemedicine/demo-session/summary">Post-call summary</Link>
        </li>
      </ul>
    </main>
  );
}
