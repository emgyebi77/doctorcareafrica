import Link from 'next/link';

export default function MedicalRecordsIndexPage() {
  return (
    <main>
      <h1>Medical Records</h1>
      <p>Manage encounters, prescriptions, and attachments.</p>
      <ul>
        <li>
          <Link href="/medical-records/encounters">Encounters</Link>
        </li>
        <li>
          <Link href="/medical-records/notes">Notes</Link>
        </li>
        <li>
          <Link href="/medical-records/prescriptions">Prescriptions</Link>
        </li>
        <li>
          <Link href="/medical-records/attachments">Attachments</Link>
        </li>
      </ul>
    </main>
  );
}
