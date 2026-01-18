const BLOCKLIST = [
  'kill myself',
  'suicide',
  'self-harm',
  'harm myself',
  'bomb',
  'terrorist',
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
  return { allowed: true };
};
