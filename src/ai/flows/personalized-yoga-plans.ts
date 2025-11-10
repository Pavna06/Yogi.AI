'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized yoga plans.
 *
 * The flow takes a user's goal as input and uses the OpenAI API to generate a tailored yoga plan.
 * It exports:
 *   - generateYogaPlan: The main function to trigger the flow.
 *   - GenerateYogaPlanInput: The input type for the flow.
 *   - GenerateYogaPlanOutput: The output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateYogaPlanInputSchema = z.object({
  goal: z.string().describe('The user\u0027s goal for their yoga plan.'),
});

export type GenerateYogaPlanInput = z.infer<typeof GenerateYogaPlanInputSchema>;

const GenerateYogaPlanOutputSchema = z.object({
  plan: z.string().describe('The generated yoga plan.'),
});

export type GenerateYogaPlanOutput = z.infer<typeof GenerateYogaPlanOutputSchema>;

export async function generateYogaPlan(input: GenerateYogaPlanInput): Promise<GenerateYogaPlanOutput> {
  return generateYogaPlanFlow(input);
}

const generateYogaPlanPrompt = ai.definePrompt({
  name: 'generateYogaPlanPrompt',
  input: { schema: GenerateYogaPlanInputSchema },
  output: { schema: GenerateYogaPlanOutputSchema },
  prompt: `You are a yoga instructor. A user wants a personalized plan. Their goal is: \"{{{goal}}}\". Generate a 5-pose yoga sequence with pose names only, without numbering.`,
});

const generateYogaPlanFlow = ai.defineFlow(
  {
    name: 'generateYogaPlanFlow',
    inputSchema: GenerateYogaPlanInputSchema,
    outputSchema: GenerateYogaPlanOutputSchema,
  },
  async (input) => {
    const { output } = await generateYogaPlanPrompt(input);
    return output!;
  }
);
