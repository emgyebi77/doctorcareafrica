export const AI_TEMPLATES = {
  triage: (payload: { symptoms: string; duration?: string; age?: number; gender?: string }) =>
    [
      'You are a clinical triage assistant.',
      `Symptoms: ${payload.symptoms}`,
      payload.duration ? `Duration: ${payload.duration}` : undefined,
      payload.age ? `Age: ${payload.age}` : undefined,
      payload.gender ? `Gender: ${payload.gender}` : undefined,
      'Provide triage guidance and urgency level.',
    ]
      .filter(Boolean)
      .join('\n'),
  summary: (payload: { notes: string }) =>
    [
      'You are a clinical documentation assistant.',
      'Summarize the encounter notes in a concise, structured format.',
      `Notes: ${payload.notes}`,
    ].join('\n'),
  followup: (payload: { plan: string }) =>
    [
      'You are a care coordination assistant.',
      'Generate follow-up instructions for the patient.',
      `Plan: ${payload.plan}`,
    ].join('\n'),
  education: (payload: { topic: string; language?: string }) =>
    [
      'You are a patient education assistant.',
      `Topic: ${payload.topic}`,
      payload.language ? `Language: ${payload.language}` : undefined,
      'Explain the topic in simple, patient-friendly terms.',
    ]
      .filter(Boolean)
      .join('\n'),
  translate: (payload: { text: string; targetLanguage: string }) =>
    [
      'You are a medical translation assistant.',
      `Target language: ${payload.targetLanguage}`,
      `Text: ${payload.text}`,
    ].join('\n'),
} as const;

export type AiFeature = keyof typeof AI_TEMPLATES;
