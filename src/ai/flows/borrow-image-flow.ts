'use server';
/**
 * @fileOverview A flow to generate an image based on a text prompt.
 *
 * - borrowImage - A function that generates an image.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export async function borrowImage(promptText: string): Promise<string> {
    return borrowImageFlow(promptText);
}

const borrowImageFlow = ai.defineFlow(
  {
    name: 'borrowImageFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    const { media } = await ai.generate({
        model: googleAI.model('imagen-4.0-fast-generate-001'),
        prompt: `A professional, corporate-style headshot of a person. ${prompt}`,
    });
    
    if (!media.url) {
        throw new Error('Image generation failed to return a URL.');
    }
    
    return media.url;
  }
);
