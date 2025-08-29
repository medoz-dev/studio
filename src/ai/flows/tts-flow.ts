
'use server';
/**
 * @fileOverview Un service de synthèse vocale (Text-to-Speech).
 *
 * - textToSpeech - Convertit une chaîne de texte en un fichier audio.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const TextToSpeechOutputSchema = z.object({
  media: z.string().describe("L'audio au format data URI WAV."),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(text: string): Promise<TextToSpeechOutput> {
    return textToSpeechFlow(text);
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: z.string(),
    outputSchema: TextToSpeechOutputSchema,
  },
  async (query) => {
    try {
        const { media } = await ai.generate({
          model: googleAI.model('gemini-2.5-flash-preview-tts'),
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Algenib' }, // Changed voice model
              },
            },
          },
          prompt: query,
        });

        if (!media) {
          throw new Error("Aucun média n'a été retourné par le service de synthèse vocale.");
        }
        
        const audioBuffer = Buffer.from(
          media.url.substring(media.url.indexOf(',') + 1),
          'base64'
        );

        const wavBase64 = await toWav(audioBuffer);

        return {
          media: 'data:audio/wav;base64,' + wavBase64,
        };
    } catch(e: any) {
        console.error("Erreur dans textToSpeechFlow:", e);
        throw new Error(`Échec de la génération audio : ${e.message}`);
    }
  }
);
