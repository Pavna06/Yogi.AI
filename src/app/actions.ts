'use server';
import { generateYogaPlan, GenerateYogaPlanInput } from '@/features/yoga-plan/flows/generate-yoga-plan';
import { audioFeedbackForPoseCorrection, AudioFeedbackForPoseCorrectionInput } from '@/features/pose-correction/flows/generate-audio-feedback';
import { generatePoseRules, GeneratePoseRulesInput, GeneratePoseRulesOutput } from '@/features/custom-poses/flows/generate-pose-rules';
import { generatePoseImage, GeneratePoseImageInput } from '@/features/custom-poses/flows/generate-pose-image';

export async function getYogaPlan(input: GenerateYogaPlanInput) {
    try {
        const result = await generateYogaPlan(input);
        return { success: true, plan: result.plan };
    } catch (error) {
        console.error('Error generating yoga plan:', error);
        return { success: false, error: 'Failed to generate a new plan. Please try again.' };
    }
}

export async function getAudioFeedback(input: AudioFeedbackForPoseCorrectionInput) {
     try {
        const result = await audioFeedbackForPoseCorrection(input);
        return { success: true, audioDataUri: result.audioDataUri };
    } catch (error) {
        console.error('Error generating audio feedback:', error);
        return { success: false, error: 'Failed to generate audio feedback.' };
    }
}

export async function getAIPoseRules(input: GeneratePoseRulesInput): Promise<{ success: boolean, rules?: GeneratePoseRulesOutput['rules'], error?: string }> {
    try {
        const result = await generatePoseRules(input);
        return { success: true, rules: result.rules };
    } catch (error) {
        console.error('Error generating AI pose rules:', error);
        return { success: false, error: 'Failed to generate AI rules. Please try again.' };
    }
}

export async function getAIPoseImage(input: GeneratePoseImageInput): Promise<{ success: boolean, imageUrl?: string, error?: string }> {
    try {
        const result = await generatePoseImage(input);
        return { success: true, imageUrl: result.imageUrl };
    } catch (error) {
        console.error('Error generating AI pose image:', error);
        return { success: false, error: 'Failed to generate AI image. Please try again.' };
    }
}
