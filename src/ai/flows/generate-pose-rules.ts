'use server';
/**
 * @fileOverview Generates yoga pose analysis rules using AI.
 *
 * - generatePoseRules - A function that creates analysis rules from a pose description.
 * - GeneratePoseRulesInput - The input type for the generatePoseRules function.
 * - GeneratePoseRulesOutput - The return type for the generatePoseRules function.
 */

import { ai } from '@/ai/genkit';
import { KEYPOINTS_MAPPING } from '@/lib/pose-constants';
import { z } from 'genkit';

const keypointNames = Object.keys(KEYPOINTS_MAPPING) as [string, ...string[]];

const GeneratePoseRulesInputSchema = z.object({
  poseName: z.string().describe('The name of the yoga pose.'),
  poseDescription: z.string().describe('A detailed description of how to perform the yoga pose.'),
  photoDataUri: z.string().optional().describe(
    "An optional photo of the pose as a data URI. Format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type GeneratePoseRulesInput = z.infer<typeof GeneratePoseRulesInputSchema>;


const AngleRuleSchema = z.object({
    p1: z.enum(keypointNames).describe('The first keypoint of the angle.'),
    p2: z.enum(keypointNames).describe('The center keypoint (vertex) of the angle.'),
    p3: z.enum(keypointNames).describe('The third keypoint of the angle.'),
    target: z.number().describe('The ideal angle in degrees.'),
    tolerance: z.number().describe('The acceptable tolerance for the angle in degrees.'),
    feedback_low: z.string().describe('Feedback to give when the angle is too small. Should be encouraging and constructive.'),
    feedback_high: z.string().describe('Feedback to give when the angle is too large. Should be encouraging and constructive.'),
    feedback_good: z.string().describe('Feedback to give when the angle is correct. (e.g., "Left knee angle is perfect!").'),
});

const GeneratePoseRulesOutputSchema = z.object({
  rules: z.record(AngleRuleSchema).describe('A dictionary of analysis rules for the pose. The key for each rule should be a descriptive camelCase name (e.g., "leftKneeAngle").'),
});
export type GeneratePoseRulesOutput = z.infer<typeof GeneratePoseRulesOutputSchema>;


export async function generatePoseRules(input: GeneratePoseRulesInput): Promise<GeneratePoseRulesOutput> {
  return generatePoseRulesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePoseRulesPrompt',
  input: { schema: GeneratePoseRulesInputSchema },
  output: { schema: GeneratePoseRulesOutputSchema },
  prompt: `You are a world-class yoga instructor and AI expert. Your task is to analyze a description of a yoga pose and generate a set of rules for real-time pose correction.
{{#if photoDataUri}}
Use both the user's description and the provided photo as the primary source of information. The photo is the reference for the ideal pose.
Photo: {{media url=photoDataUri}}
{{else}}
Use the user's description as the primary source of information to define the rules.
{{/if}}

The user has provided the name and description of a pose. Based on this, generate AT LEAST 2 and AT MOST 4 key angle rules to analyze the pose correctly. Focus on the most critical angles for proper alignment.

For each rule, you must define:
1.  **Three keypoints (p1, p2, p3)** that form the angle. 'p2' is the vertex. Choose from the provided list of valid keypoint names.
2.  The **target** angle in degrees.
3.  A **tolerance** value in degrees (usually between 10 and 20).
4.  **Feedback messages** for when the angle is too low, too high, or correct. The feedback should be encouraging and instructive.

Pose Name: {{{poseName}}}
Pose Description: {{{poseDescription}}}

Generate the rules in the specified JSON format. Ensure all keypoint names are valid.`,
});

const generatePoseRulesFlow = ai.defineFlow(
  {
    name: 'generatePoseRulesFlow',
    inputSchema: GeneratePoseRulesInputSchema,
    outputSchema: GeneratePoseRulesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
