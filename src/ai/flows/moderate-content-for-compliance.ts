/**
 * Lokale Inhaltsmoderation (datenschutzkonform, offline).
 *
 * Ersetzt die frühere Genkit/Google-KI-Moderation durch eine rein lokale,
 * regelbasierte Prüfung. Keine externe KI, kein Server, keine Daten verlassen
 * den Browser. Erfüllt das ECAP/Schweizer-Datenschutzziel.
 *
 * Die frühere KI-Moderation (Genkit + Google Gemini) entfällt bewusst, weil sie
 * US-Server einbeziehen würde und einen API-Key benötigt.
 */

export type ModerateContentInput = {
  text: string;
};

export type ModerateContentOutput = {
  isCompliant: boolean;
  reason: string;
};

/** Einfache schwarze Liste für offensichtlich problematische Begriffe (lokal geprüft). */
const BLOCKED_PATTERNS: RegExp[] = [
  /\b(vollidiot|hurensohn|fickt?e|vergewalti)\b/i,
  /\b(ss|nsdap|he?il hitler)\b/i,
];

/**
 * Moderiert Textinhalte rein lokal. Prüft auf offensichtliche
 * Hatespeech-/Diskriminierungsmuster. Alles andere gilt als konform.
 */
export async function moderateContent(input: ModerateContentInput): Promise<ModerateContentOutput> {
  const text = input?.text ?? '';

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isCompliant: false,
        reason:
          'Der Inhalt enthält eine Formulierung, die gegen die ECAP-Inhaltsrichtlinien verstossen könnte (Hatespeech/Diskriminierung). Bitte überarbeiten Sie Ihren Beitrag.',
      };
    }
  }

  return {
    isCompliant: true,
    reason: '',
  };
}
