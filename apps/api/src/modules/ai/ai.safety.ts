const BLOCKLIST = [
  'kill myself',
  'suicide',
  'self-harm',
  'harm myself',
  'bomb',
  'terrorist',
];

const PRESCRIBING_PATTERNS = [
  /prescrib(e|ing)\b/i,
  /recommend (a|an) (medication|drug)\b/i,
  /what (medication|drug) should i take/i,
  /how much .* (should|can) i take/i,
  /(dosage|dose) for\b/i,
  /antibiotic(s)? for\b/i,
];

export interface SafetyResult {
  allowed: boolean;
  reason?: string;
}

export const validateSafety = (content: string): SafetyResult => {
  const normalized = content.toLowerCase();
  if (normalized.length > 5000) {
    return { allowed: false, reason: 'Input too long.' };
  }
  const blocked = BLOCKLIST.find((term) => normalized.includes(term));
  if (blocked) {
    return { allowed: false, reason: `Blocked term detected: ${blocked}` };
  }
  const prescribing = PRESCRIBING_PATTERNS.find((pattern) => pattern.test(normalized));
  if (prescribing) {
    return { allowed: false, reason: 'Prescribing requests are not allowed.' };
  }
  return { allowed: true };
};
