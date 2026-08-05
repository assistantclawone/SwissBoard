// src/ai/flows/moderate-content-for-compliance.ts
'use server';
/**
 * @fileOverview Implementiert die Inhaltsmoderation für Texte und prüft auf schädliche, urheberrechtlich geschützte oder illegale Inhalte, um die Einhaltung der ECAP-Richtlinien und der Schweizer Gesetze sicherzustellen.
 *
 * - moderateContent - Eine Funktion, die Textinhalte moderiert.
 * - ModerateContentInput - Der Eingabetyp für die moderateContent-Funktion.
 * - ModerateContentOutput - Der Rückgabetyp für die moderateContent-Funktion.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateContentInputSchema = z.object({
  text: z.string().describe('Der zu moderierende Textinhalt.'),
});
export type ModerateContentInput = z.infer<typeof ModerateContentInputSchema>;

const ModerateContentOutputSchema = z.object({
  isCompliant: z.boolean().describe('Ob der Inhalt den ECAP-Richtlinien und den Schweizer Gesetzen entspricht.'),
  reason: z.string().describe('Der Grund für die Nichteinhaltung, falls vorhanden.'),
});
export type ModerateContentOutput = z.infer<typeof ModerateContentOutputSchema>;

export async function moderateContent(input: ModerateContentInput): Promise<ModerateContentOutput> {
  return moderateContentFlow(input);
}

const moderateContentPrompt = ai.definePrompt({
  name: 'moderateContentPrompt',
  input: {schema: ModerateContentInputSchema},
  output: {schema: ModerateContentOutputSchema},
  prompt: `Sie sind ein KI-Inhaltsmoderator für ECAP, eine Schweizer Bildungsorganisation. Ihre Aufgabe ist es zu bestimmen, ob der angegebene Text den Inhaltsrichtlinien von ECAP und den Schweizer Gesetzen entspricht.

  Die Inhaltsrichtlinien umfassen:
  - Keine Hassrede oder Diskriminierung
  - Keine Urheberrechtsverletzung
  - Keine illegalen Inhalte (z. B. Anstiftung zur Gewalt, Verleumdung)
  - Muss den Schweizer Datenschutzgesetzen entsprechen

  Antworten Sie, ob der Inhalt konform ist, und geben Sie einen Grund an, wenn dies nicht der Fall ist.

  Text: {{{text}}}
  `, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_CIVIC_INTEGRITY',
        threshold: 'BLOCK_ONLY_HIGH',
      }
    ],
  },
});

const moderateContentFlow = ai.defineFlow(
  {
    name: 'moderateContentFlow',
    inputSchema: ModerateContentInputSchema,
    outputSchema: ModerateContentOutputSchema,
  },
  async input => {
    const {output} = await moderateContentPrompt(input);
    return output!;
  }
);
