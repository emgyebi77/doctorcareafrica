import Link from 'next/link';

export default function OnboardingIndexPage() {
  return (
    <main>
      <h1>Patient Onboarding</h1>
      <p>Start your onboarding flow.</p>
      <ul>
        <li>
          <Link href="/onboarding/country">Select country</Link>
        </li>
        <li>
          <Link href="/onboarding/phone">Phone login</Link>
        </li>
        <li>
          <Link href="/onboarding/otp">OTP verification</Link>
        </li>
        <li>
          <Link href="/onboarding/profile">Profile setup</Link>
        </li>
        <li>
          <Link href="/onboarding/emergency">Emergency contact</Link>
        </li>
        <li>
          <Link href="/onboarding/history">Medical history</Link>
        </li>
      </ul>
    </main>
  );
}
