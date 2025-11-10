'use server';
import { generateYogaPlan, GenerateYogaPlanInput } from '@/ai/flows/personalized-yoga-plans';
import { audioFeedbackForPoseCorrection, AudioFeedbackForPoseCorrectionInput } from '@/ai/flows/audio-feedback-pose-correction';

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