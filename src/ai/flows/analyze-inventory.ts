
'use server';
/**
 * @fileOverview Flow d'IA pour analyser un rapport d'inventaire.
 *
 * - analyzeInventory - Fonction qui lance l'analyse d'un rapport d'inventaire.
 * - AnalyzeInventoryInput - Le type d'entrée pour la fonction.
 * - AnalyzeInventoryOutput - Le type de retour pour la fonction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { HistoryEntry } from '@/lib/types'; // Assurez-vous que ce chemin est correct

// Nous n'avons pas besoin d'exporter le schéma d'entrée si nous utilisons un type existant.
export type AnalyzeInventoryInput = HistoryEntry;

const AnalyzeInventoryOutputSchema = z.object({
  performanceSummary: z.string().describe("Un résumé court et percutant de la performance de l'inventaire (2-3 phrases). Mentionne le résultat final (manquant, surplus, bon) et ce que cela signifie."),
  recommendations: z.array(z.string()).describe("Une liste de 2 ou 3 recommandations concrètes et actionnables pour le gérant. Ex: 'Surveiller le stock de X', 'Envisager une promotion sur Y', etc."),
  pointsToWatch: z.string().describe("Un point d'attention principal ou un risque identifié, comme un manquant important, un produit qui ne se vend pas, ou une rupture de stock imminente."),
});
export type AnalyzeInventoryOutput = z.infer<typeof AnalyzeInventoryOutputSchema>;

export async function analyzeInventory(input: AnalyzeInventoryInput): Promise<AnalyzeInventoryOutput> {
  // Simplifions l'input pour l'IA pour ne pas envoyer des objets trop complexes
  const simplifiedInput = {
    date: input.date,
    managerName: input.managerName,
    finalResult: input.finalResult,
    theoreticalSales: input.theoreticalSales,
    encaissement: input.encaissement,
    totalExpenses: input.totalExpenses,
    stockDetails: input.stockDetails.map(d => ({ nom: d.boisson.nom, quantite: d.quantity, valeur: d.value })),
  };
  return analyzeInventoryFlow(simplifiedInput);
}

const prompt = ai.definePrompt({
  name: 'analyzeInventoryPrompt',
  input: { schema: z.any() },
  output: { schema: AnalyzeInventoryOutputSchema },
  prompt: `Tu es un expert en gestion de bar et restaurant. Ton rôle est d'analyser le rapport d'inventaire suivant et de fournir des conseils clairs et utiles au gérant. Sois direct, encourageant et professionnel. Utilise des devises en FCFA.

  Voici les données de l'inventaire du {{date}} géré par {{managerName}}:
  - Résultat final: {{finalResult}} FCFA (un nombre négatif est un manquant, positif est un surplus)
  - Ventes théoriques: {{theoreticalSales}} FCFA
  - Montant encaissé: {{encaissement}} FCFA
  - Dépenses totales: {{totalExpenses}} FCFA
  
  Détails du stock restant:
  {{#each stockDetails}}
  - {{nom}}: {{quantite}} unités, valeur de {{valeur}} FCFA
  {{/each}}
  
  Analyse ces informations et fournis :
  1.  Un résumé de la performance.
  2.  Une liste de recommandations concrètes.
  3.  Un point d'attention principal.
  
  Adopte un ton professionnel mais simple à comprendre pour un gérant de bar.`,
});

const analyzeInventoryFlow = ai.defineFlow(
  {
    name: 'analyzeInventoryFlow',
    inputSchema: z.any(),
    outputSchema: AnalyzeInventoryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

    