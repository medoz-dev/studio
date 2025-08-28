
'use server';
/**
 * @fileOverview Un assistant IA pour répondre aux questions sur l'application.
 *
 * - askAssistant - La fonction principale pour interagir avec l'assistant.
 * - AssistantInput - Le type d'entrée pour la fonction de l'assistant.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { type Boisson } from '@/lib/data';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const BoissonSchema = z.object({
    nom: z.string(),
    prix: z.number(),
    trous: z.union([z.number(), z.array(z.number())]),
    type: z.enum(["casier", "sachet", "carton", "unite"]),
    special: z.boolean().optional(),
    specialPrice: z.number().optional(),
    specialUnit: z.number().optional(),
});

export const AssistantInputSchema = z.object({
  question: z.string().describe("La question actuelle de l'utilisateur."),
  boissons: z.array(BoissonSchema).describe("La liste des boissons disponibles avec leurs détails."),
  history: z.array(MessageSchema).describe("L'historique de la conversation jusqu'à présent."),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;


export async function askAssistant(input: AssistantInput): Promise<string> {
  const response = await assistantFlow(input);
  return response;
}

const assistantPrompt = ai.definePrompt({
  name: 'assistantPrompt',
  input: { schema: AssistantInputSchema },
  output: { format: 'text' },
  prompt: `
    Tu es un assistant IA expert pour une application de gestion d'inventaire de bar nommée "Inventaire Pro".
    Ton rôle est d'aider les gérants de bar en répondant à leurs questions de manière claire, concise et amicale, en français.
    Tu dois te baser UNIQUEMENT sur les informations fournies ci-dessous. N'invente jamais d'informations.

    CONTEXTE DE L'APPLICATION :
    L'application aide les gérants à suivre leur stock de boissons, les arrivages, et à calculer les ventes.
    
    Voici la liste complète des boissons actuellement gérées dans l'application et leurs informations :
    {{#each boissons}}
    - Nom: {{nom}}
      - Prix de vente unitaire: {{prix}} FCFA
      - Type de conditionnement: {{type}}
      - Unités par conditionnement: {{#if (Array.isArray trous)}}{{join trous ' ou '}}{{else}}{{trous}}{{/if}}
      {{#if special}}
      - Offre spéciale: Oui, vendu par lot de {{specialUnit}} unités pour {{specialPrice}} FCFA.
      {{/if}}
    {{/each}}

    HISTORIQUE DE LA CONVERSATION:
    {{#each history}}
    - {{role}}: {{content}}
    {{/each}}

    INSTRUCTIONS :
    1.  Analyse la question de l'utilisateur (ci-dessous) en tenant compte de l'historique.
    2.  Si la question porte sur le prix ou les détails d'une boisson, utilise la liste des boissons ci-dessus pour trouver la réponse exacte.
    3.  Si tu ne trouves pas une boisson dans la liste, dis-le gentiment. Exemple : "Désolé, je ne trouve pas d'informations sur [nom de la boisson]."
    4.  Si la question est une salutation ou une conversation générale, réponds de manière amicale et professionnelle.
    5.  Garde tes réponses courtes et directes.

    QUESTION DE L'UTILISATEUR:
    "{{{question}}}"
  `,
});


const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await assistantPrompt(input);
    return output!;
  }
);
