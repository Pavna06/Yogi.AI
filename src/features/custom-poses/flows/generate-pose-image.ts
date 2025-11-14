'use server';
/**
 * @fileOverview Generates a yoga pose image using AI.
 *
 * This flow is part of the 'Custom Poses' feature.
 *
 * - generatePoseImage - A function that creates an image from a pose description.
 * - GeneratePoseImageInput - The input type for the generatePoseImage function.
 * - GeneratePoseImageOutput - The return type for the generatePoseImage function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';


const GeneratePoseImageInputSchema = z.object({
  poseName: z.string().describe('The name of the yoga pose.'),
  poseDescription: z.string().describe('A detailed description of how to perform the yoga pose.'),
});
export type GeneratePoseImageInput = z.infer<typeof GeneratePoseImageInputSchema>;


const GeneratePoseImageOutputSchema = z.object({
    imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type GeneratePoseImageOutput = z.infer<typeof GeneratePoseImageOutputSchema>;

export async function generatePoseImage(input: GeneratePoseImageInput): Promise<GeneratePoseImageOutput> {
    return generatePoseImageFlow(input);
}


const generatePoseImageFlow = ai.defineFlow(
  {
    name: 'generatePoseImageFlow',
    inputSchema: GeneratePoseImageInputSchema,
    outputSchema: GeneratePoseImageOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
        model: googleAI.model('imagen-4.0-fast-generate-001'),
        prompt: `A clear, full-body photograph of a person demonstrating the yoga pose: "${input.poseName}". The person should be on a simple yoga mat in a clean, minimalist studio with neutral lighting. The style should be realistic and instructional. Pose description: ${input.poseDescription}`,
    });

    if (!media.url) {
        throw new Error('Failed to generate image');
    }

    return {
        imageUrl: media.url,
    };
  }
);
