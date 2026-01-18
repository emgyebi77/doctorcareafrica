import Link from 'next/link';

export default function DoctorOnboardingIndexPage() {
  return (
    <main>
      <h1>Doctor Onboarding</h1>
      <p>Complete your onboarding to start receiving appointments.</p>
      <ul>
        <li>
          <Link href="/doctor-onboarding/login">Phone or email login</Link>
        </li>
        <li>
          <Link href="/doctor-onboarding/otp">OTP verification</Link>
        </li>
        <li>
          <Link href="/doctor-onboarding/specialty">Specialty selection</Link>
        </li>
        <li>
          <Link href="/doctor-onboarding/documents">Document upload</Link>
        </li>
        <li>
          <Link href="/doctor-onboarding/availability">Availability setup</Link>
        </li>
        <li>
          <Link href="/doctor-onboarding/status">Approval status</Link>
        </li>
      </ul>
    </main>
  );
}
