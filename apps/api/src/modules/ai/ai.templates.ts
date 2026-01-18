export const AI_TEMPLATES = {
  symptomGuidance: (payload: {
    symptoms: string;
    duration?: string;
    age?: number;
    context?: string;
  }) =>
    [
      'You are a non-diagnostic symptom guidance assistant.',
      'Provide general, educational guidance without diagnosing.',
      'Advise when to seek urgent care based on red-flag symptoms.',
      `Symptoms: ${payload.symptoms}`,
      payload.duration ? `Duration: ${payload.duration}` : undefined,
      payload.age ? `Age: ${payload.age}` : undefined,
      payload.context ? `Context: ${payload.context}` : undefined,
    ]
      .filter(Boolean)
      .join('\n'),
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
  specialtyRouting: (payload: {
    symptoms: string;
    age?: number;
    context?: string;
    preferredLanguage?: string;
  }) =>
    [
      'You are a specialty routing assistant.',
      'Recommend the most appropriate medical specialty for the symptoms.',
      'Do not diagnose. Provide a brief rationale and urgency flag.',
      `Symptoms: ${payload.symptoms}`,
      payload.age ? `Age: ${payload.age}` : undefined,
      payload.context ? `Context: ${payload.context}` : undefined,
      payload.preferredLanguage ? `Language: ${payload.preferredLanguage}` : undefined,
    ]
      .filter(Boolean)
      .join('\n'),
} as const;

export type AiFeature = keyof typeof AI_TEMPLATES;
